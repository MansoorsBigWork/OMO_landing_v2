import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  taskCopy,
  type AlgorithmSlide,
  type Statement,
  type StatementKind,
} from "./data";
import { studentSeed, type SlideTaskState } from "../../shared/lib/progressStore";
import { seededShuffle } from "../../shared/lib/shuffle";
import { ukDeliveryNetwork as course } from "../course";

/* The Sort phase (Brief 4 v2, Part 7): one statement at a time, three
   decisions, undo, then a review board with three checks. The deck's
   decide and undo state machine is ported from the 21st.dev Swipe Deck
   starting point (decisions array, directional flow, live announcer),
   rebuilt dependency free around three buttons rather than two-way
   drag, as the brief's keyboard-first design asks. */

interface SortPhaseProps {
  slide: AlgorithmSlide;
  state: SlideTaskState;
  onState: (next: SlideTaskState) => void;
  onChecked: (attempt: number, score: number) => void;
  isLast: boolean;
  onNext: (origin?: { x: number; y: number; r: number }) => void;
}

const KINDS: StatementKind[] = ["strength", "weakness", "na"];
const EXIT: Record<StatementKind, string> = { strength: "exit-left", na: "exit-down", weakness: "exit-right" };
const KIND_LABEL = (k: StatementKind) =>
  k === "strength" ? taskCopy.sort.strength : k === "weakness" ? taskCopy.sort.weakness : taskCopy.sort.na;

interface Mark {
  ok: boolean;
  explanation?: string;
}

