-- Migration 003: organisations, OMOships, enrolments, progress, submissions
-- and the submissions storage bucket.
--
-- Run once in Supabase → SQL Editor, after migration 001 (it does not
-- depend on 002). Uses the helpers 001 created: public.is_admin() and
-- public.is_verified_employer().
--
-- Departures from the 25 September brief, made so the first course works:
--   omoships.slug          the course code looks its row up by slug
--   omoships.deadline      nullable; null means 14 days from each student's enrolment
--   submissions.repo_url   a public GitHub repository, for code OMOships; either
--                          project_path (a file in the bucket) or repo_url is required
--   enrolments, omoship_progress   the course records where each student is up to
--
-- The website reads and writes these through src/courses/shared/lib/progressStore.ts.

-- ===========================================================================
-- 1. Organisations
-- ===========================================================================

create table public.organisations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  website     text,
  is_verified boolean     not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.organisations is 'Employer organisations that own OMOships. is_verified is set by admins only.';

alter table public.employer_profiles
  add column organisation_id uuid references public.organisations (id);

-- The caller's organisation, for employer visibility rules
create or replace function public.current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from public.employer_profiles where id = auth.uid();
$$;

revoke execute on function public.current_organisation_id() from public;
grant execute on function public.current_organisation_id() to authenticated;

-- ===========================================================================
-- 2. OMOships
-- ===========================================================================

create table public.omoships (
  id                 uuid        primary key default gen_random_uuid(),
  slug               text        not null unique,
  organisation_id    uuid        references public.organisations (id),
  title              text        not null,
  brief              text,
  deadline           timestamptz,
  results_visibility text        not null default 'shared'
                     check (results_visibility in ('shared', 'owner_only')),
  created_at         timestamptz not null default now()
);

comment on table public.omoships is 'One row per OMOship. slug matches src/courses/<slug>/course.ts. A null deadline means 14 days from each student''s enrolment.';

-- ===========================================================================
-- 3. Enrolments and progress
-- ===========================================================================

create table public.enrolments (
  omoship_id  uuid        not null references public.omoships (id) on delete cascade,
  student_id  uuid        not null references public.student_profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (omoship_id, student_id)
);

comment on table public.enrolments is 'Which students have enrolled on which OMOships.';

