import { supabase } from "../../../lib/supabase.js";

/* Student progress for one OMOship, backed by the tables from
   supabase/migrations/003_omoships.sql:

     omoships             one row per course; the slug matches the course folder
     enrolments           one row per student per course
     omoship_progress     key/value rows: welcome seen, intro answers, task state
     submissions          one row per student per course; links only from the browser
     submission_results   scores and feedback, visible once OMO releases them

   The course shell calls loadProgress() once before any course page
   renders, so every read below is synchronous against an in-memory copy.
   Writes update that copy at once and are sent to Supabase afterwards;
   writes to the same key are queued so they land in order. Enrolment and
   submission are the two writes a page waits on, because the student
   must know if they failed. */

export interface AnswerRecord {
  chosen: string;
  correct: boolean;
  answeredAt: number;
}

export interface SlideTaskState {
  walkthroughDone: boolean;
  /* Decision per statement id, in the order they were made. */
  decisions: Record<string, "strength" | "weakness" | "na">;
  decidedOrder: string[];
  checksUsed: number;
  firstCheckScore: number | null;
  revealed: boolean;
  locked: string[];
}

export interface BuildPageState {
  prereqs: string[];
  readSections: string[];
  scroll: number;
}

/* status follows the platform: submitted, marked (scores entered, not yet
   visible) or released (the student can see score and feedback). */
export interface Submission {
  repoUrl: string;
  videoUrl: string;
  submittedAt: number;
  firstSubmittedAt: number;
  status: "submitted" | "marked" | "released";
  score: number | null;
  feedback: string | null;
}

/* What the portal shows per course before the student opens it. */
export interface CourseSummary {
  enrolledAt: number | null;
  submission: Pick<Submission, "status" | "submittedAt"> | null;
}

interface SubmissionRow {
  repo_url: string | null;
  video_url: string;
  status: Submission["status"];
  submitted_at: string;
  updated_at: string;
}

interface ResultRow {
  total_score: number | null;
  project_feedback: string | null;
  video_feedback: string | null;
}

interface Store {
  uid: string;
  slug: string;
  omoshipId: string;
  deadline: number | null;
  enrolledAt: number | null;
  progress: Record<string, unknown>;
  submission: Submission | null;
}

let store: Store | null = null;

const SUBMISSION_COLUMNS = "repo_url, video_url, status, submitted_at, updated_at";
const RESULT_COLUMNS = "total_score, project_feedback, video_feedback";

function client() {
  if (!supabase) throw new Error("Sign-in is not set up, so course progress cannot be saved.");
  return supabase;
}

function toSubmission(row: SubmissionRow, result: ResultRow | null): Submission {
  const feedback = [result?.project_feedback, result?.video_feedback].filter(Boolean).join("\n\n");
  return {
    repoUrl: row.repo_url ?? "",
    videoUrl: row.video_url,
    submittedAt: Date.parse(row.updated_at),
    firstSubmittedAt: Date.parse(row.submitted_at),
    status: row.status,
    score: result?.total_score ?? null,
    feedback: feedback || null,
  };
}

/* Loads the signed-in student's rows for one course. Safe to call again:
   the copy is replaced, never merged. */
export async function loadProgress(uid: string, slug: string): Promise<void> {
  const db = client();
  const omoship = await db.from("omoships").select("id, deadline").eq("slug", slug).maybeSingle();
  if (omoship.error) throw new Error(omoship.error.message);
  if (!omoship.data) throw new Error(`This OMOship (${slug}) is not set up in the database yet.`);
  const omoshipId: string = omoship.data.id;

  const [enrolment, progress, submission, result] = await Promise.all([
    db.from("enrolments").select("enrolled_at").eq("omoship_id", omoshipId).eq("student_id", uid).maybeSingle(),
    db.from("omoship_progress").select("key, value").eq("omoship_id", omoshipId).eq("student_id", uid),
    db.from("submissions").select(SUBMISSION_COLUMNS).eq("omoship_id", omoshipId).eq("student_id", uid).maybeSingle(),
    db.from("submission_results").select(RESULT_COLUMNS).eq("omoship_id", omoshipId).eq("student_id", uid).maybeSingle(),
  ]);
  const failed = enrolment.error ?? progress.error ?? submission.error ?? result.error;
  if (failed) throw new Error(failed.message);

  store = {
    uid,
    slug,
    omoshipId,
    deadline: omoship.data.deadline ? Date.parse(omoship.data.deadline) : null,
    enrolledAt: enrolment.data ? Date.parse(enrolment.data.enrolled_at) : null,
    progress: Object.fromEntries((progress.data ?? []).map((row) => [row.key, row.value])),
    submission: submission.data ? toSubmission(submission.data as SubmissionRow, result.data as ResultRow | null) : null,
  };
}

