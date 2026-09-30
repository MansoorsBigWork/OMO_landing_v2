import { useCallback, useEffect, useRef, useState } from "react";
import type { CityGrid, Result, Run, Step } from "./engine/types";
import { ALGORITHMS, type AlgorithmId } from "./engine/search";
import { cellId } from "./engine/types";

/* The playback controller: advances the generator one step every tick,
   where a tick is 40ms at 1x. Steps are pushed to the renderer
   imperatively; readouts update once per animation frame. */

export interface Readouts {
  visited: number;
  pathCost: number | null;
  steps: number;
  done: boolean;
  playing: boolean;
}

export interface PlaybackApi {
  readouts: Readouts;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: number) => void;
  /* Walkthrough support: run at the given speed until the engine reports
     one of these pseudocode lines (or the run completes), then pause.
     Resolves when the pause lands. */
  playUntilLine: (lines: number[], speed: number) => Promise<void>;
  cancelPlayUntil: () => void;
}

const BASE_TICK_MS = 40;

/* The brief's 40ms tick was tuned on a 1,400-step grid; the organic city
   yields several times as many steps (and v2's line-tagged engine yields
   about two per expansion), so a tick advances proportionally more steps
   and every run keeps the same wall-clock feel at 1x. */
const REFERENCE_STEPS = 700;

export function usePlayback(
  grid: CityGrid,
  algorithm: AlgorithmId,
  onStep: (step: Step) => void,
  onDone: (result: Result) => void,
  onClear: () => void,
  autoplay: boolean,
): PlaybackApi {
  const [readouts, setReadouts] = useState<Readouts>({
    visited: 0,
    pathCost: null,
    steps: 0,
    done: false,
    playing: false,
  });
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);
  const genRef = useRef<Run | null>(null);
  const statsRef = useRef({ visited: 0, steps: 0 });
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const accRef = useRef(0);
  const playingRef = useRef(false);
  const doneRef = useRef(false);
  const latchRef = useRef<{ lines: Set<number>; resolve: () => void } | null>(null);

  const makeGen = useCallback((): Run => {
    const start = cellId(grid, grid.start.x, grid.start.y);
    const goal = cellId(grid, grid.goal.x, grid.goal.y);
    return ALGORITHMS[algorithm](grid, start, goal);
  }, [grid, algorithm]);

  const syncReadouts = useCallback((extra?: Partial<Readouts>) => {
    setReadouts((prev) => ({
      ...prev,
      visited: statsRef.current.visited,
      steps: statsRef.current.steps,
      playing: playingRef.current,
      done: doneRef.current,
      ...extra,
    }));
  }, []);

  const stepsPerTick = Math.max(1, Math.round(grid.cells.filter((c) => c !== 0).length / REFERENCE_STEPS));

  const advance = useCallback((): boolean => {
    if (!genRef.current || doneRef.current) return false;
    const r = genRef.current.next();
    if (r.done) {
      doneRef.current = true;
      playingRef.current = false;
      const latch = latchRef.current;
      latchRef.current = null;
      latch?.resolve();
      const result = r.value as Result;
      statsRef.current.visited = result.visitedCount;
      statsRef.current.steps = result.steps;
      onDone(result);
      syncReadouts({ pathCost: result.pathCost });
      return false;
    }
    const step = r.value as Step;
    statsRef.current.visited += step.visited.length;
    statsRef.current.steps += 1;
    onStep(step);
    const latch = latchRef.current;
    if (latch && latch.lines.has(step.line)) {
      latchRef.current = null;
      playingRef.current = false;
      latch.resolve();
      return false;
    }
    return true;
  }, [onDone, onStep, syncReadouts]);

  const loop = useCallback(
    (now: number) => {
      rafRef.current = 0;
      if (!playingRef.current) return;
      const dt = Math.min(now - lastRef.current, 250);
      lastRef.current = now;
      accRef.current += dt;
      const interval = BASE_TICK_MS / speedRef.current;
      let moved = false;
      while (accRef.current >= interval) {
        accRef.current -= interval;
        moved = true;
        let alive = true;
        for (let i = 0; i < stepsPerTick && alive; i++) alive = advance();
        if (!alive) {
          accRef.current = 0;
          break;
        }
      }
      if (moved) syncReadouts();
      if (playingRef.current) rafRef.current = requestAnimationFrame(loop);
    },
    [advance, syncReadouts],
  );

  const play = useCallback(() => {
    if (doneRef.current || playingRef.current) return;
    if (!genRef.current) genRef.current = makeGen();
    playingRef.current = true;
    lastRef.current = performance.now();
    accRef.current = 0;
    syncReadouts();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, makeGen, syncReadouts]);

  const pause = useCallback(() => {
    playingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    syncReadouts();
  }, [syncReadouts]);

  const reset = useCallback(() => {
    pause();
    genRef.current = makeGen();
    statsRef.current = { visited: 0, steps: 0 };
    doneRef.current = false;
    onClear();
    syncReadouts({ pathCost: null });
  }, [makeGen, onClear, pause, syncReadouts]);

  const stepOnce = useCallback(() => {
    if (playingRef.current) return;
    if (!genRef.current) genRef.current = makeGen();
    advance();
    syncReadouts();
  }, [advance, makeGen, syncReadouts]);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  const playUntilLine = useCallback(
    (lines: number[], atSpeed: number) =>
      new Promise<void>((resolve) => {
        if (doneRef.current) {
          resolve();
          return;
        }
        setSpeed(atSpeed);
        latchRef.current = { lines: new Set(lines), resolve };
        if (!genRef.current) genRef.current = makeGen();
        playingRef.current = true;
        lastRef.current = performance.now();
        accRef.current = 0;
        syncReadouts();
        rafRef.current = requestAnimationFrame(loop);
      }),
    [loop, makeGen, setSpeed, syncReadouts],
  );

  const cancelPlayUntil = useCallback(() => {
    const latch = latchRef.current;
    latchRef.current = null;
    playingRef.current = false;
    latch?.resolve();
    syncReadouts();
  }, [syncReadouts]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  /* Autoplay once when the slide is first shown; reduced motion plays
     only on request, at 4x. */
  useEffect(() => {
    genRef.current = makeGen();
    statsRef.current = { visited: 0, steps: 0 };
    doneRef.current = false;
    onClear();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) setSpeed(4);
    else if (autoplay) play();
    return () => {
      playingRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  return { readouts, speed, play, pause, toggle, stepOnce, reset, setSpeed, playUntilLine, cancelPlayUntil };
}
