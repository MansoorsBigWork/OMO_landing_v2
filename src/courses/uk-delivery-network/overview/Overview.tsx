import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import Button from "../../shared/components/Button";
import { ukDeliveryNetwork as course } from "../course";
import { welcomeCopy } from "../../welcome/copy";
import { interludeCopy } from "../../ai-interlude/copy";
import { hasSeenWelcome, isEnrolled, recordEnrolment } from "../../shared/lib/progressStore";
import "./overview.css";

/* Course page for The Last Mile OMOship. Five sections: header, stat strip,
   description, timeline, enrol block. All copy comes from the
   course data file. */

type EnrolState = "idle" | "loading" | "error";

const INTRO_ROUTE = `/portal/omoships/${course.slug}/intro`;
const WELCOME_ROUTE = `/portal/omoships/${course.slug}/welcome`;
const nextRoute = () => (hasSeenWelcome(course.slug) ? INTRO_ROUTE : WELCOME_ROUTE);

function useEnrolment() {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(() => isEnrolled(course.slug));
  const [state, setState] = useState<EnrolState>("idle");

  const submit = useCallback(async () => {
    if (enrolled) {
      navigate(nextRoute());
      return;
    }
    setState("loading");
    try {
      /* Waits for the enrolment row: the student must know if it failed */
      await recordEnrolment(course.slug);
      setEnrolled(true);
      navigate(nextRoute());
    } catch {
      setState("error");
    }
  }, [enrolled, navigate]);

  return { enrolled, state, submit };
}

function EnrolButton({
  enrolled,
  state,
  onEnrol,
  errorId,
}: {
  enrolled: boolean;
  state: EnrolState;
  onEnrol: () => void;
  errorId: string;
}) {
  /* A full or closed cohort takes no new enrolments; the waitlist itself
     is not built yet, so the button says so and stays disabled. */
  const open = course.status === "open";
  const label = enrolled
    ? course.enrol.continueLabel
    : open
      ? course.enrol.buttonLabel
      : course.enrol.waitlistLabel;
  const loading = state === "loading";

  return (
    <div className="enrol-action">
      <Button
        onClick={onEnrol}
        disabled={loading || (!enrolled && !open)}
        busy={loading}
        aria-describedby={state === "error" ? errorId : undefined}
      >
        {label}
      </Button>
      {state === "error" && (
        <p className="enrol-error" id={errorId} role="alert">
          {course.enrol.errorMessage}
        </p>
      )}
    </div>
  );
}

export default function UkDeliveryNetwork() {
  const { enrolled, state, submit } = useEnrolment();

  return (
    <article className="omoship">
      <header className="omoship-header">
        <p className="omoship-eyebrow">
          {course.eyebrow}
          <span aria-hidden="true"> &middot; </span>
          <span className="sector-chip">{course.sector}</span>
        </p>
        <h1>{course.title}</h1>
        <p className="omoship-strapline">{course.strapline}</p>
        <EnrolButton enrolled={enrolled} state={state} onEnrol={submit} errorId="enrol-error-header" />
      </header>

      <dl className="stat-strip">
        {course.stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="omoship-description">
        {course.description.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </section>

      <section className="omoship-weeks" aria-labelledby="weeks-heading">
        <h2 id="weeks-heading">{course.weeksHeading}</h2>
        <ol className="timeline">
          {course.weeks.map((week, index) => (
            <li className="timeline-week" key={week.label}>
              <div className="timeline-rail">
                <span className="timeline-marker" aria-hidden="true">
                  {index + 1}
                </span>
                {index < course.weeks.length - 1 && <span className="timeline-line" />}
              </div>
              <div className="timeline-body">
                <h3>
                  <span className="timeline-week-label">{week.label}</span>
                  {week.title}
                </h3>
                <ul className="timeline-tasks">
                  {week.tasks.map((task) => (
                    <li key={task.slice(0, 32)}>{task}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="enrol-block" aria-label={course.enrol.buttonLabel}>
        <EnrolButton enrolled={enrolled} state={state} onEnrol={submit} errorId="enrol-error-block" />
        {enrolled && (
          <p className="welcome-reread">
            <Link to={`/portal/omoships/${course.slug}/welcome`}>{welcomeCopy.ui.sidebarLink}</Link>
            <span aria-hidden="true"> · </span>
            <Link to={`/portal/omoships/${course.slug}/week-1/interlude`}>{interludeCopy.replayLink}</Link>
          </p>
        )}
      </section>
    </article>
  );
}
