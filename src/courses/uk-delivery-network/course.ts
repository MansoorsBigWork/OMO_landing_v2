/* Course data for The Last Mile OMOship. All copy rendered on the course
   page is read from this object, never hard-coded in JSX. */

import type { Omoship } from "../types";

export const ukDeliveryNetwork: Omoship = {
  slug: "uk-delivery-network",
  sector: "Logistics",
  eyebrow: "OMOship",
  title: "The Last Mile: Inside the UK Delivery Network",
  strapline: "Real operational problems. Your work, graded.",
  partner: { name: "Partner employer to be confirmed", anonymised: true },
  stats: [
    { label: "Commitment", value: "5 to 7 hours" },
    { label: "Format", value: "Remote, part-time compatible" },
    { label: "Outcome", value: "A project on your CV that employers actually value" },
  ],
  description: [
    "Every day the UK moves tens of millions of parcels through a network most people never see: sortation hubs, line-haul trunking, regional depots, and the final drive to the doorstep. The last mile is the most expensive and least predictable part of that journey, and it is where the best operators earn their margin.",
    "In this OMOship you will access the experience of work remotely inside a delivery network. You will be handed a depot’s real-shaped data, a service level that is being missed, and a brief from the operations team. You will diagnose where the network is losing time and money, model two alternative fixes, and present a recommendation the depot manager could act on next Monday.",
    "Your submissions are graded by OMO against the partner’s own criteria. Strong performers are shortlisted to the partner’s early careers team.",
  ],
  weeksHeading: "What you will do",
  weeks: [
    {
      label: "Part 1",
      title: "Diagnose",
      tasks: [
        "Map the flow of a parcel from inbound trunk to doorstep and identify the four handover points where delay is introduced",
        "Analyse a week of depot data (route counts, failed deliveries, stem times, driver utilisation) and quantify the cost of the missed service level",
        "Submit a one-page diagnosis with the single largest driver of lost time named and evidenced",
      ],
    },
    {
      label: "Part 2",
      title: "Fix and recommend",
      tasks: [
        "Model two interventions (for example: route re-sequencing, out-of-home pickup points, a revised cut-off time) and estimate the effect of each on cost per parcel and on-time rate",
        "Write a recommendation memo for the depot manager, no longer than two pages",
        "Record a five-minute presentation of the recommendation",
      ],
    },
  ],
  capacity: 20,
  status: "open",
  feedbackDays: 5,
  tools: [
    { name: "Git", icon: "git" },
    { name: "GitHub", icon: "github" },
    { name: "Node.js", icon: "node" },
    { name: "TypeScript", icon: "typescript" },
  ],
  enrol: {
    buttonLabel: "Enrol on this OMOship",
    waitlistLabel: "Cohort full. Join the waitlist",
    continueLabel: "Continue",
    errorMessage: "Something went wrong and your enrolment was not saved. Check your connection and try again.",
  },
};
