import type { PropsWithChildren } from "react";
import { taskCopy } from "./data";

/* The dark editor window (Brief 4 v2, Part 6.1): a VS Code flavoured
   panel sitting on the Canvas page. Title bar with decorative dots, the
   file tab, and the Explain | Sort phase switch; Sort stays locked until
   the walkthrough has been completed once on the slide. */

export type Phase = "explain" | "sort";

interface DarkPanelProps extends PropsWithChildren {
  tab: string;
  phase: Phase;
  sortUnlocked: boolean;
  justUnlocked: boolean;
  onPhase: (phase: Phase) => void;
}

export default function DarkPanel({ tab, phase, sortUnlocked, justUnlocked, onPhase, children }: DarkPanelProps) {
  return (
    <section className="dark-panel" aria-label={tab}>
      <div className="dk-titlebar">
        <span className="dk-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="dk-tab">{tab}</span>
        <div className="dk-switch" role="group">
          <button
            type="button"
            className={`dk-seg${phase === "explain" ? " is-active" : ""}`}
            aria-pressed={phase === "explain"}
            onClick={() => onPhase("explain")}
          >
            {taskCopy.editor.phaseExplain}
          </button>
          <button
            type="button"
            className={`dk-seg${phase === "sort" ? " is-active" : ""}${justUnlocked ? " is-pulsing" : ""}`}
            aria-pressed={phase === "sort"}
            disabled={!sortUnlocked}
            title={sortUnlocked ? undefined : taskCopy.editor.lockTip}
            onClick={() => sortUnlocked && onPhase("sort")}
          >
            {!sortUnlocked && (
              <svg viewBox="0 0 24 24" className="dk-lock" aria-hidden="true">
                <rect x="6" y="10.5" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
            {taskCopy.editor.phaseSort}
            {!sortUnlocked && <span className="visually-hidden">. {taskCopy.editor.lockTip}</span>}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
