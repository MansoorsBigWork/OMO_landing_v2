/* Copy and structure for the course sections sidebar. Stage paths
   carry a {slug} placeholder the component fills in. Stages unlock in
   order: a stage opens when the one before it is complete. The AI
   interlude is not listed; it is a one-off reminder in the flow, not a
   section. */

export interface NavStage {
  id: "overview" | "welcome" | "intro" | "pathfinding" | "build";
  label: string;
  hint: string;
  path: string;
}

export const courseNavCopy = {
  ribbonLabel: "Course sections",
  title: "The Last Mile",
  subtitle: "Inside the UK Delivery Network",
  close: "Close",
  statusDone: "Completed",
  statusOpen: "Available",
  statusLocked: "Locked until you reach it",
  expandTemplate: "Show the sections of {label}",
  collapseTemplate: "Hide the sections of {label}",
  portalLink: "Back to your portal",
} as const;

export const navStages: ReadonlyArray<NavStage> = [
  { id: "overview", label: "Course overview", hint: "About the OMOship, and where you enrol", path: "/portal/omoships/{slug}" },
  { id: "welcome", label: "Welcome", hint: "The slideshow that opens the course", path: "/portal/omoships/{slug}/welcome" },
  { id: "intro", label: "The delivery network", hint: "The guided tour of a delivery day", path: "/portal/omoships/{slug}/intro" },
  { id: "pathfinding", label: "Task: pathfinding", hint: "Watch, explain and sort the algorithms", path: "/portal/omoships/{slug}/week-1/pathfinding" },
  { id: "build", label: "Build: the project", hint: "The brief, the starter and your submission", path: "/portal/omoships/{slug}/week-1/build" },
];
