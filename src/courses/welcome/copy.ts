/* Copy for the welcome slideshow, shared across all OMOships. Per-OMOship
   values (title, sector, tools) are read from the OMOship's own data file
   and resolved into {{omoship.title}} style placeholders at render. */

export type WelcomeVisual = "timeline" | "repo" | "companies" | "tools" | "assessment";

export interface WelcomeSlide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: WelcomeVisual;
}

export const slides: ReadonlyArray<WelcomeSlide> = [
  {
    id: "welcome",
    eyebrow: "You’re enrolled",
    title: "Welcome to {{omoship.title}}",
    body: "You’ll work on a real problem, build something you can show, and get honest feedback on it. Here’s what you’ll walk away with.",
    visual: "timeline",
  },
  {
    id: "github-project",
    eyebrow: "What you’ll get",
    title: "A finished project on your GitHub",
    body: "Not a certificate. A repository with real commits, a README, and a recommendation you can defend in an interview. Employers can read the code, not just the badge.",
    visual: "repo",
  },
  {
    id: "real-problems",
    eyebrow: "What you’ll get",
    title: "Built on problems companies actually have",
    body: "Every OMOship starts from conversations with the teams who live with these problems. This one comes from how delivery networks lose time and money in the last mile.",
    visual: "companies",
  },
  {
    id: "industry-tools",
    eyebrow: "What you’ll learn",
    title: "Tools you’ll use on the job",
    body: "You’ll work the way teams work: version control, a shared repository, and the same runtime and libraries used in production. No toy sandbox.",
    visual: "tools",
  },
  {
    id: "how-it-works",
    eyebrow: "Before you start",
    title: "Two things get assessed",
    body: "You’ll build the project, then record a short video explaining what you built and why. Both are scored against criteria set by the partner’s own managers. Strong work gets shortlisted.",
    visual: "assessment",
  },
];

/* Slide 3. Names may only be listed once confirmed for this context;
   none are confirmed, so the list is empty and the slide shows no
   company row. */
export const companies: string[] = [];

export const welcomeCopy = {
  companiesKicker: "Shaped by conversations with teams at",
  repo: {
    name: "last-mile-depot-analysis",
    commits: "34 commits",
    checks: "All checks passed",
    files: ["README.md", "analysis/", "recommendation.md"],
  },
  assessment: {
    cards: [
      { title: "Project", body: "Scored on meeting the requirements and design decisions" },
      { title: "Video", body: "Scored on how clearly and succinctly you explain the technical detail" },
    ],
    note: "No one is rejected from taking part. Not everyone passes.",
  },
  ui: {
    skip: "Skip",
    next: "Next",
    start: "Start the course",
    dotLabel: "Go to slide {n}: {title}",
    liveRegion: "Slide {n} of {total}: {title}",
    sidebarLink: "What you’ll get out of this",
    carouselLabel: "What you’ll get out of this OMOship",
  },
} as const;

export function resolvePlaceholders(text: string, omoship: { title: string; sector: string }): string {
  return text
    .replaceAll("{{omoship.title}}", omoship.title)
    .replaceAll("{{omoship.sector}}", omoship.sector);
}
