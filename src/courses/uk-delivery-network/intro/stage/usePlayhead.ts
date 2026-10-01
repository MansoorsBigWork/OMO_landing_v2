import { useEffect, useRef } from "react";

import { TOTAL_SECONDS } from "./composition";

/* The catch-up playhead controller. Scroll sets a
   target scene position; the playhead moves toward it every frame at a
   fixed rate and never jumps. Fast scrolling therefore queues distance,
   not speed (Brief 2, Part 3.3). The unit is now the authored second of
   the map stage composition, advancing at its natural speed. */

const RATE = 1;
const SETTLE = 0.005;
const MAX_DT = 0.05;

export type PlayheadListener = (playhead: number, target: number) => void;

export interface PlayheadController {
  getPlayhead(): number;
  getTarget(): number;
  setTarget(t: number): void;
  /* Moves the playhead without animating; used under reduced motion. */
  jumpTo(t: number): void;
  subscribe(fn: PlayheadListener): () => void;
  dispose(): void;
}

export function createPlayheadController(initial = 0): PlayheadController {
  let playhead = initial;
  let target = initial;
  let rafId: number | null = null;
  let last = 0;
  const listeners = new Set<PlayheadListener>();

  const notify = () => {
    for (const fn of listeners) fn(playhead, target);
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, MAX_DT);
    last = now;
    const delta = target - playhead;
    if (Math.abs(delta) < SETTLE) {
      playhead = target;
      notify();
      rafId = null;
      return;
    }
    playhead += Math.sign(delta) * Math.min(Math.abs(delta), RATE * dt);
    notify();
    rafId = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (rafId === null) {
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  };

  return {
    getPlayhead: () => playhead,
    getTarget: () => target,
    setTarget(t) {
      target = Math.max(0, Math.min(TOTAL_SECONDS, t));
      if (target !== playhead) wake();
      else notify();
    },
    jumpTo(t) {
      playhead = Math.max(0, Math.min(TOTAL_SECONDS, t));
      target = playhead;
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(playhead, target);
      return () => listeners.delete(fn);
    },
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      listeners.clear();
    },
  };
}

export function usePlayheadController(): PlayheadController {
  const ref = useRef<PlayheadController | null>(null);
  if (ref.current === null) ref.current = createPlayheadController(0);
  useEffect(() => {
    const controller = ref.current;
    return () => controller?.dispose();
  }, []);
  return ref.current;
}
