import { useCallback, useMemo, useState } from "react";
import { starter, submission } from "./data";
import { ukDeliveryNetwork as course } from "../course";
import { capture } from "../../shared/lib/analytics";
import { courseDeadline, enrolledAt, readSubmission, recordSubmission, type Submission } from "../../shared/lib/progressStore";

/* The two-link submission (Build Brief B, Part 7.3). Client-side
   validation, then a reachability check on the repository through the
   GitHub API (which allows browser calls), then the row is written to
   omoship_submissions and the form waits for it. One submission per
   student; resubmitting before the deadline replaces it and keeps the
   first timestamp. Once OMO has graded it, the links are final. */

const REPO_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)\/?$/;
/* The platform accepts Google Drive links only (the database enforces the same) */
const VIDEO_RE = /^https:\/\/drive\.google\.com\//;
const DEADLINE_DAYS = 14;

/* The OMOship's fixed deadline when it has one, otherwise 14 days from enrolment */
export function useDeadline(): { deadline: Date; closed: boolean; hoursLeft: number } {
  return useMemo(() => {
    const fixed = courseDeadline(course.slug);
    const start = enrolledAt(course.slug) ?? Date.now();
    const deadline = new Date(fixed ?? start + DEADLINE_DAYS * 24 * 3600 * 1000);
    const msLeft = deadline.getTime() - Date.now();
    return { deadline, closed: msLeft <= 0, hoursLeft: Math.floor(msLeft / 3600000) };
  }, []);
}

export default function SubmissionForm({ onSubmitted }: { onSubmitted: (s: Submission) => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [ownWork, setOwnWork] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState<Submission | null>(() => readSubmission(course.slug));
  const { deadline, closed, hoursLeft } = useDeadline();

  const deadlineText = deadline.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const submit = useCallback(async () => {
    const next: Record<string, string> = {};
    const repoMatch = repoUrl.trim().match(REPO_RE);
    if (!repoMatch) next.repo = submission.form.errors.repoPattern;
    else if (repoUrl.trim().replace(/\/$/, "").toLowerCase() === starter.repoUrl.toLowerCase())
      next.repo = submission.form.errors.repoIsStarter;
    if (!VIDEO_RE.test(videoUrl.trim())) next.video = submission.form.errors.videoPattern;
    if (!ownWork) next.ownWork = submission.form.errors.ownWork;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      capture("build_submission_attempted", { errors: Object.keys(next) });
      return;
    }
    setErrors({});
    setChecking(true);
    try {
      let reachable = true;
      try {
        const res = await fetch(`https://api.github.com/repos/${repoMatch![1]}/${repoMatch![2]}`);
        reachable = res.ok;
      } catch {
        /* Offline or rate limited: let it through rather than block the student. */
      }
      if (!reachable) {
        setErrors({ repo: submission.form.errors.repoUnreachable });
        capture("build_submission_attempted", { errors: ["repoUnreachable"] });
        return;
      }
      let row: Submission;
      try {
        row = await recordSubmission(course.slug, repoUrl.trim(), videoUrl.trim());
      } catch {
        setErrors({ form: submission.form.errors.saveFailed });
        capture("build_submission_attempted", { errors: ["saveFailed"] });
        return;
      }
      capture("build_submitted");
      setDone(row);
      onSubmitted(row);
    } finally {
      setChecking(false);
    }
  }, [repoUrl, videoUrl, ownWork, onSubmitted]);

  if (done) {
    return (
      <div className="bp-form bp-form-done" role="status">
        <h4>{submission.form.successTitle}</h4>
        <p className="bp-done-links">
          <a href={done.repoUrl}>{done.repoUrl}</a>
          <br />
          <a href={done.videoUrl}>{done.videoUrl}</a>
        </p>
        <p className="bp-muted">
          {new Date(done.submittedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
        </p>
        {done.status === "released" ? (
          <div className="bp-feedback">
            <h4>{submission.form.feedbackTitle}</h4>
            {done.score !== null && <p>{submission.form.scoreTemplate.replace("{score}", String(done.score))}</p>}
            {done.feedback && <p>{done.feedback}</p>}
          </div>
        ) : (
          <p>{submission.form.successBody.replace("{n}", String(course.feedbackDays))}</p>
        )}
        {!closed && done.status === "submitted" && (
          <button type="button" className="bp-link" onClick={() => setDone(null)}>
            {submission.form.resubmitNote}
          </button>
        )}
      </div>
    );
  }

  if (closed) {
    return (
      <div className="bp-form" role="status">
        <p>{submission.form.closedTemplate.replace("{date}", deadlineText)}</p>
      </div>
    );
  }

  return (
    <form
      className="bp-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      noValidate
    >
      <p className="bp-form-deadline">
        {submission.form.deadlinePrefix}: {deadlineText}
        {hoursLeft < 72 && (
          <strong> · {submission.form.countdownTemplate.replace("{hours}", String(Math.max(hoursLeft, 0)))}</strong>
        )}
      </p>
      <div className="bp-field">
        <label htmlFor="bp-repo">{submission.form.repoLabel}</label>
        <input
          id="bp-repo"
          name="repository"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={submission.form.repoPlaceholder}
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          aria-invalid={errors.repo ? true : undefined}
          aria-describedby={errors.repo ? "bp-repo-error" : undefined}
        />
        {errors.repo && (
          <p className="bp-error" id="bp-repo-error">
            {errors.repo}
          </p>
        )}
      </div>
      <div className="bp-field">
        <label htmlFor="bp-video">{submission.form.videoLabel}</label>
        <input
          id="bp-video"
          name="video"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={submission.form.videoPlaceholder}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          aria-invalid={errors.video ? true : undefined}
          aria-describedby={errors.video ? "bp-video-error" : undefined}
        />
        {errors.video && (
          <p className="bp-error" id="bp-video-error">
            {errors.video}
          </p>
        )}
      </div>
      <div className="bp-field">
        <label className="bp-ownwork">
          <input type="checkbox" checked={ownWork} onChange={(e) => setOwnWork(e.target.checked)} />
          <span>{submission.form.ownWork}</span>
        </label>
        {errors.ownWork && <p className="bp-error">{errors.ownWork}</p>}
      </div>
      {errors.form && (
        <p className="bp-error" role="alert">
          {errors.form}
        </p>
      )}
      <button type="submit" className="bp-btn-primary" disabled={checking}>
        {submission.form.submit}
      </button>
    </form>
  );
}
