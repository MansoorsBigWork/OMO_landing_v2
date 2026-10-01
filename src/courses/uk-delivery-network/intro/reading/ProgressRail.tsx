import { introCopy, sections } from "../data";

/* The eight-section progress rail: numbered boxes, restyled from the
   step indicator pattern on 21st.dev (controlled activeIndex). The
   current box is blue-bordered, answered sections render filled, and
   the final box is amber with a tick to mark the finish. */

interface ProgressRailProps {
  currentIndex: number;
  answeredIds: ReadonlySet<string>;
}

export default function ProgressRail({ currentIndex, answeredIds }: ProgressRailProps) {
  return (
    <nav className="progress-rail" aria-label={introCopy.railLabel}>
      <ul>
        {sections.map((s, i) => {
          const answered = s.question ? answeredIds.has(s.question.id) : false;
          const finish = i === sections.length - 1;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={[
                  "rail-dot",
                  finish ? "is-finish" : "",
                  i === currentIndex ? "is-current" : "",
                  answered ? "is-answered" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={i === currentIndex ? "true" : undefined}
                aria-label={s.heading}
                onClick={() => {
                  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? ("auto" as const)
                    : ("smooth" as const);
                  /* The finish box goes to the very end, so the closing
                     stats and the Start button are in view. */
                  const target = finish
                    ? document.querySelector(".intro-footer") ?? document.getElementById(s.id)
                    : document.getElementById(s.id);
                  target?.scrollIntoView({ behavior, block: finish ? "end" : "start" });
                }}
              >
                {finish ? (
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span aria-hidden="true">{i + 1}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
