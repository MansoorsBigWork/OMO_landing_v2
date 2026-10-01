/* All copy for the intro page. Nothing on the page is hard-coded in JSX.
   The delivery company, retailer and customer are fictional. Figures are
   real and sourced (Brief 2, Part 5.1). */

export interface IntroQuestion {
  id: string;
  prompt: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  correctId: string;
  explanation: string;
}

export interface IntroSection {
  id: string;
  keyframe: "K0" | "K1" | "K2" | "K3" | "K4" | "K5" | "K6" | "K7" | "K8";
  heading: string;
  /* Paragraphs may contain {{term:slug}} or {{term:slug:display}} markers. */
  body: ReadonlyArray<string>;
  question?: IntroQuestion;
  flashcards: ReadonlyArray<string>;
}

export interface Flashcard {
  front: string;
  inline: string;
  back: string;
}

export const glossary: Record<string, Flashcard> = {
  "fulfilment-centre": {
    front: "Fulfilment centre",
    inline: "fulfilment centre",
    back: "The retailer’s warehouse where stock is stored and orders are picked, packed and labelled. Not part of the carrier’s network.",
  },
  depot: {
    front: "Depot",
    inline: "depot",
    back: "A carrier’s local building. Parcels enter the network here (induction) and leave it here (out for delivery).",
  },
  hub: {
    front: "Hub",
    inline: "hub",
    back: "A large automated sorting centre, usually in the Midlands, that receives trunks from every depot and sorts parcels by destination depot overnight.",
  },
  linehaul: {
    front: "Linehaul",
    inline: "linehaul",
    back: "The scheduled truck movements between depots and hubs. Also called trunking. The cheapest leg per parcel.",
  },
  "last-mile": {
    front: "Last mile",
    inline: "last mile",
    back: "The final leg from the local depot to the recipient’s address. Not literally a mile. The most expensive leg per parcel.",
  },
  "cut-off": {
    front: "Cut-off",
    inline: "cut-off",
    back: "The latest time an order can be placed and still be promised for a given delivery day. Set by the retailer around the carrier’s collection time.",
  },
  "service-level": {
    front: "Service level",
    inline: "service level",
    back: "The delivery promise attached to a parcel: next-day, 48-hour, timed, and so on. It determines how the parcel is prioritised at every sort.",
  },
  wms: {
    front: "WMS",
    inline: "WMS",
    back: "Warehouse management system. The software that holds stock locations and turns an order into a pick instruction.",
  },
  "pick-path": {
    front: "Pick path",
    inline: "pick path",
    back: "The route through the warehouse a picker follows to collect a batch of orders with the least walking.",
  },
  "first-mile": {
    front: "First mile",
    inline: "first mile",
    back: "Collection from the retailer and transport to the carrier’s local depot.",
  },
  induction: {
    front: "Induction",
    inline: "induction",
    back: "The first scan into the carrier’s network, usually combined with automatic weighing and measuring.",
  },
  exceptions: {
    front: "Exceptions",
    inline: "exceptions",
    back: "Parcels that fail a check: unreadable label, wrong weight, damaged, prohibited. They are pulled off the line for a human.",
  },
  wave: {
    front: "Sort wave",
    inline: "wave",
    back: "A timed window in which the hub sorts parcels for a group of destinations. Miss the wave, miss the day.",
  },
  trunk: {
    front: "Trunk",
    inline: "trunk",
    back: "A single linehaul vehicle movement, for example “the 23:40 trunk to Rugby”.",
  },
  "tilt-tray": {
    front: "Tilt-tray sorter",
    inline: "tilt-tray",
    back: "A loop of small trays that carry one parcel each and tilt to drop it into the correct chute. Sorts thousands of parcels an hour.",
  },
  "sort-wave": {
    front: "Sort wave",
    inline: "sort wave",
    back: "A timed window in which the hub sorts parcels for a group of destinations. Miss the wave, miss the day.",
  },
  chute: {
    front: "Chute",
    inline: "chute",
    back: "The outlet on a sorter for one destination. Parcels slide down into a cage or bag.",
  },
  route: {
    front: "Route",
    inline: "route",
    back: "One driver’s set of stops for the day, in a fixed geographic area.",
  },
  sequencing: {
    front: "Sequencing",
    inline: "sequencing",
    back: "Ordering a route’s stops so the van is loaded last-stop-first and the driver never digs for a parcel.",
  },
  "stem-time": {
    front: "Stem time",
    inline: "stem time",
    back: "Time spent driving from the depot to the first stop and from the last stop back. Pure cost; no deliveries happen during it.",
  },
  "first-attempt-rate": {
    front: "First-attempt rate",
    inline: "first-attempt rate",
    back: "The share of deliveries completed on the first visit. The single most important last-mile number.",
  },
  "proof-of-delivery": {
    front: "Proof of delivery",
    inline: "proof of delivery",
    back: "The scan, signature or photo that closes the parcel’s journey and stops the clock on the service level.",
  },
};