export function clearProgress(): void {
  store = null;
}

/* Enrolment and submission status for every course, for the portal card. */
export async function loadCourseSummaries(uid: string): Promise<Record<string, CourseSummary>> {
  const db = client();
  const [enrolments, submissions] = await Promise.all([
    db.from("enrolments").select("enrolled_at, omoships!inner(slug)").eq("student_id", uid),
    db.from("submissions").select("status, updated_at, omoships!inner(slug)").eq("student_id", uid),
  ]);
  const failed = enrolments.error ?? submissions.error;
  if (failed) throw new Error(failed.message);

  /* PostgREST returns the embedded parent as an object for a many-to-one join */
  const slugOf = (row: { omoships: unknown }) => (row.omoships as { slug: string }).slug;

  const summaries: Record<string, CourseSummary> = {};
  for (const row of enrolments.data ?? []) {
    summaries[slugOf(row)] = { enrolledAt: Date.parse(row.enrolled_at), submission: null };
  }
  for (const row of submissions.data ?? []) {
    const slug = slugOf(row);
    const summary = summaries[slug] ?? { enrolledAt: null, submission: null };
    summary.submission = { status: row.status as Submission["status"], submittedAt: Date.parse(row.updated_at) };
    summaries[slug] = summary;
  }
  return summaries;
}

/* ---- The in-memory copy ---- */

function current(slug: string): Store | null {
  return store && store.slug === slug ? store : null;
}

function read<T>(slug: string, key: string): T | null {
  const value = current(slug)?.progress[key];
  return value === undefined || value === null ? null : (value as T);
}

/* Writes to one key wait for the previous write to that key, so a burst
   of saves (the build page's scroll position, a run of sort decisions)
   reaches the table in order. Failures are logged and never block the
   page: the in-memory copy is already updated. */
const queues = new Map<string, Promise<void>>();

function enqueue(key: string, job: () => Promise<void>): Promise<void> {
  const next = (queues.get(key) ?? Promise.resolve()).then(job).catch((error: Error) => {
    console.warn("[progress] could not save", key, error.message);
  });
  queues.set(key, next);
  return next;
}

function write(slug: string, key: string, value: unknown): void {
  const s = current(slug);
  if (!s) return;
  s.progress[key] = value;
  const { uid, omoshipId } = s;
  void enqueue(`${slug}/${key}`, async () => {
    const { error } = await client()
      .from("omoship_progress")
      .upsert({ omoship_id: omoshipId, student_id: uid, key, value }, { onConflict: "omoship_id,student_id,key" });
    if (error) throw new Error(error.message);
  });
}

/* The signed-in student's id, used to seed per-student option orders */
export function studentSeed(slug: string): string {
  return current(slug)?.uid ?? "";
}

/* ---- Enrolment ---- */

export function isEnrolled(slug: string): boolean {
  return current(slug)?.enrolledAt != null;
}

export function enrolledAt(slug: string): number | null {
  return current(slug)?.enrolledAt ?? null;
}

/* The course's fixed deadline, or null when it is 14 days from enrolment */
export function courseDeadline(slug: string): number | null {
  return current(slug)?.deadline ?? null;
}

