import { Suspense, useEffect, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router";
import { RouteTransitionProvider } from "./shared/components/RouteTransition";
import { clearProgress, loadProgress, startPreview } from "./shared/lib/progressStore";
import { findOmoship } from "./index";
import PortalBar from "../components/PortalBar.jsx";
import "./shared/styles/app.css";

/* Mounts one course at /portal/omoships/:slug/*. It sits inside
   RequireAuth, so the signed-in user comes from the outlet context. The
   student's progress rows are loaded before any course page renders, so
   the pages can read them synchronously. Anyone who isn't a student (an
   employer opening their OMOship) gets a preview: the course works the same,
   but nothing they do is saved. */

interface PortalContext {
  user: { id: string; email: string; fullName: string; firstName: string; role: string };
  signOut: () => void;
}

const shellCopy = {
  skip: "Skip to content",
  errorTitle: "We couldn’t load your progress",
  errorLead: "Your work is safe, but this page could not reach it. Check your connection and try again.",
  portalLink: "Back to your portal",
  preview: "Preview: you’re seeing the course as students do. Nothing you do here is saved or scored.",
} as const;

export default function CourseShell() {
  const { slug = "" } = useParams();
  const { user, signOut } = useOutletContext<PortalContext>();
  const entry = findOmoship(slug);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState("");
  const isPreviewer = user.role !== "student";

  useEffect(() => {
    if (!entry) return;
    let current = true;
    setStatus("loading");
    if (isPreviewer) {
      startPreview(user.id, entry.course.slug);
      setStatus("ready");
      return () => {
        clearProgress();
      };
    }
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
  }, [entry, user.id, isPreviewer]);

  useEffect(() => {
    if (entry) document.title = `${entry.course.title} — OMO`;
  }, [entry]);

  if (!entry) return <Navigate to="/portal" replace />;

  return (
    <RouteTransitionProvider>
      <div className="course" aria-busy={status === "loading" || undefined}>
        <PortalBar user={user} onSignOut={signOut} />
        <a className="skip-link" href="#main">
          {shellCopy.skip}
        </a>
        {isPreviewer && (
          <p className="course-preview-note" role="status">
            {shellCopy.preview}
          </p>
        )}
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
