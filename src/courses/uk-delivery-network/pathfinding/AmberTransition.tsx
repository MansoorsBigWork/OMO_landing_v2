import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import BlurWords from "../../shared/motion/BlurWords";
import { capture } from "../../shared/lib/analytics";

/* The full-screen colour transition (Brief 4, Part 2). A circle grows
   from the pressed button until it owns the viewport, the line lands,
   and Continue is the only exit. The word reveal is the react-bits
   BlurText port; the press spark is a ClickSpark port in Canvas white.
   Amber marks the shift into the technical task; Electric Blue marks
   the shift toward the project. */

export interface TransitionCopy {
  headline: string;
  subline: string;
  continueLabel: string;
  announcement: string;
}

interface AmberTransitionProps {
  origin: { x: number; y: number; r: number };
  to: string;
  copy: TransitionCopy;
  tone?: "amber" | "blue";
  navState?: Record<string, unknown>;
}

const easePow3InOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* A route drifting across the stage behind the text: one dashed line
   with depot nodes at its bends and a dot travelling it, all in Canvas
   white so it reads on the amber and the blue layer alike. */
const ROUTE_D =
  "M -80 860 C 240 780, 300 620, 520 600 S 860 660, 1040 520 S 1240 300, 1460 260 S 1660 220, 1760 140";
const DEPOTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 520, y: 600 },
  { x: 1040, y: 520 },
  { x: 1460, y: 260 },
];

function RouteScene({ reduced }: { reduced: boolean }) {
  return (
    <svg className="amber-route" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <path className="amber-route-line" d={ROUTE_D} />
      {DEPOTS.map((d) => (
        <rect key={`${d.x}-${d.y}`} className="amber-route-depot" x={d.x - 9} y={d.y - 9} width={18} height={18} rx={4} />
      ))}
      {!reduced && (
        <circle className="amber-route-van" r={7}>
          <animateMotion dur="14s" repeatCount="indefinite" path={ROUTE_D} rotate="none" />
        </circle>
      )}
    </svg>
  );
}

function Spark({ x, y }: { x: number; y: number }) {
  /* ClickSpark (reactbits.dev), reduced to its core: eight short Canvas
     white lines radiating from the press point, 400ms. */
  const ref = useRef<SVGSVGElement>(null);
  return (
    <svg ref={ref} className="amber-spark" style={{ left: x, top: y }} viewBox="-40 -40 80 80" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 12}
            y1={Math.sin(a) * 12}
            x2={Math.cos(a) * 26}
            y2={Math.sin(a) * 26}
            stroke="var(--omo-canvas)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default function AmberTransition({ origin, to, copy, tone = "amber", navState }: AmberTransitionProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"grow" | "hold" | "headline" | "subline" | "ready" | "leaving">("grow");
  const [radius, setRadius] = useState(origin.r);
  const continueRef = useRef<HTMLButtonElement>(null);
  const shownAt = useRef(performance.now());
  const rafRef = useRef(0);

  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const maxRadius = useMemo(() => {
    const fx = Math.max(origin.x, window.innerWidth - origin.x);
    const fy = Math.max(origin.y, window.innerHeight - origin.y);
    return Math.hypot(fx, fy);
  }, [origin]);

  useEffect(() => {
    capture("transition_shown");
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!reduced) {
      const start = performance.now() + 120;
      const animate = (now: number) => {
        const p = Math.min(Math.max((now - start) / 700, 0), 1);
        setRadius(origin.r + (maxRadius - origin.r) * easePow3InOut(p));
        if (p < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }
    const timers = [
      window.setTimeout(() => setPhase("hold"), 820),
      window.setTimeout(() => setPhase("headline"), 1000),
      window.setTimeout(() => setPhase("subline"), 1700),
      window.setTimeout(() => {
        setPhase("ready");
        requestAnimationFrame(() => continueRef.current?.focus());
      }, 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [maxRadius, origin.r, reduced]);

  const onContinue = useCallback(() => {
    setPhase("leaving");
    capture("transition_continued", { timeOnScreen: Math.round(performance.now() - shownAt.current) });
    window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      navigate(to, { state: { fromTransition: true, tone, ...navState } });
    }, 300);
  }, [navigate, to, tone, navState]);

  const showText = phase === "headline" || phase === "subline" || phase === "ready" || phase === "leaving";

  return createPortal(
    <div
      className={`amber-transition${tone === "blue" ? " is-blue" : ""}${reduced ? " is-reduced" : ""}${
        phase === "leaving" ? " is-leaving" : ""
      }`}
    >
      <div
        className="amber-layer"
        style={
          reduced ? undefined : { clipPath: `circle(${radius}px at ${origin.x}px ${origin.y}px)` }
        }
      >
        {phase !== "grow" && <RouteScene reduced={reduced} />}
      </div>
      {phase === "grow" && !reduced && <Spark x={origin.x} y={origin.y} />}
      {showText && (
        <div className="amber-content">
          <h1 className="amber-headline">
            {reduced ? copy.headline : <BlurWords text={copy.headline} />}
          </h1>
          <span className="amber-rule" aria-hidden="true" />
          {(phase === "subline" || phase === "ready" || phase === "leaving") && (
            <p className="amber-subline">{copy.subline}</p>
          )}
          {(phase === "ready" || phase === "leaving") && (
            <button ref={continueRef} type="button" className="amber-continue" onClick={onContinue}>
              {copy.continueLabel}
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
      <p className="visually-hidden" aria-live="assertive">
        {showText ? copy.announcement : ""}
      </p>
    </div>,
    document.body,
  );
}
