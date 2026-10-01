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
    "In this OMOship you will access the experience of work remotely inside a delivery network. You will follow one parcel through the real UK network, learn how a van finds its way through a city, then take a brief from the operations team at Kestrel Parcels: replace their hand-made delivery plan with an algorithm that decides which van takes which parcel, the roads between stops, and what to do when a road closes or an order arrives late.",
    "Your submissions are graded by OMO against the partner’s own criteria. Strong performers are shortlisted to the partner’s early careers team.",
  ],
  weeksHeading: "What you will do",
  weeks: [
    {
      label: "Part 1",
      title: "Learn the network",
      tasks: [
        "Follow a parcel from an order in Sheffield through a fulfilment centre, two depots, the night trunk and the national hub to the doorstep, answering a question at each stage",
        "Watch five pathfinding algorithms search a city map, explain each one step by step, and sort their strengths and weaknesses",
      ],
    },
    {
      label: "Part 2",
      title: "Build the planner",
      tasks: [
        "Take a brief from Kestrel Parcels, a delivery company whose vans are planned by hand: parcels delivered late, two vans on the same street an hour apart, drivers finding out about a closed bridge when they reach it",
        "Get a working code project from us on GitHub. It recreates a day of deliveries across a city, with the planning part left for you to write: which van takes which parcel, in what order, by which roads, and what to do when a road closes or an order arrives late",
        "Run your plan against realistic days, including the bad ones, and watch your score: parcels delivered on time first, then kilometres driven",
        "Submit a link to your finished GitHub repository and a Google Drive link to a two-minute video of you talking through what you built",
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
