import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import Simulation from "./Simulation";
import DarkPanel, { type Phase } from "./DarkPanel";
import Explain from "./Explain";
import SortPhase from "./SortPhase";
import { slides, taskCopy } from "./data";
import AmberTransition from "./AmberTransition";
import { projectTransitionCopy } from "../../ai-interlude/copy";
import { ukDeliveryNetwork as course } from "../course";
import gridJson from "./assets/city-grid.json";
import type { CityGrid } from "./engine/types";
import { measureRun } from "./engine/search";
import type { PlaybackApi } from "./usePlayback";
import {
  hasCompletedTask,
  readTaskState,
  recordTaskCompletion,
  recordTaskSlideState,
  type SlideTaskState,
} from "../../shared/lib/progressStore";
import { capture } from "../../shared/lib/analytics";
import "./pathfinding.css";

/* Week 1, Task 1 (Brief 4 v2). Left, the algorithm exploring the city;
   right, the dark editor window: the Explain walkthrough wired to the
   simulation, then the Sort phase. */

const TASK = "week-1-pathfinding";
const grid = gridJson as CityGrid;

const EMPTY_STATE: SlideTaskState = {
  walkthroughDone: false,
  decisions: {},
  decidedOrder: [],
  checksUsed: 0,
  firstCheckScore: null,
  revealed: false,
  locked: [],
};

const normalise = (raw: Partial<SlideTaskState> | undefined): SlideTaskState => ({
  ...EMPTY_STATE,
  ...raw,
  decisions: raw?.decisions ?? {},
  decidedOrder: raw?.decidedOrder ?? [],
  locked: raw?.locked ?? [],
});

