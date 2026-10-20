-- Migration 007: OMO makes employer accounts; nobody signs up as one.
--
-- Run once in Supabase → SQL Editor, after 006.
--
-- Replaces self-service employer sign-up (004) and the sign-up email (006). Employer
-- accounts are demo logins OMO hands to each company: they see the sample dashboard
-- and stay unverified, so the database never lets them read real students.
--
-- To give a company a login:
--   1. Authentication → Users → Add user → Create new user: their email and a password,
--      with "Auto Confirm User" ticked. (Students are made by default, so step 2 follows.)
--   2. SQL Editor:
--        select public.make_employer('jo@acme.com', 'Jo Bloggs', 'Acme Ltd', 'acme.com', 'Head of Talent');
--   3. Send them the email and password. They can change it with "Forgot password".
-- Only someone in SQL Editor (or with the service key) can run make_employer.

-- ===========================================================================
-- 1. Refuse employer sign-ups from the website or the API
-- ===========================================================================

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if event -> 'user' -> 'user_metadata' ->> 'role' is distinct from 'employer' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 400,
    'message', 'Employer accounts are set up by OMO. Email buildingomo@gmail.com and we’ll make yours.'
  ));
end;
$$;

-- The same, if the hook is ever switched off. An employer changing their email later
-- must still stay on their company's domain (unchanged from 004).
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
    if new.raw_user_meta_data ->> 'role' is distinct from 'employer' then
      return new;
    end if;
    raise exception 'Employer accounts are set up by OMO' using errcode = 'check_violation';
  end if;

  if new.email is not distinct from old.email then
    return new;
  end if;
  select ep.website into website
  from public.employer_profiles ep
  join public.profiles p on p.id = ep.id
  where ep.id = new.id and p.role = 'employer';
  if not found or website is null then
    return new;
  end if;
  problem := public.employer_email_problem(new.email, website);
  if problem is not null then
    raise exception '%', problem using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- 2. No sign-up email any more
-- ===========================================================================

drop trigger if exists notify_employer_signup on auth.users;
drop function if exists public.notify_employer_signup();
delete from vault.secrets where name in ('notify_employer_signup_url', 'notify_employer_signup_secret');

-- ===========================================================================
-- 3. Turn a user OMO created into an employer
-- ===========================================================================
-- Never touches is_verified: a demo employer sees sample data only.

create or replace function public.make_employer(
  account_email text,
  full_name     text,
  company_name  text,
  website       text default null,
  job_title     text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid;
begin
  select u.id into account_id from auth.users u where lower(u.email) = lower(btrim(account_email));
  if account_id is null then
    raise exception 'No user %. Add them first under Authentication → Users → Add user.', account_email;
  end if;
  if exists (select 1 from public.profiles p where p.id = account_id and p.role = 'admin') then
    raise exception '% is an admin; leaving them as they are.', account_email;
  end if;

  update public.profiles p
     set role = 'employer',
         full_name = coalesce(nullif(btrim(make_employer.full_name), ''), p.full_name)
   where p.id = account_id;

  insert into public.employer_profiles as ep (id, company_name, website, job_title)
  values (account_id, nullif(btrim(company_name), ''), public.website_domain(website), nullif(btrim(job_title), ''))
  on conflict (id) do update
    set company_name = coalesce(excluded.company_name, ep.company_name),
        website      = coalesce(excluded.website, ep.website),
        job_title    = coalesce(excluded.job_title, ep.job_title);

  -- The student row handle_new_user made, as long as they never used it
  delete from public.student_profiles where id = account_id and onboarding_completed_at is null;

  return account_email || ' is now an employer (demo: sample dashboard, unverified)';
end;
$$;

revoke execute on function public.make_employer(text, text, text, text, text) from public, anon, authenticated;
