-- Migration 004: employer sign-up from the website, with a work email that must
-- be on the company's own domain.
--
-- Also checks, at sign-in, that the account matches the Student / Employer side
-- chosen (section 5).
--
-- Run once in Supabase → SQL Editor, after migration 001. Then switch on the hook:
--   Authentication → Hooks → "Before User Created" → Postgres → public.hook_before_user_created
-- The hook turns a bad email into a clear 400 message on the sign-up form. The
-- trigger in section 3 enforces the same rule even if the hook is switched off
-- (the sign-up then fails with Supabase's generic "Database error saving new user").
--
-- The rule (kept in step with validateWorkEmail in src/lib/validation.js):
--   * the company website must look like a domain (scheme, www., path and port are ignored)
--   * the email must not be on a personal mailbox provider (gmail.com, outlook.com, …)
--   * the email's domain must equal the website's domain, or be a subdomain of it
--     (jo@uk.acme.com is fine for acme.com)
-- Employers still start with employer_profiles.is_verified = false; an admin
-- checks the company before they can see students. This only stops the obvious
-- mismatch, it doesn't prove the person works there (confirming the email does
-- that part: they must receive mail at the company's domain).

-- ===========================================================================
-- 1. The rule
-- ===========================================================================

create or replace function public.website_domain(website text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when host ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$' then host
    else null
  end
  from (
    select regexp_replace(
             regexp_replace(
               split_part(split_part(split_part(
                 regexp_replace(lower(btrim(coalesce(website, ''))), '^[a-z]+://', ''),
               '/', 1), '?', 1), '#', 1),
             ':\d+$', ''),
           '^www\.', '') as host
  ) as parsed;
$$;

-- Returns why an employer's email can't be used, or null when it's fine. The messages
-- are shown on the sign-up form, so they're written for the person signing up.
create or replace function public.employer_email_problem(email text, website text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  email_domain   text := lower(split_part(btrim(coalesce(email, '')), '@', 2));
  company_domain text := public.website_domain(website);
begin
  if company_domain is null then
    return 'Enter your company’s website, like acme.com.';
  end if;
  if email_domain = any (array[
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk',
    'msn.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
    'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.co.uk', 'mail.com', 'zoho.com', 'yandex.com',
    'btinternet.com', 'sky.com', 'virginmedia.com', 'talktalk.net', 'tutanota.com', 'fastmail.com', 'hey.com'
  ]) then
    return 'Use your work email, not a personal address.';
  end if;
  if email_domain = company_domain or email_domain like '%.' || company_domain then
    return null;
  end if;
  return 'This email doesn’t match your company. Use an address ending @' || company_domain || '.';
end;
$$;

-- ===========================================================================
-- 2. Before User Created hook: rejects the sign-up with a readable message
-- ===========================================================================

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  meta    jsonb := coalesce(event -> 'user' -> 'user_metadata', '{}'::jsonb);
  problem text;
begin
  if meta ->> 'role' is distinct from 'employer' then
    return '{}'::jsonb;
  end if;
  if coalesce(btrim(meta ->> 'company_name'), '') = '' then
    problem := 'Enter your company’s name.';
  else
    problem := public.employer_email_problem(event -> 'user' ->> 'email', meta ->> 'website');
  end if;
  if problem is null then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 400, 'message', problem));
end;
$$;

-- Only Supabase Auth calls the hook
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;

-- ===========================================================================
-- 3. Backstop on auth.users: the same rule, whether or not the hook is on
-- ===========================================================================

create or replace function public.enforce_employer_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  website text;
  problem text;
begin
  if tg_op = 'INSERT' then
    -- A self-service employer sign-up (handle_new_user reads the same role field)
    if new.raw_user_meta_data ->> 'role' is distinct from 'employer' then
      return new;
    end if;
    if coalesce(btrim(new.raw_user_meta_data ->> 'company_name'), '') = '' then
      raise exception 'Employer sign-up needs a company name' using errcode = 'check_violation';
    end if;
    website := new.raw_user_meta_data ->> 'website';
  else
    -- An employer changing their email later must stay on the company's domain
    if new.email is not distinct from old.email then
      return new;
    end if;
    select ep.website into website
    from public.employer_profiles ep
    join public.profiles p on p.id = ep.id
    where ep.id = new.id and p.role = 'employer';
    if not found or website is null then
      return new; -- not an employer, or an older account with no website on file
    end if;
  end if;

  problem := public.employer_email_problem(new.email, website);
  if problem is not null then
    raise exception '%', problem using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_employer_email() from public, anon, authenticated;

drop trigger if exists enforce_employer_email on auth.users;
create trigger enforce_employer_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_employer_email();

-- ===========================================================================
-- 4. Keep the company details given at sign-up
-- ===========================================================================
-- handle_new_user (migration 001) creates the employer_profiles row. This fills
-- in company name, website (normalised to its domain) and job title from the
-- sign-up form wherever that row left them empty. is_verified is never touched.

create or replace function public.fill_employer_profile_from_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
begin
  select u.raw_user_meta_data into meta from auth.users u where u.id = new.id;
  if meta is null or meta ->> 'role' is distinct from 'employer' then
    return new;
  end if;
  new.company_name := coalesce(nullif(btrim(new.company_name), ''), nullif(btrim(meta ->> 'company_name'), ''));
  new.website      := coalesce(nullif(btrim(new.website), ''), public.website_domain(meta ->> 'website'));
  new.job_title    := coalesce(nullif(btrim(new.job_title), ''), nullif(btrim(meta ->> 'job_title'), ''));
  return new;
end;
$$;

revoke execute on function public.fill_employer_profile_from_signup() from public, anon, authenticated;

drop trigger if exists fill_employer_profile_from_signup on public.employer_profiles;
create trigger fill_employer_profile_from_signup
  before insert on public.employer_profiles
  for each row execute function public.fill_employer_profile_from_signup();

-- ===========================================================================
-- 5. Sign-in: a student can't come in through the Employer side, or the reverse
-- ===========================================================================
-- Supabase's password sign-in can't carry which side of the Student / Employer
-- switch was chosen, so the website calls this straight after signing in, with
-- that side. It checks the role the database holds (never anything the browser
-- sends), and on a mismatch the website signs the session out and shows the
-- message. Admins may use either side. What a signed-in user can read is still
-- decided by their role in the row-level security policies, so a student
-- session never sees employer data whichever side they picked.

create or replace function public.check_sign_in_side(side text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  account_role text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  if side is null or side not in ('student', 'employer') then
    raise exception 'Unknown account type' using errcode = '22023';
  end if;

  select p.role::text into account_role from public.profiles p where p.id = auth.uid();
  if account_role is null then
    raise exception 'We couldn’t find your account. Please try again.' using errcode = 'P0002';
  end if;

  if account_role = 'admin' or account_role = side then
    return account_role;
  end if;
  if side = 'employer' then
    raise exception 'This is a student account. Switch to Student to sign in.' using errcode = '42501';
  end if;
  raise exception 'This is an employer account. Switch to Employer to sign in.' using errcode = '42501';
end;
$$;

revoke execute on function public.check_sign_in_side(text) from public, anon;
grant execute on function public.check_sign_in_side(text) to authenticated;
