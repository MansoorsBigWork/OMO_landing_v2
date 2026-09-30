import type { ReactNode } from "react";
import type { IntroSection } from "../data";
import TermPopover from "./TermPopover";
import Question from "./Question";
import Flashcard from "./Flashcard";
import { glossary, introCopy } from "../data";
import type { AnswerRecord } from "../../../shared/lib/progressStore";

/* One reading section: heading, body with inline terms, an optional
   question, and the section's flashcards. */

const MARKER = /\{\{term:([a-z-]+)(?::([^}]+))?\}\}/g;

function renderBody(paragraph: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  MARKER.lastIndex = 0;
  while ((m = MARKER.exec(paragraph)) !== null) {
    if (m.index > last) out.push(paragraph.slice(last, m.index));
    out.push(<TermPopover key={`${keyPrefix}-${i++}`} slug={m[1]} display={m[2]} />);
    last = m.index + m[0].length;
  }
  if (last < paragraph.length) out.push(paragraph.slice(last));
  return out;
}

interface SectionProps {
  section: IntroSection;
  index: number;
  answer?: AnswerRecord;
  onAnswer: (questionId: string, chosen: string, correct: boolean) => void;
}

export default function Section({ section, index, answer, onAnswer }: SectionProps) {
  return (
    <section
      className="intro-section"
      id={section.id}
      data-section-keyframe={section.keyframe}
      aria-labelledby={`${section.id}-h`}
    >
      <h2 id={`${section.id}-h`}>{section.heading}</h2>
      {section.body.map((p, i) => (
        <p key={i}>{renderBody(p, `${section.id}-${i}`)}</p>
      ))}

      {section.question && (
        <Question
          question={section.question}
          number={index + 1}
          answer={answer}
          onAnswer={onAnswer}
        />
      )}

      {section.flashcards.length > 0 && (
        <div className="flashcards">
          <h3 className="flashcards-heading">{introCopy.flashcardsLabel}</h3>
          <p className="flashcards-hint">{introCopy.flashcardHint}</p>
          <ul className="flashcards-grid">
            {section.flashcards.map((slug) => (
              <li key={slug}>
                <Flashcard front={glossary[slug].front} back={glossary[slug].back} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
