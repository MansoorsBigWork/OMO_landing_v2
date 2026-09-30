import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { courseNavCopy, navStages, type NavStage } from "./stages";
import { ukDeliveryNetwork as course } from "../course";
import { slides } from "../pathfinding/data";
import { sections as buildSections } from "../build/data";
import {
  hasCompletedIntro,
  hasCompletedTask,
  hasSeenWelcome,
  isEnrolled,
  readBuildState,
  readSubmission,
  readTaskState,
} from "../../shared/lib/progressStore";
import { capture } from "../../shared/lib/analytics";
import "./course-nav.css";

/* The course sections sidebar: an amber ribbon hanging near the top
   left opens a panel listing the course's stages. A stage unlocks when
   the one before it is complete; locked stages are listed but cannot
   be opened. The two stages with sections of their own, the
   pathfinding task and the build page, expand to link straight to a
   slide or a page section. */

const PF_TASK = "week-1-pathfinding";

const doneChecks: Record<NavStage["id"], (slug: string) => boolean> = {
  overview: (slug) => isEnrolled(slug),
  welcome: (slug) => hasSeenWelcome(slug),
  intro: (slug) => hasCompletedIntro(slug),
  pathfinding: (slug) => hasCompletedTask(slug, PF_TASK),
  build: (slug) => readSubmission(slug) !== null,
};

interface NavChild {
  id: string;
  label: string;
  to: string;
  done: boolean;
  unlocked: boolean;
}

function childrenFor(stageId: NavStage["id"], base: string, stageUnlocked: boolean): NavChild[] {
  if (stageId === "pathfinding") {
    const state = readTaskState(course.slug, PF_TASK);
    const taskDone = hasCompletedTask(course.slug, PF_TASK);
    const slideDone = (i: number) =>
      (state[slides[i].id]?.locked?.length ?? 0) >= slides[i].statements.length;
    return slides.map((s, i) => ({
      id: s.id,
      label: s.name,
      to: `${base}?slide=${s.id}`,
      done: slideDone(i),
      unlocked:
        stageUnlocked && (taskDone || i === 0 || slideDone(i - 1) || state[s.id] !== undefined),
    }));
  }
  if (stageId === "build") {
    const read = readBuildState(course.slug).readSections;
    return buildSections.map((sec) => ({
      id: sec.id,
      label: sec.navLabel,
      to: `${base}#${sec.id}`,
      done: read.includes(sec.id),
      unlocked: stageUnlocked,
    }));
  }
  return [];
}

const tick = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const padlock = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="3.5" y="7" width="9" height="6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export default function CourseNav() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const location = useLocation();
  const ribbonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    ribbonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("button, a");
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* Progress is read fresh on every render while open, so the list
     always reflects the stored state. */
  const done = navStages.map((s) => doneChecks[s.id](course.slug));
  const stages = navStages.map((s, i) => {
    const to = s.path.replace("{slug}", course.slug);
    const unlocked = i === 0 || done[i - 1];
    return { ...s, to, done: done[i], unlocked, children: childrenFor(s.id, to, unlocked) };
  });

  const openPanel = () => {
    capture("course_nav_opened");
    /* The stage for the current page starts expanded */
    const here = stages.find((stage) => stage.children.length > 0 && location.pathname === stage.to);
    setExpanded(here ? here.id : null);
    setOpen(true);
  };

  return (
    <>
      <button
        ref={ribbonRef}
        type="button"
        className="cn-ribbon"
        aria-label={courseNavCopy.ribbonLabel}
        aria-expanded={open}
        aria-controls="course-nav-panel"
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M3 5.5h14M3 10h14M3 14.5h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <>
          <div className="cn-backdrop" onClick={close} aria-hidden="true" />
          <aside
            id="course-nav-panel"
            ref={panelRef}
            className="cn-panel"
            role="dialog"
            aria-modal="true"
            aria-label={courseNavCopy.ribbonLabel}
          >
            <header className="cn-head">
              <div>
                <p className="cn-title">{courseNavCopy.title}</p>
                <p className="cn-subtitle">{courseNavCopy.subtitle}</p>
              </div>
              <button type="button" className="cn-close" onClick={close} aria-label={courseNavCopy.close}>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <ol className="cn-list">
              {stages.map((stage, i) => {
                const current = location.pathname === stage.to;
                const status = stage.done
                  ? courseNavCopy.statusDone
                  : stage.unlocked
                    ? courseNavCopy.statusOpen
                    : courseNavCopy.statusLocked;
                const isExpanded = expanded === stage.id;
                const expandable = stage.unlocked && stage.children.length > 0;
                const inner = (
                  <>
                    <span className="cn-marker" aria-hidden="true">
                      {stage.done ? tick : stage.unlocked ? String(i + 1) : padlock}
                    </span>
                    <span className="cn-text">
                      <span className="cn-label">{stage.label}</span>
                      <span className="cn-hint">{stage.hint}</span>
                      <span className="visually-hidden">{status}</span>
                    </span>
                  </>
                );
                return (
                  <li key={stage.id}>
                    <div className="cn-rowline">
                      {stage.unlocked ? (
                        <Link
                          className={`cn-row${current ? " is-current" : ""}`}
                          to={stage.to}
                          aria-current={current ? "page" : undefined}
                          onClick={() => {
                            capture("course_nav_stage_opened", { stage: stage.id });
                            setOpen(false);
                          }}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <span className="cn-row is-locked">{inner}</span>
                      )}
                      {expandable && (
                        <button
                          type="button"
                          className={`cn-expand${isExpanded ? " is-open" : ""}`}
                          aria-expanded={isExpanded}
                          aria-label={(isExpanded ? courseNavCopy.collapseTemplate : courseNavCopy.expandTemplate).replace(
                            "{label}",
                            stage.label,
                          )}
                          onClick={() => setExpanded(isExpanded ? null : stage.id)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                            <path d="M5 6.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {expandable && isExpanded && (
                      <ol className="cn-sublist">
                        {stage.children.map((child) => {
                          const childCurrent =
                            `${location.pathname}${location.search}${location.hash}` === child.to;
                          const childStatus = child.done
                            ? courseNavCopy.statusDone
                            : child.unlocked
                              ? courseNavCopy.statusOpen
                              : courseNavCopy.statusLocked;
                          const childInner = (
                            <>
                              <span className="cn-submarker" aria-hidden="true">
                                {child.done ? tick : child.unlocked ? <span className="cn-dot" /> : padlock}
                              </span>
                              <span className="cn-sublabel">{child.label}</span>
                              <span className="visually-hidden">{childStatus}</span>
                            </>
                          );
                          return (
                            <li key={child.id}>
                              {child.unlocked ? (
                                <Link
                                  className={`cn-subrow${childCurrent ? " is-current" : ""}`}
                                  to={child.to}
                                  aria-current={childCurrent ? "page" : undefined}
                                  onClick={() => {
                                    capture("course_nav_section_opened", { stage: stage.id, section: child.id });
                                    setOpen(false);
                                  }}
                                >
                                  {childInner}
                                </Link>
                              ) : (
                                <span className="cn-subrow is-locked">{childInner}</span>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
            <footer className="cn-foot">
              <Link className="cn-portal-link" to="/portal" onClick={() => setOpen(false)}>
                {courseNavCopy.portalLink}
              </Link>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
