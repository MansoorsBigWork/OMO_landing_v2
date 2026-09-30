import { useId } from "react";
import type { IntroQuestion } from "../data";
import { introCopy } from "../data";
import type { AnswerRecord } from "../../../shared/lib/progressStore";

/* One question per section. Radio behaviour restyled from the 21st.dev
   Question Tool starting point to OMO tokens: selection answers at once,
   the chosen option outlines in amber, the correct option fills with the
   blue tint, and the explanation slides in. Wrong answers are recorded,
   never penalised, and there is no second try. */

interface QuestionProps {
  question: IntroQuestion;
  number: number;
  answer?: AnswerRecord;
  onAnswer: (questionId: string, chosen: string, correct: boolean) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export default function Question({ question, number, answer, onAnswer }: QuestionProps) {
  const name = useId();
  const answered = answer !== undefined;

  return (
    <fieldset className="question" data-answered={answered || undefined}>
      <legend>
        <span className="question-number">
          {introCopy.questionLegendPrefix} {number}
        </span>
        {question.prompt}
      </legend>
      <div className="question-options">
        {question.options.map((opt, i) => {
          const chosen = answer?.chosen === opt.id;
          const correct = opt.id === question.correctId;
          const cls = [
            "q-option",
            answered && chosen ? "is-chosen" : "",
            answered && correct ? "is-correct" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <label key={opt.id} className={cls}>
              <input
                type="radio"
                name={name}
                value={opt.id}
                checked={chosen}
                disabled={answered && !chosen}
                onChange={() => {
                  if (!answered) onAnswer(question.id, opt.id, correct);
                }}
              />
              <span className="q-letter" aria-hidden="true">
                {LETTERS[i]}
              </span>
              <span className="q-label">{opt.label}</span>
            </label>
          );
        })}
      </div>
      <div className="q-reveal" aria-live="polite">
        {answered && (
          <p className="q-explanation">
            <strong>{answer.correct ? introCopy.correctLabel : introCopy.incorrectLabel}</strong>{" "}
            {question.explanation}
          </p>
        )}
      </div>
    </fieldset>
  );
}
