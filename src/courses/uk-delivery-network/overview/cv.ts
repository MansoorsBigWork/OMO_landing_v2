/* Copy for the CV preview on the course overview: two ready-to-paste entries
   for the finished project, one written for software roles and one for data
   roles. Bracketed parts are for the student to fill in. */

export interface CvTemplate {
  id: "software" | "data";
  tab: string;
  heading: string;
  subheading: string;
  bullets: ReadonlyArray<string>;
}

export const cvCopy = {
  trigger: "See this on your CV",
  title: "How this looks on your CV",
  lead: "Two versions of the finished project, written the way a CV entry reads. Pick the one closer to the roles you want, copy it, and swap the bracketed parts for your own. Keep only the bullets that are true of what you built.",
  copy: "Copy this entry",
  copied: "Copied",
  close: "Close",
  tablist: "CV versions",
} as const;

export const cvTemplates: ReadonlyArray<CvTemplate> = [
  {
    id: "software",
    tab: "Software engineering",
    heading: "Delivery Route Planner, OMOship with One Million Opportunities",
    subheading: "Brief set by Kestrel Parcels · [Month Year] · github.com/[your-username]/omo-last-mile-starter",
    bullets: [
      "Built a delivery planning algorithm in TypeScript for a simulated city with four depots and a fleet of vans: assigning parcels to vans under depot stock and van capacity constraints, sequencing stops, and routing between them on a road network with live traffic costs",
      "Implemented graph search over the city network (Dijkstra and A*) and a replanning step that reacts to road closures and late orders during the day",
      "Optimised against a published scoring formula (on-time deliveries, kilometres driven, undelivered parcels, rule violations) and iterated the planner across five test scenarios from a quiet day to a stress day",
      "Shipped as a public GitHub repository with a passing test suite and a README on the approach, and presented the work in a two-minute recorded walkthrough",
    ],
  },
  {
    id: "data",
    tab: "Data and analytics",
    heading: "Last-Mile Delivery Optimisation, OMOship with One Million Opportunities",
    subheading: "Brief set by Kestrel Parcels · [Month Year] · github.com/[your-username]/omo-last-mile-starter",
    bullets: [
      "Modelled a day of last-mile deliveries across four depots as a combined assignment and routing problem, with constraints on depot stock and van capacity and an objective weighted towards on-time delivery",
      "Compared five shortest-path algorithms (breadth-first, Dijkstra, greedy best-first, A*, weighted A*) on nodes explored, path cost and runtime, and chose the heuristic search for the planner",
      "Evaluated the planner across five scenarios including road closures and late orders, tracking on-time rate, kilometres per parcel and undelivered parcels against the baseline plan",
      "Documented method and results in a public GitHub repository and a two-minute recorded summary",
    ],
  },
];

/* The entry as plain text, for the clipboard */
export function cvPlainText(t: CvTemplate): string {
  return [t.heading, t.subheading, ...t.bullets.map((b) => `• ${b}`)].join("\n");
}
