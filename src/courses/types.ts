/* The shape every OMOship's course data must satisfy. The dashboard's
   listing page and the shared course stages (welcome, AI interlude) read
   from this; each course fills it in its own course.ts. */

export type OmoshipStatus = "open" | "full" | "closed";

export interface Omoship {
  slug: string;
  sector: string;
  eyebrow: string;
  title: string;
  strapline: string;
  partner: { name: string; anonymised: boolean };
  stats: ReadonlyArray<{ label: string; value: string }>;
  description: ReadonlyArray<string>;
  weeksHeading: string;
  weeks: ReadonlyArray<{ label: string; title: string; tasks: ReadonlyArray<string> }>;
  capacity: number;
  status: OmoshipStatus;
  /* Days until graded work is returned, shown on the build page. */
  feedbackDays: number;
  /* Tool tiles for the welcome slideshow. Set from the Week 1 brief when
     it exists; until then the core toolchain. */
  tools: ReadonlyArray<{ name: string; icon: string }>;
  enrol: {
    buttonLabel: string;
    waitlistLabel: string;
    continueLabel: string;
    errorMessage: string;
  };
}
