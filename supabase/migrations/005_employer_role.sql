-- Migration 005: employer sign-ups really become employers.
--
-- Run once in Supabase → SQL Editor, after 004.
--
-- Employers who signed up from the website were landing in the student
-- onboarding quiz: their profiles row came out as role 'student', so
-- handle_new_user (migration 001, not in this repo) isn't turning the sign-up
-- data's role: employer into an employer account. Rather than rewrite a
-- function we can't see, these triggers correct its rows as they're written:
--
--   * profiles      a sign-up whose data says role: employer is stored as 'employer'
--   * student_profiles  that sign-up gets no student row; it gets an employer_profiles
--                   row instead (migration 004's trigger fills in the company details)
--
-- Only accounts that passed migration 004's work-email check carry role: employer
-- (the hook and the auth.users trigger refuse the rest), so this can't be used to
-- make a Gmail address an employer. Employers still start unverified.
--
-- Section 3 fixes accounts that already signed up as employers and came out as students.

-- Was this user created by an employer sign-up?
create or replace function public.signed_up_as_employer(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.raw_user_meta_data ->> 'role' = 'employer' from auth.users u where u.id = user_id),
    false
  );
$$;

revoke execute on function public.signed_up_as_employer(uuid) from public, anon, authenticated;

-- ===========================================================================
-- 1. profiles: role follows the sign-up
-- ===========================================================================

create or replace function public.employer_signup_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role::text = 'student' and public.signed_up_as_employer(new.id) then
    new.role := 'employer';
  end if;
  return new;
end;
$$;

revoke execute on function public.employer_signup_role() from public, anon, authenticated;

drop trigger if exists employer_signup_role on public.profiles;
create trigger employer_signup_role
  before insert on public.profiles
  for each row execute function public.employer_signup_role();

-- ===========================================================================
-- 2. student_profiles: employers get an employer row instead
-- ===========================================================================

create or replace function public.employer_signup_skip_student_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.signed_up_as_employer(new.id) then
    insert into public.employer_profiles (id) values (new.id) on conflict (id) do nothing;
    return null; -- skip the student row
  end if;
  return new;
end;
$$;

revoke execute on function public.employer_signup_skip_student_row() from public, anon, authenticated;

drop trigger if exists employer_signup_skip_student_row on public.student_profiles;
create trigger employer_signup_skip_student_row
  before insert on public.student_profiles
  for each row execute function public.employer_signup_skip_student_row();

-- ===========================================================================
-- 3. Fix employer sign-ups that already came out as students
-- ===========================================================================
-- Only accounts whose email passes the company-domain rule are converted; any
-- other "role: employer" sign-up predates the check and stays a student.

do $$
declare
  account record;
begin
  for account in
    select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.raw_user_meta_data ->> 'role' = 'employer'
      and p.role::text = 'student'
      and coalesce(btrim(u.raw_user_meta_data ->> 'company_name'), '') <> ''
      and public.employer_email_problem(u.email, u.raw_user_meta_data ->> 'website') is null
  loop
    update public.profiles set role = 'employer' where id = account.id;
    -- The insert trigger from 004 fills in company name, website and job title
    insert into public.employer_profiles (id) values (account.id) on conflict (id) do nothing;
    delete from public.student_profiles where id = account.id and onboarding_completed_at is null;
    raise notice 'Made % an employer', account.id;
  end loop;
end;
$$;
