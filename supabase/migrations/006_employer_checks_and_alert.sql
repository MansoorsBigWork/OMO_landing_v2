-- Migration 006: a company website must be the company's own domain, and OMO gets an
-- email when a new employer confirms their account.
--
-- Run once in Supabase → SQL Editor, after 005. The email also needs the Edge Function
-- in supabase/functions/notify-employer-signup and two Vault secrets; see section 2.

-- ===========================================================================
-- 1. Shared endings like co.uk or ac.uk aren't a company's website
-- ===========================================================================
-- Before this, website "ac.uk" let any student at a UK university sign up as an
-- employer (jo@ox.ac.uk ends in .ac.uk). Kept in step with SHARED_DOMAIN_ENDINGS in
-- src/lib/validation.js. Same function as migration 004, plus the second check.

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
  if company_domain = any (array[
    'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'ac.uk', 'gov.uk', 'sch.uk', 'nhs.uk',
    'police.uk', 'mod.uk', 'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'co.nz', 'org.nz',
    'co.in', 'co.za', 'com.br', 'co.jp', 'com.sg', 'com.hk', 'com.cn', 'co.kr'
  ]) then
    return 'Enter your company’s own website, like acme.co.uk.';
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
-- 2. Email OMO when an employer confirms their account
-- ===========================================================================
-- Fires when the sign-up code is entered (email_confirmed_at goes from empty to set),
-- so OMO only hears about people who really receive mail at the company's domain.
-- It posts the details to the notify-employer-signup Edge Function, which sends the
-- email from admin@onemillionopportunities.com. pg_net sends the request after the
-- transaction, and any failure here only logs a warning: confirming never fails
-- because of the email.
--
-- Once the function is deployed, store its address and a long random secret (the same
-- value as the function's NOTIFY_SECRET) in Vault, in SQL Editor:
--   select vault.create_secret('https://<project ref>.supabase.co/functions/v1/notify-employer-signup', 'notify_employer_signup_url');
--   select vault.create_secret('<random secret>', 'notify_employer_signup_secret');

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_employer_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  details jsonb;
  url     text;
  secret  text;
begin
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then
    return new;
  end if;

  select jsonb_build_object(
           'user_id', p.id,
           'email', new.email,
           'full_name', p.full_name,
           'company_name', ep.company_name,
           'website', ep.website,
           'job_title', ep.job_title,
           'confirmed_at', new.email_confirmed_at
         )
    into details
  from public.profiles p
  join public.employer_profiles ep on ep.id = p.id
  where p.id = new.id and p.role = 'employer';
  if details is null then
    return new; -- not an employer
  end if;

  select s.decrypted_secret into url from vault.decrypted_secrets s where s.name = 'notify_employer_signup_url';
  select s.decrypted_secret into secret from vault.decrypted_secrets s where s.name = 'notify_employer_signup_secret';
  if url is null or secret is null then
    raise warning 'notify_employer_signup: Vault secrets not set, no email sent for %', new.id;
    return new;
  end if;

  perform net.http_post(
    url     := url,
    body    := details,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', secret)
  );
  return new;
exception when others then
  raise warning 'notify_employer_signup failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke execute on function public.notify_employer_signup() from public, anon, authenticated;

drop trigger if exists notify_employer_signup on auth.users;
create trigger notify_employer_signup
  after update of email_confirmed_at on auth.users
  for each row execute function public.notify_employer_signup();
