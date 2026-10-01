/* All copy for the build page. Everything quoted from the starter
   (scripts, files, scoring, the contract, the naive planner's scores)
   was copied from OMO-Courses/omo-last-mile-starter at v1.0.0. */

export const starter = {
  name: "omo-last-mile-starter",
  description: "A simulated delivery day for Kestrel Parcels in Harrowgate, with a naive planner to replace",
  repoUrl: "https://github.com/OMO-Courses/omo-last-mile-starter",
  forkUrl: "https://github.com/OMO-Courses/omo-last-mile-starter/fork",
  tag: "v1.0.0",
  cloneCommand: "git clone https://github.com/your-username/omo-last-mile-starter.git",
  cdCommand: "cd omo-last-mile-starter",
  scripts: {
    install: "npm install",
    dev: "npm run dev",
    scoreAll: "npm run score -- --all",
    scoreOne: "npm run score -- s03",
    replay: "npm run replay -- s03",
    test: "npm test",
    check: "npm run check",
  },
  allowedDeps: ["lodash", "heap-js", "tinyqueue"],
} as const;

export const buildCopy = {
  header: "Build · The Last Mile",
  status: {
    notStarted: "Not started",
    inProgress: "In progress",
    submitted: "Submitted",
    graded: "Graded",
  },
  markRead: "Mark as read",
  markedRead: "Read",
  copy: "Copy",
  copied: "Copied",
  navLabel: "Sections",
} as const;

export interface SectionMeta {
  id: string;
  number: string;
  navLabel: string;
  title: string;
}

export const sections: ReadonlyArray<SectionMeta> = [
  { id: "prerequisites", number: "1", navLabel: "Prerequisites", title: "Before you start" },
  { id: "the-brief", number: "2", navLabel: "The brief", title: "The brief from Kestrel Parcels" },
  { id: "project-files", number: "3", navLabel: "Get the code", title: "Get the code" },
  { id: "codebase", number: "4", navLabel: "The codebase", title: "Where things are and where you write code" },
  { id: "submission", number: "5", navLabel: "Submission", title: "Submit your work" },
];

/* Section 1 */
export const prerequisites = {
  intro: "You need four things on your machine. Each takes a few minutes. If you already have them, run the check commands and move on.",
  items: [
    { id: "git", name: "Git", why: "To get the code and to put your finished work on GitHub", link: "https://git-scm.com/downloads", verify: "git --version" },
    { id: "node", name: "Node.js 22 or later", why: "The project runs on it", link: "https://nodejs.org", verify: "node --version" },
    { id: "editor", name: "A code editor", why: "VS Code is what we use in the walkthroughs; any editor works", link: "https://code.visualstudio.com", verify: "" },
    { id: "github", name: "A GitHub account", why: "Your finished repository lives there; it is your portfolio", link: "https://github.com/signup", verify: "" },
  ],
  video: "You will also need a way to record a two-minute video of yourself. Your phone, a laptop webcam, or a screen recorder all work. Details in section 5.",
} as const;

/* Section 2 */
export const memo = {
  from: "From: Regional Operations, Kestrel Parcels",
  paragraphs: [
    "Kestrel runs four depots across Harrowgate. Each depot holds stock, but not the same stock: some lines are only at one depot, and quantities differ. Each morning a fleet of vans leaves the depots to deliver orders to addresses across the city, each with a delivery window the customer was promised.",
    "Today the plan is made by hand and it is not good. Vans drive across the city for a single parcel. Two vans visit the same street an hour apart. When a bridge closes, drivers find out when they reach it. When an order comes in after the vans have left, it waits for tomorrow.",
    "We want an algorithm that does three things. Decide which van takes which delivery, respecting what each depot actually has and what each van can carry. Decide the order of stops and the roads between them, using the traffic we can see, not the speed limit. And when something changes during the day, a jam, a closed road, a late order, a van off the road, change the plan without starting from nothing.",
    "We measure one thing above all: parcels delivered inside their window. After that, kilometres driven. A plan that breaks the rules, loading stock a depot does not have, or overloading a van, is not a plan.",
  ],
  after:
    "That is the whole task. The rest of this page gives you a working simulation of Harrowgate so you can build and test your algorithm against realistic days, including the bad ones.",
  scoringTitle: "What good looks like",
  scoring: [
    { measure: "Parcels on time", weight: "100 × the on-time fraction", note: "The heart of the score" },
    { measure: "Kilometres driven", weight: "minus 0.02 per km", note: "Efficiency, after reliability" },
    { measure: "Undelivered parcels", weight: "minus 10 × the undelivered fraction", note: "A missed parcel costs more than a late one" },
    { measure: "Rule violations", weight: "minus 25 if there are any", note: "Phantom stock or an overloaded van voids the plan" },
  ],
  scoringNote: "The formula is printed in the starter README and in src/sim/scoring.ts. You are optimising something you can read.",
} as const;

