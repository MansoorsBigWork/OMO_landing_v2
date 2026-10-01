import { useCallback, useEffect, useMemo, useRef } from "react";
import Button from "../../shared/components/Button";
import { taskCopy } from "./data";
import type { CityGrid, Result, Step } from "./engine/types";
import type { AlgorithmId } from "./engine/search";
import { usePlayback, type PlaybackApi } from "./usePlayback";
import { capture } from "../../shared/lib/analytics";
import { drawCity } from "./drawCity";

/* The simulation column: the organic city painted onto a static canvas
   from the same grid the algorithms search, with the exploration canvas
   above it, so traversed tiles colour in over the map exactly along its
   streets. Transport bar structure follows the timed caption player
   pattern from 21st.dev (play, step, speed, readouts), restyled to the
   OMO tokens. */

interface SimulationProps {
  grid: CityGrid;
  algorithm: AlgorithmId;
  autoplay: boolean;
  /* Explain-phase wiring: the playback api on mount and the running
     step count. */
  onApi?: (api: PlaybackApi) => void;
  onSteps?: (steps: number) => void;
}

const BLUE = { visited: "rgba(10, 51, 165, 0.14)", frontier: "rgba(10, 51, 165, 0.35)", current: "rgba(10, 51, 165, 0.7)" };
const AMBER = "#E8650A";

export default function Simulation({ grid, algorithm, autoplay, onApi, onSteps }: SimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const prevCurrent = useRef<number | null>(null);
  const frontierSet = useRef<Set<number>>(new Set());
  const pathAnim = useRef(0);
  const playedRef = useRef(false);

  const W = grid.w * grid.cell;
  const H = grid.h * grid.cell;

  /* The map itself, painted once */
  useEffect(() => {
    const ctx = baseRef.current?.getContext("2d");
    if (ctx) drawCity(ctx, grid);
  }, [grid]);

  const paintCell = useCallback(
    (ctx: CanvasRenderingContext2D, id: number, colour: string) => {
      const x = (id % grid.w) * grid.cell;
      const y = Math.floor(id / grid.w) * grid.cell;
      ctx.clearRect(x, y, grid.cell, grid.cell);
      ctx.fillStyle = colour;
      ctx.fillRect(x + 0.5, y + 0.5, grid.cell - 1, grid.cell - 1);
    },
    [grid],
  );

  const onStep = useCallback(
    (step: Step) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (prevCurrent.current !== null) paintCell(ctx, prevCurrent.current, BLUE.visited);
      for (const id of step.visited) if (id !== step.current) paintCell(ctx, id, BLUE.visited);
      for (const id of step.frontier) {
        frontierSet.current.add(id);
        paintCell(ctx, id, BLUE.frontier);
      }
      paintCell(ctx, step.current, BLUE.current);
      prevCurrent.current = step.current;
    },
    [paintCell],
  );

  const onDone = useCallback(
    (result: Result) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || result.path.length === 0) return;
      if (prevCurrent.current !== null) paintCell(ctx, prevCurrent.current, BLUE.visited);
      const pts = result.path.map((id) => [
        (id % grid.w) * grid.cell + grid.cell / 2,
        Math.floor(id / grid.w) * grid.cell + grid.cell / 2,
      ]);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const draw = (upTo: number) => {
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < Math.floor(upTo); i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      };
      if (reduced) {
        draw(pts.length);
        return;
      }
      const start = performance.now();
      const animate = (now: number) => {
        const p = Math.min((now - start) / 400, 1);
        draw(1 + (pts.length - 1) * p);
        if (p < 1) pathAnim.current = requestAnimationFrame(animate);
      };
      pathAnim.current = requestAnimationFrame(animate);
    },
    [grid, paintCell],
  );

  const onClear = useCallback(() => {
    if (pathAnim.current) cancelAnimationFrame(pathAnim.current);
    prevCurrent.current = null;
    frontierSet.current.clear();
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, W, H);
  }, [W, H]);

  const playback = usePlayback(grid, algorithm, onStep, onDone, onClear, autoplay);
  const { readouts, speed } = playback;

  useEffect(() => {
    onApi?.(playback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);
  useEffect(() => {
    onSteps?.(readouts.steps);
  }, [readouts.steps, onSteps]);

  useEffect(() => {
    if (readouts.playing && !playedRef.current) {
      playedRef.current = true;
      capture("pathfinding_sim_played", { speed });
    }
  }, [readouts.playing, speed]);
  useEffect(() => {
    playedRef.current = false;
  }, [algorithm]);

  const onMapKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        playback.toggle();
      }
    },
    [playback],
  );

  const speeds = useMemo(() => taskCopy.speeds.map((s) => ({ label: s, value: parseFloat(s) })), []);
  const fmt = (n: number) => n.toLocaleString("en-GB");

  return (
    <div className="sim">
      <div
        className="sim-map"
        role="group"
        aria-label={taskCopy.mapLabel}
        tabIndex={0}
        onKeyDown={onMapKey}
      >
        <canvas ref={baseRef} className="sim-canvas" width={W} height={H} />
        <canvas ref={canvasRef} className="sim-canvas" width={W} height={H} />
        <svg className="sim-layer" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {([
            [grid.start, taskCopy.depotLabel, "start"],
            [grid.goal, taskCopy.deliveryLabel, "end"],
          ] as const).map(([pt, label, anchor]) => (
            <g key={label}>
              <circle
                cx={pt.x * grid.cell + grid.cell / 2}
                cy={pt.y * grid.cell + grid.cell / 2}
                r="8"
                fill="var(--omo-canvas)"
                stroke="var(--omo-blue)"
                strokeWidth="3"
              />
              <text
                x={pt.x * grid.cell + (anchor === "start" ? 16 : -16)}
                y={pt.y * grid.cell + (anchor === "start" ? -8 : 22)}
                textAnchor={anchor === "start" ? "start" : "end"}
                fill="var(--omo-ash)"
                fillOpacity="0.75"
                fontSize="15"
                fontWeight="600"
                letterSpacing="2"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="sim-bar">
        <div className="sim-controls">
          <Button
            variant="secondary"
            onClick={playback.toggle}
            disabled={readouts.done && !readouts.playing}
          >
            {readouts.playing ? taskCopy.pause : taskCopy.play}
          </Button>
          <Button variant="text" onClick={playback.stepOnce} disabled={readouts.playing || readouts.done}>
            {taskCopy.step}
          </Button>
          <Button variant="text" onClick={playback.reset}>
            {taskCopy.reset}
          </Button>
          <div className="sim-speeds" role="group" aria-label={taskCopy.speedLabel}>
            {speeds.map((s) => (
              <button
                key={s.label}
                type="button"
                className={`sim-speed${speed === s.value ? " is-active" : ""}`}
                aria-pressed={speed === s.value}
                onClick={() => playback.setSpeed(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <dl className="sim-readouts">
          <div>
            <dt>{taskCopy.readouts.visited}</dt>
            <dd>{fmt(readouts.visited)}</dd>
          </div>
          <div>
            <dt>{taskCopy.readouts.pathLength}</dt>
            <dd>{readouts.pathCost === null ? "–" : fmt(readouts.pathCost)}</dd>
          </div>
          <div>
            <dt>{taskCopy.readouts.time}</dt>
            <dd>
              {fmt(readouts.steps)} {taskCopy.readouts.stepsSuffix}
            </dd>
          </div>
        </dl>
      </div>
      <p className="sim-caption">{taskCopy.mapCaption}</p>
    </div>
  );
}
