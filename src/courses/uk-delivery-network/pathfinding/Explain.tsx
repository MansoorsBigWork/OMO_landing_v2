import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { taskCopy, type AlgorithmSlide, type WalkthroughEntry } from "./data";
import type { PlaybackApi } from "./usePlayback";

/* The Explain phase (Brief 4 v2, Part 6): the algorithm's pseudocode in
   a VS Code flavoured editor, one callout at a time, with Next running
   the simulation forward to the exact moment the highlighted line acts.
   Built directly to the pinned spec; the 21st.dev catalogue's editor
   components are highlight-library wrappers and were left on the shelf. */

interface ExplainProps {
  slide: AlgorithmSlide;
  playback: PlaybackApi | null;
  totalSteps: number;
  currentStep: number;
  walkthroughDone: boolean;
  onWalkthroughDone: () => void;
  onStartSorting: () => void;
}

/* Pseudocode tokeniser for the shared vocabulary */
const VARIABLES = /^(frontier|visited|current|came_from|cost_so_far|new_cost|priority|weight|next|depot|delivery)\b/;
const KEYWORDS = /^(set|create|return|add|take)\b/;
const CONTROL = /^(while|for|if|else|in|is|not|or|each|to|the|of|from|with|as|a|has|no|yet|only|containing|empty|item)\b/;