/* Section 3 */
export const getCode = {
  intro:
    "Three steps. Make your own copy of the starter on GitHub, download that copy to your machine, then run it. At the end you have the simulation running locally, inside a repository you own, and that repository is the one you will submit in section 5.",
  viewRepoLink: "Look inside the starter first",
  forkTitle: "Step 1 · Make your own copy on GitHub",
  forkBody:
    "Press the button below. GitHub opens a page titled Create a new fork; press the green Create fork button on that page and give it a moment. You now have your own copy of the starter, with all its files, at github.com/your-username/omo-last-mile-starter. Everything you do from here happens in your copy.",
  forkButton: "Fork on GitHub",
  cloneTitle: "Step 2 · Download your copy to your machine",
  cloneBody:
    "Open a terminal in the folder where you keep projects and run these two commands, with your-username replaced by your GitHub username. The first downloads your copy into a new folder called omo-last-mile-starter; the second moves you into that folder.",
  cloneTip:
    "Not sure of the address? On your fork's GitHub page, press the green Code button; the address shown there is the one to clone.",
  runTitle: "Step 3 · Run it",
  runBody:
    "Still inside that folder, run these two. The first installs the project's packages and takes a minute; the second starts the delivery-day viewer and prints a local address to open in your browser.",
  runSteps: ["npm install", "npm run dev"],
  viewerCaption:
    "The viewer on the Quiet day scenario: four depots, vans leaving with their routes as dashed lines, doors turning green on time and red late. One real second is one simulated minute.",
  scoreTitle: "Score it",
  scoreCommand: "npm run score -- --all",
  naiveOutput: `scenario         on-time   late  undeliv     km  hours  inv  cap  closed  score  grade
---------------  -------  -----  -------  -----  -----  ---  ---  ------  -----  -----
s01-quiet-day      60.0%  40.0%     0.0%   68.2   27.6    0    0       0   58.6      C
s02-busy-day       38.6%  61.4%     0.0%  263.6   41.7    0    0       0   33.3      E
s03-diversions     40.0%  60.0%     0.0%  328.8   35.0    0    0       4   33.4      E
s04-late-orders    39.3%  39.3%    21.4%  211.9   37.2    0    0       0   32.9      E
s05-stress         38.9%  49.2%    11.9%  382.9   68.3   18    2       0    5.0      E

overall: 32.7`,
  scoreNote:
    "This is your starting point. It scores about 60 on a quiet day and falls apart on the others. Your job is to beat it, then keep beating it.",
  scenariosTitle: "What the simulation throws at you",
  scenarios: [
    { id: "s01", name: "Quiet day", vans: 4, deliveries: 40, character: "Nothing goes wrong. If you cannot score here, fix routing first" },
    { id: "s02", name: "Busy day", vans: 6, deliveries: 140, character: "Volume. Tight windows and rush-hour traffic" },
    { id: "s03", name: "Diversions", vans: 6, deliveries: 120, character: "Bridges close mid-morning. The naive planner queues at them" },
    { id: "s04", name: "Late orders", vans: 6, deliveries: 110, character: "Thirty orders arrive while the vans are already out" },
    { id: "s05", name: "Stress", vans: 8, deliveries: 230, character: "Everything at once, plus a breakdown and scarce stock" },
  ],
  eventsTitle: "Four things can happen during a day",
  events: [
    { name: "Traffic", plain: "some roads get slower for a while" },
    { name: "Diversion", plain: "some roads close completely, then reopen" },
    { name: "Order", plain: "a new delivery appears after the vans have left" },
    { name: "Breakdown", plain: "a van stops moving for a while" },
  ],
} as const;

/* Section 4 */
export interface FileNode {
  path: string;
  description: string;
  tag?: "edit" | "readonly";
  children?: ReadonlyArray<FileNode>;
}