/* Waited on: the overview page shows an error if the row is not saved. */
export async function recordEnrolment(slug: string): Promise<void> {
  const s = current(slug);
  if (!s) throw new Error("Course progress has not loaded.");
  if (s.enrolledAt != null) return;
  const { data, error } = await client()
    .from("enrolments")
    .insert({ omoship_id: s.omoshipId, student_id: s.uid })
    .select("enrolled_at")
    .single();
  if (error) throw new Error(error.message);
  s.enrolledAt = Date.parse(data.enrolled_at);
}

/* ---- Welcome, interlude and intro ---- */

export function hasSeenWelcome(slug: string): boolean {
  return read<number>(slug, "welcome_seen_at") !== null;
}

/* Fire and forget: navigation never waits on this write. */
export function recordWelcomeSeen(slug: string): void {
  write(slug, "welcome_seen_at", Date.now());
}

export function hasSeenInterlude(slug: string): boolean {
  return read<number>(slug, "interlude_seen_at") !== null;
}

/* Fire and forget: navigation never waits on this write. */
export function recordInterludeSeen(slug: string): void {
  write(slug, "interlude_seen_at", Date.now());
}

export function readAnswers(slug: string): Record<string, AnswerRecord> {
  return read<Record<string, AnswerRecord>>(slug, "intro/answers") ?? {};
}

export function recordAnswer(slug: string, questionId: string, answer: AnswerRecord): void {
  write(slug, "intro/answers", { ...readAnswers(slug), [questionId]: answer });
}

export function hasCompletedIntro(slug: string): boolean {
  return read<number>(slug, "intro/completed_at") !== null;
}

export function recordIntroCompletion(slug: string): void {
  if (!hasCompletedIntro(slug)) write(slug, "intro/completed_at", Date.now());
}

/* ---- Tasks ---- */

export function readTaskState(slug: string, task: string): Record<string, SlideTaskState> {
  return read<Record<string, SlideTaskState>>(slug, `tasks/${task}/state`) ?? {};
}

export function recordTaskSlideState(slug: string, task: string, slideId: string, state: SlideTaskState): void {
  write(slug, `tasks/${task}/state`, { ...readTaskState(slug, task), [slideId]: state });
}

export function hasCompletedTask(slug: string, task: string): boolean {
  return read<number>(slug, `tasks/${task}/completed_at`) !== null;
}

export function recordTaskCompletion(slug: string, task: string): void {
  write(slug, `tasks/${task}/completed_at`, Date.now());
}

const BUILD_TASK = "week-1-build";

export function readBuildState(slug: string): BuildPageState {
  return read<BuildPageState>(slug, `tasks/${BUILD_TASK}/state`) ?? { prereqs: [], readSections: [], scroll: 0 };
}

export function recordBuildState(slug: string, state: BuildPageState): void {
  write(slug, `tasks/${BUILD_TASK}/state`, state);
}

/* ---- Submission ---- */

export function readSubmission(slug: string): Submission | null {
  return current(slug)?.submission ?? null;
}

/* Waited on: the form shows an error if the row is not saved. One row per
   student per course; a resubmission replaces the links and keeps
   submitted_at. Scores, feedback and status are only ever set by OMO, and
   the database refuses a student's change to them or to a marked row. */
export async function recordSubmission(slug: string, repoUrl: string, videoUrl: string): Promise<Submission> {
  const s = current(slug);
  if (!s) throw new Error("Course progress has not loaded.");
  const db = client();

  const { data, error } = s.submission
    ? await db
        .from("submissions")
        .update({ repo_url: repoUrl, video_url: videoUrl })
        .eq("omoship_id", s.omoshipId)
        .eq("student_id", s.uid)
        .select(SUBMISSION_COLUMNS)
        .single()
    : await db
        .from("submissions")
        .insert({ omoship_id: s.omoshipId, student_id: s.uid, repo_url: repoUrl, video_url: videoUrl })
        .select(SUBMISSION_COLUMNS)
        .single();
  if (error) throw new Error(error.message);

  s.submission = toSubmission(data as SubmissionRow, null);
  return s.submission;
}