function tokenise(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = line;
  let key = 0;
  const push = (cls: string | null, text: string) => {
    out.push(cls ? <span key={key++} className={cls}>{text}</span> : <span key={key++}>{text}</span>);
  };
  while (rest.length > 0) {
    const ws = rest.match(/^\s+/);
    if (ws) { push(null, ws[0]); rest = rest.slice(ws[0].length); continue; }
    const num = rest.match(/^\d+(\.\d+)?/);
    if (num) { push("tk-number", num[0]); rest = rest.slice(num[0].length); continue; }
    const fn = rest.match(/^[a-z_]+(?=\()/);
    if (fn) { push("tk-function", fn[0]); rest = rest.slice(fn[0].length); continue; }
    const kw = rest.match(KEYWORDS);
    if (kw) { push("tk-keyword", kw[0]); rest = rest.slice(kw[0].length); continue; }
    const ct = rest.match(/^(while|for|if|else)\b/);
    if (ct) { push("tk-control", ct[0]); rest = rest.slice(ct[0].length); continue; }
    const vr = rest.match(VARIABLES);
    if (vr) { push("tk-variable", vr[0]); rest = rest.slice(vr[0].length); continue; }
    const word = rest.match(/^[A-Za-z_]+/);
    if (word) { push(null, word[0]); rest = rest.slice(word[0].length); continue; }
    push(null, rest[0]);
    rest = rest.slice(1);
  }
  return out;
}

const holdMs = (entry: WalkthroughEntry) =>
  5000 + Math.round(entry.explain.split(/\s+/).length / 10) * 1000;

/* The editor is deliberately independent of manual map playback: only
   Next and Play through, which run the simulation on purpose, move the
   highlight. Playing the map at 4x never touches the walkthrough. */
export default function Explain({
  slide,
  playback,
  totalSteps,
  currentStep,
  walkthroughDone,
  onWalkthroughDone,
  onStartSorting,
}: ExplainProps) {
  const entries = slide.walkthrough;
  const [idx, setIdx] = useState(0);
  const [playingThrough, setPlayingThrough] = useState(false);
  const [running, setRunning] = useState(false);
  const reachedRef = useRef(0);
  const cancelRef = useRef(false);
  const busyRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const shownIdx = idx;
  const entry = entries[shownIdx];

  const complete = useCallback(() => {
    if (reachedRef.current >= entries.length - 1) onWalkthroughDone();
  }, [entries.length, onWalkthroughDone]);

  const advanceTo = useCallback(
    async (nextIdx: number) => {
      const target = entries[nextIdx];
      setIdx(nextIdx);
      reachedRef.current = Math.max(reachedRef.current, nextIdx);
      if (target.onMap && playback) {
        busyRef.current = true;
        setRunning(true);
        const lines: number[] = [];
        for (let l = target.from; l <= target.to; l++) lines.push(l);
        await playback.playUntilLine(lines, 2);
        busyRef.current = false;
        setRunning(false);
      }
      complete();
    },
    [entries, playback, complete],
  );

  const next = useCallback(() => {
    if (playingThrough || running) return;
    if (idx >= entries.length - 1) return;
    void advanceTo(idx + 1);
  }, [advanceTo, entries, idx, playingThrough, running]);

  const back = useCallback(() => {
    if (playingThrough) return;
    setIdx((v) => Math.max(0, v - 1));
  }, [playingThrough]);

  const playThrough = useCallback(async () => {
    if (playingThrough) return;
    setPlayingThrough(true);
    cancelRef.current = false;
    let at = idx;
    while (at < entries.length - 1 && !cancelRef.current) {
      at += 1;
      await advanceTo(at);
      if (cancelRef.current) break;
      await new Promise((r) => setTimeout(r, holdMs(entries[at])));
    }
    setPlayingThrough(false);
  }, [advanceTo, entries, idx, playingThrough]);

  /* Any key or click stops Play through; Escape included */
  useEffect(() => {
    if (!playingThrough) return;
    const stop = () => {
      cancelRef.current = true;
      playback?.cancelPlayUntil();
      setPlayingThrough(false);
    };
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop);
    return () => {
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
    };
  }, [playingThrough, playback]);

  /* Keyboard inside the panel: right or Enter for Next, left for Back */
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    },
    [next, back],
  );

  const doneRef = useRef(walkthroughDone);
  doneRef.current = walkthroughDone;
  useEffect(() => {
    setIdx(0);
    reachedRef.current = doneRef.current ? entries.length - 1 : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id]);

  /* Keep the highlighted line in view inside the scrolling body */
  useEffect(() => {
    const el = bodyRef.current?.querySelector(".is-current-line");
    el?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [shownIdx, reduced]);

  const atEnd = shownIdx >= entries.length - 1 && walkthroughDone;

  return (
    <div className="dk-explain" tabIndex={0} onKeyDown={onKey}>
      <div className="dk-editor" ref={bodyRef}>
        <ol className="dk-code">
          {slide.code.map((line, i) => {
            const n = i + 1;
            const inRange = n >= entry.from && n <= entry.to;
            const isAnchor = n === entry.from;
            return (
              <li key={n} className={inRange ? "dk-line is-current-line" : "dk-line"}>
                <span className="dk-gutter" aria-hidden="true">
                  {n}
                </span>
                <code className="dk-text-line">{tokenise(line)}</code>
                {isAnchor && (
                  <div className="dk-callout" role="note">
                    <p className="dk-callout-title">
                      {entry.from === entry.to
                        ? taskCopy.editor.lineLabel.replace("{n}", String(entry.from))
                        : taskCopy.editor.rangeLabel.replace("{a}", String(entry.from)).replace("{b}", String(entry.to))}
                    </p>
                    <p className="dk-callout-body">{entry.explain}</p>
                    {entry.onMap && (
                      <p className="dk-callout-map">
                        <strong>{taskCopy.editor.onMapPrefix}</strong> {entry.onMap}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="dk-statusbar">
        <span>
          {taskCopy.editor.statusStep
            .replace("{n}", currentStep.toLocaleString("en-GB"))
            .replace("{total}", totalSteps.toLocaleString("en-GB"))}
        </span>
        <span>
          {walkthroughDone
            ? taskCopy.editor.statusDone
            : taskCopy.editor.statusLine.replace("{n}", String(entry.from))}
        </span>
      </div>

      <div className="dk-footer">
        <button type="button" className="dk-btn" onClick={back} disabled={shownIdx === 0 || playingThrough || running}>
          {taskCopy.editor.back}
        </button>
        <button type="button" className="dk-link" onClick={() => void playThrough()} disabled={playingThrough || atEnd}>
          {taskCopy.editor.playThrough}
        </button>
        {atEnd ? (
          <button type="button" className="dk-btn dk-primary" onClick={onStartSorting}>
            {taskCopy.editor.startSorting}
          </button>
        ) : (
          <button type="button" className="dk-btn dk-primary" onClick={next} disabled={playingThrough || running}>
            {taskCopy.editor.next}
          </button>
        )}
      </div>
    </div>
  );
}