export default function Pathfinding() {
  const location = useLocation();
  const [taskState, setTaskState] = useState(() => readTaskState(course.slug, TASK));
  const [overlayGone, setOverlayGone] = useState(false);
  const [phase, setPhase] = useState<Phase>("explain");
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [simApi, setSimApi] = useState<PlaybackApi | null>(null);
  const [simSteps, setSimSteps] = useState(0);
  const stepsThrottle = useRef({ timer: 0, latest: 0 });

  /* The status bar's step count refreshes a few times a second rather
     than every frame, so fast playback never re-renders the panel per
     step. */
  const onSteps = useCallback((steps: number) => {
    const t = stepsThrottle.current;
    t.latest = steps;
    if (t.timer) return;
    t.timer = window.setTimeout(() => {
      t.timer = 0;
      setSimSteps(t.latest);
    }, 200);
  }, []);
  const slideEnteredAt = useRef(performance.now());
  const [projectTransition, setProjectTransition] = useState<{ x: number; y: number; r: number } | null>(null);
  const fromTransition = Boolean((location.state as { fromTransition?: boolean } | null)?.fromTransition);

  /* The slide index derives from ?slide= in the URL, so the course
     sidebar can deep-link a slide, a refresh keeps the place, and there
     is no second state to fall out of sync. A parameter for a slide the
     student has not reached falls back to the first slide. */
  const [searchParams, setSearchParams] = useSearchParams();
  const canReach = useCallback(
    (i: number) => {
      if (i === 0 || hasCompletedTask(course.slug, TASK) || taskState[slides[i].id] !== undefined) return true;
      const prev = normalise(taskState[slides[i - 1].id]);
      return prev.locked.length >= slides[i - 1].statements.length;
    },
    [taskState],
  );
  const index = useMemo(() => {
    const id = searchParams.get("slide");
    if (!id) return 0;
    const i = slides.findIndex((sl) => sl.id === id);
    return i > 0 && canReach(i) ? i : 0;
  }, [searchParams, canReach]);
  const goToSlide = useCallback(
    (i: number) => setSearchParams({ slide: slides[i].id }, { replace: true }),
    [setSearchParams],
  );

  const slide = slides[index];
  const state = normalise(taskState[slide.id]);
  const totalSteps = useMemo(() => measureRun(grid, slide.algorithm).totalSteps, [slide.algorithm]);

  useEffect(() => {
    if (!fromTransition) {
      setOverlayGone(true);
      return;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOverlayGone(true)));
    return () => cancelAnimationFrame(raf);
  }, [fromTransition]);

  useEffect(() => {
    capture("pathfinding_slide_viewed", { slide: slide.id });
    slideEnteredAt.current = performance.now();
    setPhase("explain");
    setJustUnlocked(false);
    const t = stepsThrottle.current;
    if (t.timer) {
      window.clearTimeout(t.timer);
      t.timer = 0;
    }
    setSimSteps(0);
  }, [slide.id]);

  const onState = useCallback(
    (next: SlideTaskState) => {
      setTaskState((prev) => ({ ...prev, [slide.id]: next }));
      recordTaskSlideState(course.slug, TASK, slide.id, next);
    },
    [slide.id],
  );

  const onWalkthroughDone = useCallback(() => {
    if (state.walkthroughDone) return;
    onState({ ...state, walkthroughDone: true });
    setJustUnlocked(true);
    window.setTimeout(() => setJustUnlocked(false), 600);
    capture("pathfinding_walkthrough_completed", {
      slide: slide.id,
      time: Math.round(performance.now() - slideEnteredAt.current),
    });
  }, [onState, slide.id, state]);

  const onChecked = useCallback(
    (attempt: number, score: number) => {
      capture("pathfinding_checked", { slide: slide.id, attempt, score });
    },
    [slide.id],
  );

  const totalScore = useMemo(
    () => slides.reduce((sum, s) => sum + (normalise(taskState[s.id]).firstCheckScore ?? 0), 0),
    [taskState],
  );

  const onNext = useCallback(
    (origin?: { x: number; y: number; r: number }) => {
      if (index < slides.length - 1) {
        goToSlide(index + 1);
        return;
      }
      recordTaskCompletion(course.slug, TASK);
      capture("pathfinding_completed", { totalScore });
      /* The blue moment: the project is next, but a quick message first.
         It plays every time the task is finished, not only the first. */
      setProjectTransition(origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2, r: 40 });
    },
    [index, totalScore, goToSlide],
  );

  const interludeToast = taskCopy.toastTemplate.replace("{score}", String(totalScore));

  /* Arrow keys change slides only when focus is outside the dark panel */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dark-panel") || target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight" && index < slides.length - 1 && canReach(index + 1)) goToSlide(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) goToSlide(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, canReach, goToSlide]);

  return (
    <div className="pathfinding-page">
      <header className="task-header">
        <span className="task-title">{taskCopy.header}</span>
        <span className="task-progress" aria-live="polite">
          {taskCopy.progressTemplate.replace("{n}", String(index + 1)).replace("{total}", String(slides.length))}
        </span>
      </header>

      <div className="task-columns" key={slide.id}>
        <div className="task-sim slide-in">
          <Simulation
            grid={grid}
            algorithm={slide.algorithm}
            autoplay={false}
            onApi={setSimApi}
            onSteps={onSteps}
          />
        </div>
        <div className="task-panel slide-in">
          <DarkPanel
            tab={`${slide.id}${taskCopy.editor.tabSuffix}`}
            phase={phase}
            sortUnlocked={state.walkthroughDone}
            justUnlocked={justUnlocked}
            onPhase={setPhase}
          >
            <div className="dk-desc">
              <h2>{slide.name}</h2>
              <p>{slide.description}</p>
            </div>
            {phase === "explain" ? (
              <Explain
                slide={slide}
                playback={simApi}
                totalSteps={totalSteps}
                currentStep={simSteps}
                walkthroughDone={state.walkthroughDone}
                onWalkthroughDone={onWalkthroughDone}
                onStartSorting={() => setPhase("sort")}
              />
            ) : (
              <SortPhase
                slide={slide}
                state={state}
                onState={onState}
                onChecked={onChecked}
                isLast={index === slides.length - 1}
                onNext={onNext}
              />
            )}
          </DarkPanel>
        </div>
      </div>

      {!overlayGone && <div className="amber-mount-overlay" aria-hidden="true" />}
      {fromTransition && overlayGone && <div className="amber-mount-overlay is-fading" aria-hidden="true" />}
      {projectTransition && (
        <AmberTransition
          origin={projectTransition}
          to={`/portal/omoships/${course.slug}/week-1/interlude`}
          copy={projectTransitionCopy}
          tone="blue"
          navState={{ toast: interludeToast }}
        />
      )}
    </div>
  );
}