export default function SortPhase({ slide, state, onState, onChecked, isLast, onNext }: SortPhaseProps) {
  /* Shuffled per student and slide, and stable across reloads, so the
     decided count still points at the right next statement */
  const statements = useMemo(
    () => seededShuffle(slide.statements, `${studentSeed(course.slug)}:${slide.id}`),
    [slide],
  );
  const decidedCount = state.decidedOrder.length;
  const inReview = decidedCount >= statements.length;
  const current = statements[decidedCount];
  const [leaving, setLeaving] = useState<{ id: string; dir: string } | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [announce, setAnnounce] = useState("");
  const buttonsRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const done = state.revealed || state.checksUsed >= 3;
  const checksLeft = 3 - state.checksUsed;

  const decide = useCallback(
    (kind: StatementKind) => {
      if (!current || done) return;
      setLeaving({ id: current.id, dir: EXIT[kind] });
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => setLeaving(null), 240);
      onState({
        ...state,
        decisions: { ...state.decisions, [current.id]: kind },
        decidedOrder: [...state.decidedOrder, current.id],
      });
      setAnnounce(`${current.text}. ${KIND_LABEL(kind)}.`);
    },
    [current, done, onState, state],
  );

  const undo = useCallback(() => {
    if (done || state.decidedOrder.length === 0 || inReview) return;
    const last = state.decidedOrder[state.decidedOrder.length - 1];
    const decisions = { ...state.decisions };
    delete decisions[last];
    onState({ ...state, decisions, decidedOrder: state.decidedOrder.slice(0, -1) });
    setLeaving(null);
  }, [done, inReview, onState, state]);

  const move = useCallback(
    (id: string, kind: StatementKind) => {
      if (done || state.locked.includes(id)) return;
      onState({ ...state, decisions: { ...state.decisions, [id]: kind } });
      setMarks((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    },
    [done, onState, state],
  );

  const check = useCallback(() => {
    if (done) return;
    const attempt = state.checksUsed + 1;
    const nextMarks: Record<string, Mark> = {};
    const locked = [...state.locked];
    let correct = 0;
    for (const s of statements) {
      const ok = state.decisions[s.id] === s.kind;
      nextMarks[s.id] = { ok, explanation: ok ? undefined : s.explanation };
      if (ok) {
        correct++;
        if (!locked.includes(s.id)) locked.push(s.id);
      }
    }
    const revealed = attempt >= 3;
    const decisions = { ...state.decisions };
    if (revealed) {
      for (const s of statements) {
        if (decisions[s.id] !== s.kind) decisions[s.id] = s.kind;
      }
    }
    setMarks(nextMarks);
    onState({
      ...state,
      decisions,
      checksUsed: attempt,
      firstCheckScore: state.firstCheckScore ?? (attempt === 1 ? correct : null),
      revealed,
      locked: revealed ? statements.map((s) => s.id) : locked,
    });
    onChecked(attempt, correct);
    setAnnounce(revealed ? taskCopy.sort.revealed : `${correct} of ${statements.length} correct.`);
  }, [done, onChecked, onState, state, statements]);

  /* Keys 1, 2, 3 decide and Backspace undoes from anywhere while the
     deck is up; arrows move focus across the three buttons. */
  useEffect(() => {
    if (inReview || done) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      const keys: Record<string, StatementKind> = { "1": "strength", "2": "weakness", "3": "na" };
      if (keys[e.key]) {
        e.preventDefault();
        decide(keys[e.key]);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inReview, done, decide, undo]);

  const onDeckKey = useCallback(
    (e: React.KeyboardEvent) => {
      const buttons = buttonsRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!buttons || buttons.length === 0) return;
      const list = [...buttons];
      const at = list.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const delta = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
        const next = e.key === "ArrowDown" ? 2 : Math.max(0, Math.min(list.length - 1, (at < 0 ? 0 : at) + delta));
        list[next]?.focus();
      }
    },
    [],
  );

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  useEffect(() => setMarks({}), [slide.id]);

  const glyph = (kind: StatementKind) =>
    kind === "strength" ? (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    ) : kind === "weakness" ? (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    );

  if (!inReview) {
    const leavingCard = leaving ? statements.find((s) => s.id === leaving.id) : null;
    return (
      <div className="dk-sort" onKeyDown={onDeckKey}>
        <div className="dk-sort-head">
          <h3>{taskCopy.sort.heading}</h3>
          <p className="dk-muted-text">{taskCopy.sort.instruction}</p>
          <div
            className="dk-pills"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={statements.length}
            aria-valuenow={decidedCount}
            aria-valuetext={taskCopy.sort.progressSr
              .replace("{n}", String(decidedCount))
              .replace("{total}", String(statements.length))}
          >
            {statements.map((s, i) => (
              <span
                key={s.id}
                className={`dk-pill${i < decidedCount ? " is-filled" : ""}${i === decidedCount ? " is-current" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="dk-card-zone">
          {leavingCard && (
            <div className={`dk-statement-card ${leaving?.dir}`} aria-hidden="true">
              <p className="dk-card-label">
                {taskCopy.sort.statementLabel.replace("{n}", String(decidedCount))}
              </p>
              <p className="dk-card-text">{leavingCard.text}</p>
            </div>
          )}
          {current && (
            <div className={`dk-statement-card${leaving ? " rise-in" : ""}`}>
              <p className="dk-card-label">
                {taskCopy.sort.statementLabel.replace("{n}", String(decidedCount + 1))}
              </p>
              <p className="dk-card-text">{current.text}</p>
            </div>
          )}
        </div>

        <div className="dk-decisions" ref={buttonsRef}>
          {KINDS.map((kind, i) => (
            <button key={kind} type="button" className="dk-decision" onClick={() => decide(kind)}>
              <span className="dk-decision-glyph">{glyph(kind)}</span>
              {KIND_LABEL(kind)}
              <kbd>{i + 1}</kbd>
            </button>
          ))}
        </div>
        <button type="button" className="dk-link dk-undo" onClick={undo} disabled={decidedCount === 0}>
          {taskCopy.sort.undo}
        </button>
        <p className="visually-hidden" aria-live="polite">
          {announce}
        </p>
      </div>
    );
  }

  const columns: Array<[StatementKind, string]> = [
    ["strength", taskCopy.sort.reviewStrengths],
    ["weakness", taskCopy.sort.reviewWeaknesses],
    ["na", taskCopy.sort.reviewNa],
  ];

  return (
    <div className="dk-sort dk-review">
      <div className="dk-sort-head">
        <h3>{taskCopy.sort.heading}</h3>
      </div>
      <div className="dk-columns">
        {columns.map(([kind, title]) => {
          const rows = statements.filter((s) => state.decisions[s.id] === kind);
          return (
            <section key={kind} className="dk-column" aria-label={title}>
              <h4>{title}</h4>
              {rows.length === 0 && <p className="dk-muted-text dk-empty">{taskCopy.sort.nothingHere}</p>}
              {rows.map((s) => {
                const mark = marks[s.id];
                const isLocked = state.locked.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`dk-row${mark ? (mark.ok ? " is-correct" : " is-wrong") : ""}`}
                    role="group"
                    aria-label={s.text}
                  >
                    <span className="dk-row-text">
                      {mark &&
                        (mark.ok ? (
                          <svg viewBox="0 0 24 24" className="dk-row-glyph" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="dk-row-glyph is-warn" aria-hidden="true">
                            <path d="M12 4l9 16H3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M12 10v4.5M12 17.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        ))}
                      {s.text}
                    </span>
                    {!isLocked && !done && (
                      <span className="dk-move" role="group" aria-label={`${taskCopy.sort.move}: ${s.text}`}>
                        {KINDS.filter((k) => k !== kind).map((k) => (
                          <button key={k} type="button" onClick={() => move(s.id, k)}>
                            {KIND_LABEL(k)}
                          </button>
                        ))}
                      </span>
                    )}
                    {mark && !mark.ok && mark.explanation && (
                      <span className="dk-row-explanation">{mark.explanation}</span>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
      <div className="dk-footer">
        <span className="dk-muted-text">
          {done
            ? taskCopy.sort.revealed
            : checksLeft === 1
              ? taskCopy.sort.oneCheckLeft
              : taskCopy.sort.checksLeftTemplate.replace("{n}", String(checksLeft))}
        </span>
        {done || state.locked.length === statements.length ? (
          <button
            type="button"
            className="dk-btn dk-primary"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onNext({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                r: Math.hypot(rect.width, rect.height) / 2,
              });
            }}
          >
            {isLast ? taskCopy.sort.finish : taskCopy.sort.next}
          </button>
        ) : (
          <button type="button" className="dk-btn dk-primary" onClick={check}>
            {taskCopy.sort.check}
          </button>
        )}
      </div>
    </div>
  );
}
