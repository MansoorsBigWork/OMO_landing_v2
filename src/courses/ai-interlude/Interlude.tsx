import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import BoltScene, { CONTINUE_AT, MESSAGE2_AT, CUES } from "./BoltScene";
import { SCENE_H, SCENE_W } from "./physics";
import BlurWords from "../shared/motion/BlurWords";
import { interludeCopy, type InterludeLine } from "./copy";
import type { Omoship } from "../types";
import { capture } from "../shared/lib/analytics";
import { recordInterludeSeen } from "../shared/lib/progressStore";
import "./interlude.css";

/* The AI interlude (Interlude Briefs A and B): a one-shot timeline over
   a fixed dark stage. The scene renders from T; text and controls sit
   over it in the same coordinate space. Word reveals are the react-bits
   BlurText port; timing.json beside BoltScene is the clock. */

/* The interlude reads at half the slideshow's word pace: doubled first
   delay, word gap and rise, with the line entries doubled to match. */
const WORDS_SLOW = { baseDelay: 240, stagger: 90, durationMs: 960 } as const;

function Line({ line, active }: { line: InterludeLine; active: boolean }) {
  if (!line.emphasis) return <>{active ? <BlurWords text={line.text} {...WORDS_SLOW} /> : line.text}</>;
  const [before, after] = line.text.split("{em}");
  return (
    <>
      {before}
      <em className="interlude-em">{line.emphasis}</em>
      {after}
    </>
  );
}

export default function Interlude({ omoship }: { omoship: Omoship }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { toast?: string; fromTransition?: boolean } | null;
  const toast = state?.toast;
  const fromTransition = Boolean(state?.fromTransition);
  const [overlayGone, setOverlayGone] = useState(!fromTransition);

  useEffect(() => {
    if (!fromTransition) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOverlayGone(true)));
    return () => cancelAnimationFrame(raf);
  }, [fromTransition]);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const seed = useMemo(() => Math.floor(Math.random() * 2 ** 31), []);
  const [T, setT] = useState(reduced ? CONTINUE_AT + 1 : 0);
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });
  const [spark, setSpark] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const startedAt = useRef(performance.now());
  const continueShownAt = useRef<number | null>(null);
  const exiting = useRef(false);

  /* One-shot clock: plays forward once, never reverses */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setT((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  useEffect(() => {
    capture("interlude_started");
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  /* Scale the 1600 by 1000 scene to the viewport, contain-fit */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const scale = Math.min(w / SCENE_W, h / SCENE_H);
      setFit({ scale, x: (w - SCENE_W * scale) / 2, y: (h - SCENE_H * scale) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The slower words need about a second past the export's Continue cue
     before the second message has fully resolved. */
  const showContinue = T >= (reduced ? CONTINUE_AT : CONTINUE_AT + 1);
  useEffect(() => {
    if (showContinue && continueShownAt.current === null) {
      continueShownAt.current = performance.now();
      requestAnimationFrame(() => continueRef.current?.focus());
    }
  }, [showContinue]);

  const exit = useCallback(
    (kind: "completed" | "skipped") => {
      if (exiting.current) return;
      exiting.current = true;
      recordInterludeSeen(omoship.slug);
      if (kind === "completed") {
        capture("interlude_completed", {
          timeOnContinue: continueShownAt.current
            ? Math.round(performance.now() - continueShownAt.current)
            : 0,
        });
      } else {
        capture("interlude_skipped", { time: Math.round(performance.now() - startedAt.current) });
      }
      document.documentElement.style.overflow = "";
      navigate(`/portal/omoships/${omoship.slug}/week-1/build`);
    },
    [navigate, omoship],
  );

  const onContinue = useCallback(() => {
    setSpark(true);
    window.setTimeout(() => exit("completed"), 260);
  }, [exit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit("skipped");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  const msg1Out = reduced ? 0 : Math.min(Math.max((T - MESSAGE2_AT) / 0.3, 0), 1);
  const l1On = reduced || T >= 0;
  const l2On = reduced || T >= 1;
  const m1On = reduced || T >= MESSAGE2_AT + 0.6;
  const m2On = reduced || T >= MESSAGE2_AT + 1.6;
  const px = (v: number) => v * fit.scale;

  return (
    <div className="interlude" ref={stageRef}>
      <div
        className="interlude-fit"
        style={{ width: SCENE_W, height: SCENE_H, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` }}
      >
        <BoltScene T={T} reduced={reduced} seed={seed} />
      </div>

      {toast && (
        <p className="interlude-toast" role="status">
          {toast}
        </p>
      )}

      <div className="interlude-text" style={{ left: fit.x, top: fit.y, width: px(SCENE_W) }} aria-hidden="true">
        {msg1Out < 1 && (
          <>
            <p className="interlude-line" style={{ top: px(150), fontSize: px(56), opacity: (l1On ? 1 : 0) * (1 - msg1Out) }}>
              {l1On && !reduced ? <BlurWords text={interludeCopy.message1[0].text} {...WORDS_SLOW} /> : interludeCopy.message1[0].text}
            </p>
            <p className="interlude-line" style={{ top: px(214), fontSize: px(56), opacity: (l2On ? 1 : 0) * (1 - msg1Out) }}>
              {l2On && <Line line={interludeCopy.message1[1]} active={!reduced} />}
            </p>
          </>
        )}
        {m1On && (
          <p className="interlude-line" style={{ top: px(reduced ? 300 : 280), fontSize: px(56) }}>
            {!reduced ? <BlurWords text={interludeCopy.message2[0].text} {...WORDS_SLOW} /> : interludeCopy.message2[0].text}
          </p>
        )}
        {m2On && (
          <p className="interlude-line" style={{ top: px(reduced ? 364 : 344), fontSize: px(56) }}>
            <Line line={interludeCopy.message2[1]} active={!reduced} />
          </p>
        )}
      </div>

      {showContinue && (
        <div className="interlude-continue" style={{ left: fit.x, top: fit.y + px(reduced ? 470 : 440), width: px(SCENE_W) }}>
          <button ref={continueRef} type="button" className="interlude-btn" onClick={onContinue}>
            {spark && (
              <svg className="interlude-spark" viewBox="-40 -40 80 80" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return (
                    <line
                      key={i}
                      x1={Math.cos(a) * 14}
                      y1={Math.sin(a) * 14}
                      x2={Math.cos(a) * 28}
                      y2={Math.sin(a) * 28}
                      stroke="#F8F6F0"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
            )}
            {interludeCopy.continueLabel}
          </button>
        </div>
      )}

      <button type="button" className="interlude-skip" onClick={() => exit("skipped")}>
        {interludeCopy.skipLabel}
      </button>

      <p className="visually-hidden">{interludeCopy.hiddenDescription}</p>
      <p className="visually-hidden" aria-live="polite">
        {T >= MESSAGE2_AT + 0.6 || reduced ? interludeCopy.announce2 : interludeCopy.announce1}
      </p>
      {!overlayGone && <div className="blue-mount-overlay" aria-hidden="true" />}
      {fromTransition && overlayGone && <div className="blue-mount-overlay is-fading" aria-hidden="true" />}
    </div>
  );
}

export { CUES };
