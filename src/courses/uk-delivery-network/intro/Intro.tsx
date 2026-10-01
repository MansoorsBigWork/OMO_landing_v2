import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../../shared/components/Button";
import Stage from "./stage/Stage";
import { usePlayheadController } from "./stage/usePlayhead";
import { useSectionTarget } from "./stage/useSectionTarget";
import Section from "./reading/Section";
import AmberTransition from "../pathfinding/AmberTransition";
import { transitionCopy } from "../pathfinding/data";
import ProgressRail from "./reading/ProgressRail";
import {
  closingStats,
  introCopy,
  sections,
} from "./data";
import { ukDeliveryNetwork as course } from "../course";
import {
  readAnswers,
  recordAnswer,
  recordIntroCompletion,
  type AnswerRecord,
} from "../../shared/lib/progressStore";
import "./intro.css";

/* The intro page: split stage (Brief 2, Part 2), reading column with
   eight sections, questions and flashcards, and the Start Week 1 gate. */

const TOTAL_QUESTIONS = sections.filter((s) => s.question).length;

export default function Intro() {
  const controller = usePlayheadController();
  const readingRef = useRef<HTMLDivElement>(null);
  const currentIndex = useSectionTarget(controller, readingRef);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(() =>
    readAnswers(course.slug),
  );
  const [reachedEnd, setReachedEnd] = useState(false);
  const [transition, setTransition] = useState<{ x: number; y: number; r: number } | null>(null);

  const onAnswer = useCallback((questionId: string, chosen: string, correct: boolean) => {
    const record: AnswerRecord = { chosen, correct, answeredAt: Date.now() };
    recordAnswer(course.slug, questionId, record);
    setAnswers((prev) => ({ ...prev, [questionId]: record }));
  }, []);

  const answeredIds = useMemo(() => new Set(Object.keys(answers)), [answers]);
  const answeredCount = sections.filter((s) => s.question && answers[s.question.id]).length;
  const remaining = TOTAL_QUESTIONS - answeredCount;
  const complete = remaining === 0;

  useEffect(() => {
    if (currentIndex === sections.length - 1) setReachedEnd(true);
  }, [currentIndex]);

  useEffect(() => {
    if (reachedEnd && complete) recordIntroCompletion(course.slug);
  }, [reachedEnd, complete]);

  return (
    <div className="intro-page">
      <div className="intro-stage-col">
        <div className="intro-stage-sticky">
          <Stage controller={controller} label={introCopy.stageLabel} />
        </div>
      </div>

      <div className="intro-reading" ref={readingRef}>
        <ProgressRail currentIndex={currentIndex} answeredIds={answeredIds} />
        <div className="intro-reading-inner">
          <h1 className="intro-title">{introCopy.pageTitle}</h1>

          {sections.map((section, i) => (
            <Section
              key={section.id}
              section={section}
              index={i}
              answer={section.question ? answers[section.question.id] : undefined}
              onAnswer={onAnswer}
            />
          ))}

          <dl className="closing-stats">
            {closingStats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="intro-footer">
            <Button
              disabled={!complete}
              onClick={(e) => {
                if (!complete) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTransition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                  r: Math.hypot(rect.width, rect.height) / 2,
                });
              }}
            >
              {complete
                ? introCopy.startButton
                : `${introCopy.startDisabled} · ${introCopy.remainingTemplate.replace(
                    "{count}",
                    String(remaining),
                  )}`}
            </Button>
          </div>
        </div>
      </div>

      {transition && (
        <AmberTransition origin={transition} to={`/portal/omoships/${course.slug}/week-1/pathfinding`} copy={transitionCopy} />
      )}
    </div>
  );
}