export const fileTree: ReadonlyArray<FileNode> = [
  {
    path: "src/planner/",
    description: "Yours. The three functions grading copies onto a fresh checkout",
    tag: "edit",
    children: [
      { path: "index.ts", description: "Exports the planner object; wiring, rarely edited", tag: "edit" },
      { path: "assign.ts", description: "Which van takes which delivery", tag: "edit" },
      { path: "route.ts", description: "The order of stops and the path between them", tag: "edit" },
      { path: "replan.ts", description: "What to do when an event arrives", tag: "edit" },
      { path: "README.md", description: "The contract, the naive planner's weaknesses, the rules", tag: "edit" },
    ],
  },
  {
    path: "src/sim/",
    description: "The company's system: the world, the clock, the scoring",
    tag: "readonly",
    children: [
      { path: "graph.ts", description: "The road network: nodes, edges, neighbours, distances", tag: "readonly" },
      { path: "travelTime.ts", description: "Live minutes per edge: zones, noise, traffic", tag: "readonly" },
      { path: "clock.ts", description: "The simulated day, minute by minute", tag: "readonly" },
      { path: "events.ts", description: "Traffic, diversions, late orders, breakdowns", tag: "readonly" },
      { path: "world.ts", description: "Current state: trucks, deliveries, depots, counters", tag: "readonly" },
      { path: "executor.ts", description: "Drives the vans along your plans and enforces the rules", tag: "readonly" },
      { path: "scoring.ts", description: "The formula. Read it; you are optimising it", tag: "readonly" },
      { path: "types.ts", description: "Every shape the contract mentions", tag: "readonly" },
    ],
  },
  {
    path: "src/viewer/",
    description: "The map you watch. Reloads when you save",
    tag: "readonly",
    children: [
      { path: "main.ts", description: "Boots a scenario and runs the day", tag: "readonly" },
      { path: "map.ts", description: "Draws Harrowgate, vans and doors", tag: "readonly" },
      { path: "ui.ts", description: "Controls, live score, detail panels", tag: "readonly" },
    ],
  },
  {
    path: "data/",
    description: "Harrowgate and the five scenario days",
    tag: "readonly",
    children: [
      { path: "city/harrowgate.json", description: "The road graph, depots and drawing data", tag: "readonly" },
      { path: "scenarios/", description: "s01 quiet to s05 stress, seeds included", tag: "readonly" },
    ],
  },
  {
    path: "tests/",
    description: "Keep these green; grading rejects a red suite",
    tag: "readonly",
    children: [
      { path: "planner/planner.test.ts", description: "No violations on s01, connected paths, replan under 200ms", tag: "readonly" },
    ],
  },
  { path: "scripts/", description: "City and scenario generators, and the grader itself", tag: "readonly" },
];

export const simFiles = {
  title: "The company's system",
  intro: "In the order a day happens:",
  files: [
    { name: "graph.ts", text: "Holds the road network and answers the questions routing needs: neighbours of a node, the edge between two nodes, straight-line distance." },
    { name: "travelTime.ts", text: "Turns an edge into minutes right now: speed limit, zone factor, seeded noise and any live traffic event." },
    { name: "clock.ts", text: "Ticks the day forward one simulated minute at a time and fires whatever is due." },
    { name: "events.ts", text: "Injects the scenario's traffic, diversions, late orders and breakdowns at their times, then hands each one to your replan." },
    { name: "world.ts", text: "The read-only snapshot your functions receive: trucks, deliveries, depots, stock and counters, frozen at the moment of the call." },
    { name: "executor.ts", text: "Drives every van along your routes, enforces loading, windows and closures, and calls your functions at the moments the contract promises." },
    { name: "scoring.ts", text: "Adds the day up with the printed weights. Nothing hidden; the grade bands sit beside the formula." },
  ],
} as const;

export const plannerContract = {
  title: "Your three functions",
  code: `export interface Planner {
  // Called once at the start of the day with everything known so far.
  assign(world: WorldSnapshot): Assignment;
  // Called per truck after assignment and after any replan.
  route(world: WorldSnapshot, truck: Truck, deliveries: Delivery[]): Route;
  // Called whenever an event arrives. Return a partial or full new plan, or null to keep going.
  replan(world: WorldSnapshot, event: SimEvent, current: Plan): Plan | null;
}`,
  functions: [
    {
      name: "assign",
      when: "Once at the start of the day.",
      receives: "The world snapshot: depots with stock, trucks with capacity, every pending delivery.",
      returns: "A map from delivery id to truck id, or null to leave one unassigned.",
      stub: "Deals deliveries round-robin to the nearest staffed depot. It never looks at windows, stock or capacity, which is why s05 produces phantom-stock violations and overloaded vans.",
      prompts: [
        "Which depot actually stocks each delivery's SKU, and how much can each van carry?",
        "Deliveries near each other probably belong on the same van. What does near mean on a road network?",
      ],
    },
    {
      name: "route",
      when: "Per truck after assignment, and again after any replan that changed its deliveries.",
      receives: "The truck, its deliveries, and the world, including live travel times per edge.",
      returns: "Stops in serving order plus a connected node path starting at the truck's current position. A depot stop with no delivery is a reload waypoint.",
      stub: "Visits stops in assignment order and finds each leg by breadth-first search: fewest edges, not fewest minutes, straight through the slow centre.",
      prompts: [
        "You compared five algorithms in Task 1. The stub uses the first one. Which one did you decide was the right trade-off, and what does it need from the world to work?",
        "Windows are not optional. What order serves the most windows, not the shortest loop?",
        "world.travelTimeMin(edgeId) is the truth about an edge right now. The speed limit is not.",
      ],
    },
    {
      name: "replan",
      when: "Whenever an event arrives during the day.",
      receives: "The event, the current plan and the live world.",
      returns: "null to keep going, or a plan with new assignments or routes for just the trucks you change.",
      stub: "Returns null for everything: vans queue at closed bridges, late orders are never picked up, a broken van keeps its parcels.",
      prompts: [
        "Which trucks does this event actually affect? Most events affect none.",
        "For an affected truck, is its remaining path really through the slowed or closed edges, or does it merely pass nearby?",
        "Is re-routing enough, or should deliveries move to a different truck? Parcels already on board cannot change trucks.",
      ],
    },
  ],
} as const;

