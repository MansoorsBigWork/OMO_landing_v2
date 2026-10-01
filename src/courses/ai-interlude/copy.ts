/* Copy for the AI interlude, shared across all OMOships. The robot and
   scene are BoltScene.tsx; timing.json beside it is the clock. */

export interface InterludeLine {
  text: string;
  emphasis?: string;
}

export const projectTransitionCopy = {
  headline: "Time for the Project",
  subline: "But before you start the task, there is a quick message.",
  continueLabel: "Continue",
  announcement: "Time for the project. A quick message before the task.",
} as const;

export const interludeCopy = {
  message1: [
    { text: "AI is ok to use." },
    { text: "But don’t let it {em} for you.", emphasis: "think" },
  ] as ReadonlyArray<InterludeLine>,
  message2: [
    { text: "If there is anything the world needs right now," },
    { text: "it’s {em}.", emphasis: "creativity" },
  ] as ReadonlyArray<InterludeLine>,
  continueLabel: "Continue",
  skipLabel: "Skip",
  hiddenDescription:
    "A small robot walks on, tries to think too hard, and comes apart into gears and springs.",
  announce1: "AI is ok to use. But don’t let it think for you.",
  announce2: "If there is anything the world needs right now, it’s creativity.",
  briefPlaceholder: "Project brief opens next",
} as const;