export const sections: ReadonlyArray<IntroSection> = [
  {
    id: "a-country-that-moves-parcels",
    keyframe: "K0",
    heading: "Every day, the UK moves about 11 million parcels you never see",
    body: [
      "Last year people in the UK sent and received around 4.2 billion parcels. That is roughly 11.5 million a day, every day, including Sundays. Almost all of them are invisible to the people who ordered them until the moment they land on the mat.",
      "Behind that moment is a physical network: {{term:fulfilment-centre}}s where goods are stored, {{term:depot}}s where parcels enter and leave the system, {{term:hub}}s where they are sorted at scale, {{term:linehaul}} trucks that move them between cities overnight, and the {{term:last-mile}} vans that finish the job.",
      "Over the next few minutes you will follow one parcel through that network. Then you will get to work fixing the part of it that costs the most.",
    ],
    question: {
      id: "q1",
      prompt: "How many parcels does the UK handle in a typical day?",
      options: [
        { id: "a", label: "About 1 million" },
        { id: "b", label: "About 4 million" },
        { id: "c", label: "About 11 million" },
        { id: "d", label: "About 40 million" },
      ],
      correctId: "c",
      explanation:
        "Around 4.2 billion a year, which is about 11.5 million a day. Volumes are still growing, and imports from overseas marketplaces are growing fastest.",
    },
    flashcards: ["fulfilment-centre", "depot", "hub", "linehaul", "last-mile"],
  },
  {
    id: "the-order",
    keyframe: "K1",
    heading: "21:14, Tuesday. Amira presses “Place order”",
    body: [
      "Amira is in Sheffield. She orders a pair of trainers from Northline Outfitters, an online retailer with one warehouse in Milton Keynes, 130 miles south. The site promises next-day delivery because she ordered before the 22:00 {{term:cut-off}}.",
      "Nothing has physically moved yet. What has moved is data: her address, the item, the service level she chose, and a delivery promise that the retailer has now made on Kestrel Parcels’ behalf. Kestrel has not seen the parcel and already owes her a delivery window.",
      "Before anything else happens, the retailer’s system runs an address check. Around one in five addresses typed at checkout contain an error. A bad postcode here becomes a failed delivery three days later.",
    ],
    question: {
      id: "q2",
      prompt: "Which of these has happened by the time Amira sees the order confirmation?",
      options: [
        { id: "a", label: "Her trainers have been picked from the shelf" },
        { id: "b", label: "A delivery promise has been made and her address has been validated" },
        { id: "c", label: "A van has been assigned to her street" },
        { id: "d", label: "The parcel has been scanned into Kestrel’s network" },
      ],
      correctId: "b",
      explanation:
        "Only data has moved. The pick, the scan and the van all come later. But the promise, and the risk of a bad address, are already locked in.",
    },
    flashcards: ["cut-off", "service-level"],
  },
  {
    id: "pick-pack-label",
    keyframe: "K3",
    heading: "Milton Keynes, 21:15. The order lands in the warehouse",
    body: [
      "The order reaches Northline’s {{term:wms}}. It is batched with hundreds of others heading to the same region and released to a picker as a route through the shelving: aisle, bay, shelf, bin.",
      "The trainers are picked, scanned, boxed and weighed. A label prints with a barcode that carries the destination postcode, the service level and a unique tracking number. That barcode is the parcel’s identity for the rest of its journey. Every machine and every driver will read it.",
      "By 18:00 the next day, thousands of labelled parcels sit on pallets and in cages at the loading bay, sorted roughly by carrier and service. Kestrel’s collection van is due.",
    ],
    question: {
      id: "q3",
      prompt: "What does the barcode on the label actually do?",
      options: [
        { id: "a", label: "It tells the customer when the parcel will arrive" },
        {
          id: "b",
          label:
            "It carries the destination and service so every scan point can route the parcel without human decisions",
        },
        { id: "c", label: "It proves the retailer has been paid" },
        { id: "d", label: "It records the weight of the parcel" },
      ],
      correctId: "b",
      explanation:
        "The barcode is the parcel’s instruction set. Sorters, scanners and drivers read it; nobody reads the address label by eye at a hub.",
    },
    flashcards: ["wms", "pick-path"],
  },
  {
    id: "into-the-network",
    keyframe: "K4",
    heading: "Collection and induction",
    body: [
      "At 18:10 a Kestrel collection van leaves Northline with 640 parcels and drives to Kestrel’s Milton Keynes depot. This is the {{term:first-mile}}.",
      "At the depot, every parcel is {{term:induction:inducted}}: scanned, then passed through a dimensioning and weighing unit. If the retailer declared 1.2kg and the scale reads 2.6kg, Kestrel re-rates the parcel and bills the difference. Parcels with unreadable labels are pulled to an exceptions bench.",
      "Now the parcel is sorted by destination postcode area and service. Next-day parcels for the north are cages destined for the national hub tonight. Anything for the local area stays.",
    ],
    question: {
      id: "q4",
      prompt: "Why does the depot weigh and measure a parcel that the retailer has already weighed?",
      options: [
        { id: "a", label: "To check the retailer has not lied, and to charge correctly by size" },
        { id: "b", label: "To decide which van it goes on" },
        { id: "c", label: "Because the law requires it" },
        { id: "d", label: "To print a second label" },
      ],
      correctId: "a",
      explanation:
        "Carriers price by weight and volume. Induction is where the network checks the declared parcel against the real one.",
    },
    flashcards: ["first-mile", "induction", "exceptions"],
  },
  {
    id: "the-trunk",
    keyframe: "K5",
    heading: "23:40. Up the M1 in the dark",
    body: [
      "An articulated truck leaves the Milton Keynes depot with around 4,000 parcels, most of them for the north of England and Scotland. It is one of dozens of {{term:linehaul}} movements Kestrel runs every night. Linehaul is the cheapest part of the journey per parcel because the cost of one truck and one driver is spread across thousands of items.",
      "It is heading for Kestrel’s national hub near Rugby, about 55 miles away. Almost every national carrier has its hub in the Midlands for the same reason: it is within four hours’ drive of roughly 90 per cent of the UK population.",
      "Timing is everything. The hub runs on a wave schedule. A truck that arrives 40 minutes late can miss the sort wave for its region, which means every parcel on it misses next-day.",
    ],
    question: {
      id: "q5",
      prompt: "Why is the middle of the journey the cheapest part per parcel?",
      options: [
        { id: "a", label: "Fuel is cheaper at night" },
        { id: "b", label: "One vehicle and one driver serve thousands of parcels at once" },
        { id: "c", label: "Motorways are free to use" },
        { id: "d", label: "Parcels are lighter after sorting" },
      ],
      correctId: "b",
      explanation:
        "Linehaul consolidates. The last mile does the opposite: one driver, one van, and every stop is a different address.",
    },
    flashcards: ["wave", "trunk"],
  },
  {
    id: "the-hub",
    keyframe: "K6",
    heading: "01:10. Twelve thousand parcels an hour",
    body: [
      "Inside the hub, parcels are tipped onto conveyors and cameras read every barcode from six sides. Each parcel is placed on a {{term:tilt-tray}} sorter, a loop of small trays that runs at walking pace, and is flicked into the chute for its destination depot. Amira’s trainers drop into the chute labelled S, for Sheffield.",
      "A hub like this handles hundreds of thousands of parcels a night with a few hundred staff. Almost nobody touches a parcel between the tipping point and the outbound cage.",
      "By 03:30 the Sheffield cage is sealed and on a second truck heading north.",
    ],
    question: {
      id: "q6",
      prompt: "At the hub, who decides which chute Amira’s parcel goes into?",
      options: [
        { id: "a", label: "A supervisor reading the address" },
        { id: "b", label: "The driver of the incoming truck" },
        { id: "c", label: "A camera reading the barcode and a routing table" },
        { id: "d", label: "The retailer, when they printed the label" },
      ],
      correctId: "c",
      explanation:
        "The label encodes the destination; the hub’s routing table maps postcode areas to chutes. No human decision is involved for a clean parcel.",
    },
    flashcards: ["tilt-tray", "sort-wave", "chute"],
  },
  {
    id: "the-last-mile",
    keyframe: "K7",
    heading: "06:45. Sheffield depot. The expensive part begins",
    body: [
      "The trunk arrives at Kestrel’s Sheffield depot. Parcels are scanned in, sorted to delivery {{term:route}}s, and {{term:sequencing:sequenced}} so that each driver’s van is loaded in reverse order: last stop at the back, first stop by the door. A driver typically carries 120 to 180 stops.",
      "This is the {{term:last-mile}}, and it is where the money goes. Depending on the network it accounts for somewhere between 40 and 55 per cent of the total cost of moving a parcel, because the efficiency of the truck is gone: one driver, one van, one address at a time, traffic, parking, stairs, and people who are not home.",
      "At 14:52 the van reaches Amira’s street. She is out. The driver leaves the parcel with a neighbour, photographs the doorstep and the handover, and the app sends Amira a message. First-attempt success. If it had failed, the parcel would have cost Kestrel roughly £13 more, and Amira’s opinion of Northline would have dropped, not Kestrel’s.",
    ],
    question: {
      id: "q7",
      prompt: "Roughly what share of the total cost of a parcel is the last mile?",
      options: [
        { id: "a", label: "5 to 10 per cent" },
        { id: "b", label: "15 to 25 per cent" },
        { id: "c", label: "40 to 55 per cent" },
        { id: "d", label: "80 to 90 per cent" },
      ],
      correctId: "c",
      explanation:
        "Estimates range from about 41 to 53 per cent. Every fix worth making in this OMOship lives here.",
    },
    flashcards: ["route", "sequencing", "stem-time", "first-attempt-rate", "proof-of-delivery"],
  },
  {
    id: "what-you-will-fix",
    keyframe: "K8",
    heading: "Now you know the network. Here is the problem",
    body: [
      "Kestrel’s Sheffield depot is missing its next-day service level. It should deliver 97 per cent of next-day parcels on time. Last month it delivered 91.4 per cent. The depot manager thinks it is a driver problem. The regional director thinks it is a routing problem. Nobody has looked at the data properly.",
      "You will get a week of the depot’s operational data and a brief from the operations team. You will find where the time is going, then build and recommend a fix.",
      "Everything you just scrolled through is the map. From here on, you are working on one square of it.",
    ],
    flashcards: [],
  },
];

/* The K8 stat cards, also rendered in the reading column so the closing
   figures are readable without the stage. */
export const closingStats: ReadonlyArray<{ value: string; label: string }> = [
  { value: "4.2bn", label: "parcels a year" },
  { value: "~4.7m", label: "vans licensed in Great Britain" },
  { value: "78%", label: "of recipients satisfied with parcel firms" },
  { value: "40 to 55%", label: "of cost in the last mile" },
];

export const introCopy = {
  pageTitle: "How the UK delivery network works",
  railLabel: "Intro sections",
  stageLabel:
    "Animated map of the UK following one parcel from an order in Sheffield, south to a Milton Keynes warehouse, through depots, an overnight trunk and the national hub, and back to a Sheffield doorstep.",
  questionLegendPrefix: "Question",
  flashcardsLabel: "Terms from this section",
  flashcardHint: "Select a card to flip it",
  startButton: "Start the next task",
  startDisabled: "Answer the remaining questions to continue",
  remainingTemplate: "{count} remaining",
  correctLabel: "Correct.",
  incorrectLabel: "Not quite.",
} as const;