export const rulesBox = {
  title: "Rules",
  rules: [
    "Do not edit outside src/planner/. Grading runs your planner against the original simulator and data, so changes elsewhere are discarded.",
    "You may add files inside src/planner/.",
    "You may add these dependencies and no others: lodash, heap-js, tinyqueue.",
    "Keep npm test green. Grading rejects a red suite.",
  ],
} as const;

export const aiBox = {
  title: "Using AI",
  text: "Use it. Ask it to explain the simulator, to suggest approaches, to review your code. Do not paste the brief in and submit what comes back. In your video you will explain every decision, and you cannot explain a decision you did not make.",
} as const;

/* Section 5 */
export const submission = {
  intro:
    "Two links. Your repository, because your GitHub is your portfolio and this should be on it. And a two-minute video of you talking about the project, because that is how you will talk about it in an interview.",
  repoTitle: "Your repository",
  repoSteps: [
    "Make sure npm test and npm run check pass.",
    "Write a README section titled My approach: five to ten sentences on what you did for assign, route and replan, and what you would do next.",
    "Push to a public repository on your own GitHub account.",
    "Copy the URL.",
  ],
  repoNote:
    "This is the fork you made in section 3. Check it is public, push your latest work, and submit its URL.",
  videoTitle: "Your video",
  videoRequirements: [
    "Two minutes, plus or minus 20 seconds.",
    "You on camera for at least part of it; the rest can be your screen.",
    "No slides needed.",
    "Not edited to remove pauses. We are not grading polish.",
  ],
  videoPromptsTitle: "What to cover",
  videoPrompts: [
    "What the problem was, in one sentence.",
    "What approach you chose for routing and why, referring to Task 1.",
    "What you did when a road closed or an order came late.",
    "What you would improve with another week.",
  ],
  videoHosting: "Upload it to Google Drive, set sharing to anyone with the link, and submit that link.",
  assessment: {
    title: "How this is assessed",
    project:
      "Project: scored on meeting the brief's requirements and on design decisions, using the scenario scores as evidence, not as the whole grade.",
    video:
      "Video: scored on how clearly you explain the technical detail, how succinct you are, and how you represent yourself.",
    criteria: "Criteria are set by the partner's operations managers.",
    line: "No one is rejected from taking part. Not everyone passes.",
  },
  form: {
    repoLabel: "Repository URL",
    repoPlaceholder: "https://github.com/you/your-repo",
    videoLabel: "Video URL",
    videoPlaceholder: "https://drive.google.com/…",
    ownWork: "This is my own work and I can explain every part of it",
    submit: "Submit",
    deadlinePrefix: "Deadline",
    countdownTemplate: "{hours} hours left",
    closedTemplate: "Submissions closed on {date}",
    errors: {
      repoPattern: "Enter a GitHub repository URL in the form https://github.com/owner/repo.",
      repoIsStarter: "That is the OMO starter itself. Submit your own repository.",
      repoUnreachable: "GitHub cannot see that repository. Check the URL and make sure the repository is public.",
      videoPattern: "Enter a Google Drive link that starts with https://drive.google.com/.",
      ownWork: "Confirm the work is your own before submitting.",
      saveFailed: "Your submission was not saved. Check your connection and try again.",
    },
    successTitle: "Submitted",
    successBody: "We will grade this against all five scenarios plus two hidden ones. You will hear back within {n} days.",
    resubmitNote: "Submitting again before the deadline replaces this submission. Once OMO starts marking it, the links are final.",
    feedbackTitle: "Feedback from OMO",
    scoreTemplate: "Score: {score}",
  },
} as const;
