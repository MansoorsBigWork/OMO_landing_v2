import { Suspense, useEffect, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router";
import { RouteTransitionProvider } from "./shared/components/RouteTransition";
import { clearProgress, loadProgress } from "./shared/lib/progressStore";
import { findOmoship } from "./index";
import "./shared/styles/app.css";

/* Mounts one course at /portal/omoships/:slug/*. It sits inside
   RequireAuth, so the signed-in user comes from the outlet context. The
   student's progress rows are loaded before any course page renders, so
   the pages can read them synchronously. */

interface PortalContext {
  user: { id: string };
}

const shellCopy = {
  skip: "Skip to content",
  errorTitle: "We couldn’t load your progress",
  errorLead: "Your work is safe, but this page could not reach it. Check your connection and try again.",
  portalLink: "Back to your portal",
} as const;

export default function CourseShell() {
  const { slug = "" } = useParams();
  const { user } = useOutletContext<PortalContext>();
  const entry = findOmoship(slug);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!entry) return;
    let current = true;
    setStatus("loading");
    loadProgress(user.id, entry.course.slug)
      .then(() => {
        if (current) setStatus("ready");
      })
      .catch((error: Error) => {
        if (!current) return;
        setDetail(error.message);
        setStatus("error");
      });
    return () => {
      current = false;
      clearProgress();
    };
  }, [entry, user.id]);

  useEffect(() => {
    if (entry) document.title = `${entry.course.title} — OMO`;
  }, [entry]);

  if (!entry) return <Navigate to="/portal" replace />;

  return (
    <RouteTransitionProvider>
      <div className="course" aria-busy={status === "loading" || undefined}>
        <a className="skip-link" href="#main">
          {shellCopy.skip}
        </a>
        <main className="shell-main" id="main">
          {status === "ready" && (
            <Suspense fallback={null}>
              <entry.Routes />
            </Suspense>
          )}
          {status === "error" && (
            <section className="course-error" role="alert">
              <h1>{shellCopy.errorTitle}</h1>
              <p>{shellCopy.errorLead}</p>
              <p className="course-error-detail">{detail}</p>
              <Link to="/portal">{shellCopy.portalLink}</Link>
            </section>
          )}
        </main>
      </div>
    </RouteTransitionProvider>
  );
}