-- Keys written by the course code (values are JSON):
--   welcome_seen_at, interlude_seen_at, intro/completed_at   number (ms since epoch)
--   intro/answers                                            { [questionId]: { chosen, correct, answeredAt } }
--   tasks/<task>/state                                       per-slide or per-page state
--   tasks/<task>/completed_at                                number (ms since epoch)
create table public.omoship_progress (
  omoship_id uuid        not null references public.omoships (id) on delete cascade,
  student_id uuid        not null references public.student_profiles (id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (omoship_id, student_id, key)
);

comment on table public.omoship_progress is 'Fine-grained course progress, one JSON value per key. The shape is owned by the course code.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger omoship_progress_touch
  before update on public.omoship_progress
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- 4. Submissions
-- ===========================================================================

create table public.submissions (
  id               uuid        primary key default gen_random_uuid(),
  omoship_id       uuid        not null references public.omoships (id) on delete cascade,
  student_id       uuid        not null references public.student_profiles (id) on delete cascade,
  project_path     text,
  repo_url         text,
  video_url        text        not null,
  project_score    int         check (project_score between 0 and 50),
  video_score      int         check (video_score between 0 and 50),
  project_feedback text,
  video_feedback   text,
  total_score      int         generated always as (
                     case when project_score is not null and video_score is not null
                          then project_score + video_score end) stored,
  status           text        not null default 'submitted'
                   check (status in ('submitted', 'marked', 'released')),
  submitted_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  released_at      timestamptz,
  unique (omoship_id, student_id),
  constraint submissions_has_work
    check (project_path is not null or repo_url is not null),
  constraint submissions_video_url_check
    check (video_url like 'https://drive.google.com/%'),
  constraint submissions_repo_url_check
    check (repo_url is null or repo_url ~ '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$')
);

comment on table public.submissions is 'One row per student per OMOship. submitted_at is the first submission, updated_at the latest change to the links. Scores, feedback and status are set by admins through mark_submission().';

create index submissions_by_omoship on public.submissions (omoship_id, status);

-- What a student may do to a submission. Admins skip the checks; releasing
-- a submission stamps released_at.
create or replace function public.guard_submission()
returns trigger
language plpgsql
as $$
declare
  closes_at timestamptz;
begin
  if public.is_admin() then
    if tg_op = 'UPDATE' and new.status = 'released' and old.status <> 'released' and new.released_at is null then
      new.released_at := now();
    end if;
    return new;
  end if;

  if new.student_id <> auth.uid() then
    raise exception 'You can only submit your own work';
  end if;

  select coalesce(o.deadline, e.enrolled_at + interval '14 days') into closes_at
    from public.enrolments e
    join public.omoships o on o.id = e.omoship_id
   where e.omoship_id = new.omoship_id and e.student_id = new.student_id;

  if closes_at is null then
    raise exception 'Enrol on the OMOship before submitting';
  end if;
  if now() > closes_at then
    raise exception 'Submissions for this OMOship have closed';
  end if;

  if tg_op = 'INSERT' then
    new.status := 'submitted';
    new.project_score := null;
    new.video_score := null;
    new.project_feedback := null;
    new.video_feedback := null;
    new.released_at := null;
    new.submitted_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE: only the work links may change, and only while unmarked
  if old.status <> 'submitted' then
    raise exception 'This submission has been marked and can no longer be changed';
  end if;
  if new.omoship_id <> old.omoship_id
     or new.student_id <> old.student_id
     or new.submitted_at <> old.submitted_at
     or new.status <> old.status
     or new.project_score is distinct from old.project_score
     or new.video_score is distinct from old.video_score
     or new.project_feedback is distinct from old.project_feedback
     or new.video_feedback is distinct from old.video_feedback
     or new.released_at is distinct from old.released_at then
    raise exception 'Only OMO can change those fields';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger submissions_guard
  before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- Marking, for admins. Runs as the table owner so the column grants below
-- (which keep scores out of reach of the browser) do not apply to it.
create or replace function public.mark_submission(
  submission_id    uuid,
  project_score    int,
  video_score      int,
  project_feedback text,
  video_feedback   text,
  new_status       text default 'marked'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only OMO can mark submissions';
  end if;
  if new_status not in ('marked', 'released') then
    raise exception 'Status must be marked or released';
  end if;
  update public.submissions s
     set project_score    = mark_submission.project_score,
         video_score      = mark_submission.video_score,
         project_feedback = mark_submission.project_feedback,
         video_feedback   = mark_submission.video_feedback,
         status           = new_status
   where s.id = submission_id;
  if not found then
    raise exception 'No submission with that id';
  end if;
end;
$$;

revoke execute on function public.mark_submission(uuid, int, int, text, text, text) from public;
grant execute on function public.mark_submission(uuid, int, int, text, text, text) to authenticated;

-- Results, with who may see them decided here: admins always; a student
-- once their own submission is released; verified employers, released
-- rows on shared OMOships or their own organisation's. The view runs as
-- its owner, so this where clause is the whole gate.
--
-- It must keep running as its owner (the default). Supabase's linter will
-- suggest `security_invoker = true`; do not apply it. Signed-in users have
-- no column privileges on the score and feedback columns of submissions
-- (that is how early marks stay hidden), so an invoker-rights view fails
-- with "permission denied for table submissions" for everyone.
create view public.submission_results with (security_barrier = true) as
  select s.id, s.omoship_id, s.student_id, s.project_path, s.repo_url, s.video_url, s.status,
         s.submitted_at, s.updated_at, s.released_at,
         s.project_score, s.video_score, s.total_score, s.project_feedback, s.video_feedback
    from public.submissions s
    join public.omoships o on o.id = s.omoship_id
   where public.is_admin()
      or (s.status = 'released' and s.student_id = auth.uid())
      or (s.status = 'released' and public.is_verified_employer()
          and (o.results_visibility = 'shared' or o.organisation_id = public.current_organisation_id()));

comment on view public.submission_results is 'Scores and feedback, visible to admins, to the student once released, and to verified employers by OMOship visibility.';

-- ===========================================================================
-- 5. Access
-- ===========================================================================

alter table public.organisations    enable row level security;
alter table public.omoships         enable row level security;
alter table public.enrolments       enable row level security;
alter table public.omoship_progress enable row level security;
alter table public.submissions      enable row level security;

revoke all on public.organisations, public.omoships, public.enrolments, public.omoship_progress,
              public.submissions, public.submission_results
  from anon, authenticated;

grant select                 on public.organisations      to authenticated;
grant select                 on public.omoships           to authenticated;
grant select, insert         on public.enrolments         to authenticated;
grant select, insert, update on public.omoship_progress   to authenticated;
grant select                 on public.submission_results to authenticated;

-- The browser never reads or writes scores, feedback or status on the base
-- table; results come from submission_results and marks go through mark_submission.
grant select (id, omoship_id, student_id, project_path, repo_url, video_url, status, submitted_at, updated_at, released_at),
      insert (omoship_id, student_id, project_path, repo_url, video_url),
      update (project_path, repo_url, video_url)
  on public.submissions to authenticated;

-- Organisations and OMOships: everyone signed in can read; admins write
-- (through the dashboard or a future admin screen; grants above give the
-- browser read-only access, so admin writes go through OMO's tools).
create policy "Signed-in users read organisations"
  on public.organisations for select to authenticated using (true);

create policy "Signed-in users read OMOships"
  on public.omoships for select to authenticated using (true);

-- Enrolments: a student's own, admins all
create policy "Students read their own enrolments, admins read all"
  on public.enrolments for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy "Students enrol themselves"
  on public.enrolments for insert to authenticated
  with check (student_id = auth.uid());

-- Progress: a student's own, admins all
create policy "Students read their own progress, admins read all"
  on public.omoship_progress for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy "Students write their own progress"
  on public.omoship_progress for insert to authenticated
  with check (student_id = auth.uid());

create policy "Students update their own progress"
  on public.omoship_progress for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Submissions: a student's own row, admins all. Employers use submission_results.
create policy "Students read their own submissions, admins read all"
  on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

create policy "Students submit their own work"
  on public.submissions for insert to authenticated
  with check (student_id = auth.uid());

create policy "Students replace their own links, admins update"
  on public.submissions for update to authenticated
  using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

-- ===========================================================================
-- 6. Storage: project files
-- ===========================================================================
-- Path inside the bucket: <omoship_id>/<student_id>/<filename>. Private;
-- serve with createSignedUrl. Videos are Drive links, never uploaded.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions', 'submissions', false, 26214400,
  array[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

create policy "Students manage their own submission files"
  on storage.objects for all to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "Admins read all submission files"
  on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.is_admin());

create policy "Verified employers read submission files by OMOship visibility"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_verified_employer()
    and exists (
      select 1 from public.omoships o
       where o.id::text = (storage.foldername(name))[1]
         and (o.results_visibility = 'shared' or o.organisation_id = public.current_organisation_id())
    )
  );

-- ===========================================================================
-- 7. The first OMOship
-- ===========================================================================
-- The organisation is a placeholder until the partner is confirmed; an
-- admin can repoint organisation_id later.

insert into public.organisations (id, name, website, is_verified)
values ('11111111-1111-4111-8111-111111111111', 'One Million Opportunities', 'https://onemillionopportunities.com', true);

insert into public.omoships (slug, organisation_id, title, brief, deadline, results_visibility)
values (
  'uk-delivery-network',
  '11111111-1111-4111-8111-111111111111',
  'The Last Mile: Inside the UK Delivery Network',
  'Replace the naive planner in the omo-last-mile-starter with one that assigns, routes and replans deliveries for Kestrel Parcels, and submit the repository with a two-minute video.',
  null,
  'shared'
);
