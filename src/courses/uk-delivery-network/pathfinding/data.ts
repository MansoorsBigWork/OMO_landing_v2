/* All copy for the amber transition and the pathfinding task (Brief 4
   v2). Nothing on either page is hard-coded in JSX beyond these labels.
   The pseudocode vocabulary stays constant across the five algorithms so
   the student sees what changes and what stays the same. */

export type StatementKind = "strength" | "weakness" | "na";

export interface Statement {
  id: string;
  text: string;
  kind: StatementKind;
  explanation?: string;
}

export interface WalkthroughEntry {
  from: number;
  to: number;
  explain: string;
  onMap?: string;
}

export interface AlgorithmSlide {
  id: string;
  algorithm: "bfs" | "dijkstra" | "greedy" | "astar" | "weightedAstar";
  name: string;
  description: string;
  code: ReadonlyArray<string>;
  walkthrough: ReadonlyArray<WalkthroughEntry>;
  statements: ReadonlyArray<Statement>;
}

export const transitionCopy = {
  headline: "Time To Get Technical",
  subline: "Task 1: how a van finds its way",
  continueLabel: "Continue",
  announcement: "Time to get technical. Task 1.",
} as const;

export const taskCopy = {
  header: "Task 1 · Pathfinding",
  backLink: "Back to intro",
  progressTemplate: "{n} of {total}",
  play: "Play",
  pause: "Pause",
  step: "Step",
  reset: "Reset",
  speedLabel: "Speed",
  speeds: ["0.5x", "1x", "2x", "4x"],
  readouts: {
    visited: "Nodes visited",
    pathLength: "Path length",
    time: "Time",
    stepsSuffix: "steps",
  },
  mapCaption: "Blue: explored. Darker blue: about to explore. Amber: the route it chose.",
  mapLabel: "A fictional city map on which the algorithm searches for a route from the depot to the delivery.",
  depotLabel: "DEPOT",
  deliveryLabel: "DELIVERY",
  editor: {
    tabSuffix: ".pseudo",
    phaseExplain: "Explain",
    phaseSort: "Sort",
    lockTip: "Finish the walkthrough first",
    statusStep: "Step {n} of {total}",
    statusLine: "Ln {n}",
    statusDone: "Walkthrough done",
    back: "Back",
    next: "Next",
    playThrough: "Play through",
    startSorting: "Start sorting",
    lineLabel: "Line {n}",
    rangeLabel: "Lines {a} to {b}",
    onMapPrefix: "On the map:",
  },
  sort: {
    heading: "Sort the statements",
    instruction: "For each one, decide: is it a strength, a weakness, or simply not true of this algorithm?",
    statementLabel: "Statement {n}",
    progressSr: "{n} of {total}",
    strength: "Strength",
    weakness: "Weakness",
    na: "Doesn't apply",
    undo: "Undo",
    reviewStrengths: "Strengths",
    reviewWeaknesses: "Weaknesses",
    reviewNa: "Doesn't apply",
    nothingHere: "Nothing here",
    move: "Move to",
    check: "Check answers",
    checksLeftTemplate: "{n} checks left",
    oneCheckLeft: "1 check left",
    revealed: "Answers revealed",
    next: "Next algorithm",
    finish: "Finish task",
  },
  toastTemplate: "Task 1 done. Your first-check score: {score} of 40.",
} as const;

export const slides: ReadonlyArray<AlgorithmSlide> = [
  {
    id: "bfs",
    algorithm: "bfs",
    name: "Breadth-first search",
    description:
      "Explores outward from the depot one ring at a time, in every direction, until it reaches the delivery. Treats every street as costing the same.",
    code: [
      "create frontier as a queue, containing only depot",
      "create visited, containing only depot",
      "create came_from, empty",
      "while frontier is not empty:",
      "    current = take the FRONT of frontier",
      "    if current is delivery:",
      "        return rebuild_route(came_from, delivery)",
      "    for each next in neighbours(current):",
      "        if next is not in visited:",
      "            add next to visited",
      "            came_from[next] = current",
      "            add next to the BACK of frontier",
      "return no route",
    ],
    walkthrough: [
      { from: 1, to: 1, explain: "A queue is a line at a shop: first in, first out. We put the depot in the line so it is the first place we look at.", onMap: "the depot lights up as the only frontier cell." },
      { from: 2, to: 2, explain: "We keep a list of every street we have already seen so we never look at the same one twice." },
      { from: 3, to: 3, explain: "This will remember, for every street, which street we came from. Later it lets us trace the route backwards." },
      { from: 4, to: 4, explain: "Keep going as long as there is something in the line. If the line empties without finding the delivery, there is no route." },
      { from: 5, to: 5, explain: "Take whoever is at the front of the line. Because it is a queue, this is always the street we found earliest, which is why the search spreads out evenly like a ripple.", onMap: "the darker cell is the one being looked at now." },
      { from: 6, to: 6, explain: "Are we standing at the delivery address?" },
      { from: 7, to: 7, explain: "If so, follow the came_from breadcrumbs back to the depot and hand over the route.", onMap: "the amber line draws the finished route." },
      { from: 8, to: 8, explain: "Look at every street you can drive to directly from where you are." },
      { from: 9, to: 9, explain: "Skip the ones we have seen before." },
      { from: 10, to: 10, explain: "Mark the new street as seen." },
      { from: 11, to: 11, explain: "Note that we reached this new street from the current one." },
      { from: 12, to: 12, explain: "Put the new street at the back of the line. It will get its turn after everything found before it.", onMap: "the ring of lighter blue grows by one cell." },
      { from: 13, to: 13, explain: "If the line runs dry, no route exists. That cannot happen on our map, but real code has to handle it." },
    ],
    statements: [
      { id: "bfs-p1", text: "Guaranteed to find a route if one exists", kind: "strength" },
      { id: "bfs-p2", text: "Simple to implement and reason about", kind: "strength" },
      { id: "bfs-p3", text: "Finds the route with the fewest cells", kind: "strength" },
      { id: "bfs-c1", text: "Ignores that some streets are faster than others", kind: "weakness" },
      { id: "bfs-c2", text: "Explores almost the whole map before finishing", kind: "weakness" },
      { id: "bfs-c3", text: "Memory use grows with the size of the frontier", kind: "weakness" },
      { id: "bfs-d1", text: "Uses an estimate of the distance to the goal", kind: "na", explanation: "Breadth-first has no idea where the goal is until it bumps into it. There is no estimate anywhere in the code." },
      { id: "bfs-d2", text: "Can get stuck in a loop on a grid", kind: "na", explanation: "The visited list stops it ever looking at a cell twice." },
    ],
  },
  {
    id: "dijkstra",
    algorithm: "dijkstra",
    name: "Dijkstra's algorithm",
    description:
      "Also explores outward, but always expands the cheapest route found so far. Takes street cost into account, so it prefers the ring road and avoids congestion.",
    code: [
      "create frontier as a priority queue, containing depot with priority 0",
      "create cost_so_far, with cost_so_far[depot] = 0",
      "create came_from, empty",
      "while frontier is not empty:",
      "    current = take the CHEAPEST item from frontier",
      "    if current is delivery:",
      "        return rebuild_route(came_from, delivery)",
      "    for each next in neighbours(current):",
      "        new_cost = cost_so_far[current] + cost(current, next)",
      "        if next has no cost_so_far yet, or new_cost < cost_so_far[next]:",
      "            cost_so_far[next] = new_cost",
      "            came_from[next] = current",
      "            add next to frontier with priority new_cost",
      "return no route",
    ],
    walkthrough: [
      { from: 1, to: 1, explain: "A priority queue is a line where the cheapest ticket always goes first, whatever order people arrived in. The depot goes in with a cost of zero.", onMap: "the depot is the frontier." },
      { from: 2, to: 2, explain: "For each street we keep the cheapest cost we have found to reach it. The depot costs nothing." },
      { from: 3, to: 3, explain: "Same breadcrumbs as before." },
      { from: 4, to: 4, explain: "Same loop as before." },
      { from: 5, to: 5, explain: "This is the big change from breadth-first: we always look next at the street that was cheapest to reach, not the one we found earliest.", onMap: "notice the search creeping along the ring road first, because those cells are cheap." },
      { from: 6, to: 6, explain: "Are we at the delivery?" },
      { from: 7, to: 7, explain: "Rebuild and return the route. Because we always expanded the cheapest option, this route is the cheapest possible.", onMap: "the amber route hugs the ring road and avoids the hatched congestion zone." },
      { from: 8, to: 8, explain: "Look at each neighbouring street." },
      { from: 9, to: 9, explain: "Work out what it would cost to reach that neighbour by coming through the current street." },
      { from: 10, to: 10, explain: "Only bother if we have never priced this neighbour, or if this way is cheaper than the best we had." },
      { from: 11, to: 11, explain: "Record the new best price." },
      { from: 12, to: 12, explain: "Record where we came from." },
      { from: 13, to: 13, explain: "Put it in the queue with its price as the ticket. Cheaper streets get served sooner." },
      { from: 14, to: 14, explain: "No route." },
    ],
    statements: [
      { id: "dij-p1", text: "Always finds the cheapest route when costs are known", kind: "strength" },
      { id: "dij-p2", text: "Takes street cost into account, so avoids congestion", kind: "strength" },
      { id: "dij-p3", text: "Works on any road network, not just grids", kind: "strength" },
      { id: "dij-c1", text: "Explores in every direction, including away from the goal", kind: "weakness" },
      { id: "dij-c2", text: "Slower than A* on large maps", kind: "weakness" },
      { id: "dij-c3", text: "Needs accurate cost data to be useful", kind: "weakness" },
      { id: "dij-d1", text: "Ignores street cost entirely", kind: "na", explanation: "Cost is the whole point. Look at line 9." },
      { id: "dij-d2", text: "Only works if every street costs the same", kind: "na", explanation: "That describes breadth-first, not Dijkstra." },
    ],
  },
  {
    id: "greedy",
    algorithm: "greedy",
    name: "Greedy best-first search",
    description:
      "Always heads toward the delivery as the crow flies, ignoring how much the streets cost. Fast, but easily fooled by obstacles like the river.",
    code: [
      "create frontier as a priority queue, containing depot with priority distance(depot, delivery)",
      "create visited, containing only depot",
      "create came_from, empty",
      "while frontier is not empty:",
      "    current = take the item CLOSEST to delivery from frontier",
      "    if current is delivery:",
      "        return rebuild_route(came_from, delivery)",
      "    for each next in neighbours(current):",
      "        if next is not in visited:",
      "            add next to visited",
      "            came_from[next] = current",
      "            add next to frontier with priority distance(next, delivery)",
      "return no route",
    ],
    walkthrough: [
      { from: 1, to: 1, explain: "Same priority queue, but the ticket is different: how far a street is from the delivery in a straight line, as the crow flies. Nearer goes first." },
      { from: 2, to: 2, explain: "A seen list, like breadth-first. This algorithm does not track cost at all." },
      { from: 3, to: 3, explain: "Breadcrumbs." },
      { from: 4, to: 4, explain: "The usual loop." },
      { from: 5, to: 5, explain: "Always chase the street that looks closest to the goal. This is what makes it greedy: it never looks back or considers whether the street was expensive to reach.", onMap: "the search makes a beeline for the delivery." },
      { from: 6, to: 6, explain: "At the delivery?" },
      { from: 7, to: 7, explain: "Rebuild and return. Warning: this route is whatever the beeline happened to find. It is not guaranteed to be short or cheap.", onMap: "watch it hit the river, run along the bank looking for a bridge, and produce a route that doubles back." },
      { from: 8, to: 8, explain: "Each neighbour." },
      { from: 9, to: 9, explain: "Skip seen ones." },
      { from: 10, to: 10, explain: "Mark as seen." },
      { from: 11, to: 11, explain: "Breadcrumb." },
      { from: 12, to: 12, explain: "The ticket is the straight-line distance to the delivery. Street cost is ignored completely.", onMap: "the lighter blue cells are all on the delivery side of the current cell." },
      { from: 13, to: 13, explain: "No route." },
    ],
    statements: [
      { id: "gre-p1", text: "Very fast on open maps with few obstacles", kind: "strength" },
      { id: "gre-p2", text: "Explores few cells, so uses little memory", kind: "strength" },
      { id: "gre-p3", text: "Easy to explain: it always heads toward the goal", kind: "strength" },
      { id: "gre-c1", text: "Can produce routes far more expensive than the best", kind: "weakness" },
      { id: "gre-c2", text: "Easily trapped by obstacles like rivers and dead ends", kind: "weakness" },
      { id: "gre-c3", text: "Ignores how much streets actually cost", kind: "weakness" },
      { id: "gre-d1", text: "Guaranteed to find the cheapest route", kind: "na", explanation: "It never looks at cost, so it has no way to know what is cheapest." },
      { id: "gre-d2", text: "Explores the whole map before deciding", kind: "na", explanation: "It explores very little; that is its main appeal." },
    ],
  },
  {
    id: "astar",
    algorithm: "astar",
    name: "A* search",
    description:
      "Combines the two: the cost so far plus an estimate of the distance left. Finds the same cheap route as Dijkstra while exploring far less of the map.",
    code: [
      "create frontier as a priority queue, containing depot with priority 0",
      "create cost_so_far, with cost_so_far[depot] = 0",
      "create came_from, empty",
      "while frontier is not empty:",
      "    current = take the item with the LOWEST priority from frontier",
      "    if current is delivery:",
      "        return rebuild_route(came_from, delivery)",
      "    for each next in neighbours(current):",
      "        new_cost = cost_so_far[current] + cost(current, next)",
      "        if next has no cost_so_far yet, or new_cost < cost_so_far[next]:",
      "            cost_so_far[next] = new_cost",
      "            came_from[next] = current",
      "            priority = new_cost + distance(next, delivery)",
      "            add next to frontier with priority",
      "return no route",
    ],
    walkthrough: [
      { from: 1, to: 1, explain: "The same set-up as Dijkstra." },
      { from: 2, to: 2, explain: "Same cost tracking as Dijkstra. Compare this slide with slide 2: only two lines are different." },
      { from: 3, to: 3, explain: "Breadcrumbs." },
      { from: 4, to: 4, explain: "The loop." },
      { from: 5, to: 5, explain: "Take the item with the lowest ticket. The ticket now has two parts, which you will see on line 13." },
      { from: 6, to: 6, explain: "At the delivery?" },
      { from: 7, to: 7, explain: "Rebuild and return. As long as the straight-line guess never overestimates the real cost, this route is the cheapest one, the same as Dijkstra found.", onMap: "the amber route matches slide 2." },
      { from: 8, to: 8, explain: "Each neighbour." },
      { from: 9, to: 9, explain: "Real cost to get here, exactly as Dijkstra." },
      { from: 10, to: 10, explain: "Only if new or cheaper." },
      { from: 11, to: 11, explain: "Record the price." },
      { from: 12, to: 12, explain: "Breadcrumb." },
      { from: 13, to: 13, explain: "Here is the whole idea of A*. The ticket is the real cost so far, plus a guess of what is left. Dijkstra used only the first part and had to search everywhere. Greedy used only the second part and got fooled. A* uses both.", onMap: "the search leans toward the delivery but still prefers cheap streets." },
      { from: 14, to: 14, explain: "Into the queue with that combined ticket." },
      { from: 15, to: 15, explain: "No route." },
    ],
    statements: [
      { id: "ast-p1", text: "Finds the cheapest route when the estimate never overestimates", kind: "strength" },
      { id: "ast-p2", text: "Explores far less of the map than Dijkstra", kind: "strength" },
      { id: "ast-p3", text: "The standard choice for routing on real road networks", kind: "strength" },
      { id: "ast-c1", text: "Depends on a good distance estimate", kind: "weakness" },
      { id: "ast-c2", text: "More complex to implement than breadth-first or Dijkstra", kind: "weakness" },
      { id: "ast-c3", text: "Memory can still grow large on maps with many similar routes", kind: "weakness" },
      { id: "ast-d1", text: "Ignores the cost of the route so far", kind: "na", explanation: "That is greedy best-first. A* adds real cost and the estimate together on line 13." },
      { id: "ast-d2", text: "Cannot handle streets with different costs", kind: "na", explanation: "It handles them exactly as Dijkstra does." },
    ],
  },
  {
    id: "weighted-astar",
    algorithm: "weightedAstar",
    name: "A* with a weighted heuristic",
    description:
      "The same as A*, but trusts the distance estimate more. Even faster, at the price of sometimes picking a slightly more expensive route. This is the trade-off real routing engines make on busy mornings.",
    code: [
      "set weight = 1.8",
      "create frontier as a priority queue, containing depot with priority 0",
      "create cost_so_far, with cost_so_far[depot] = 0",
      "create came_from, empty",
      "while frontier is not empty:",
      "    current = take the item with the LOWEST priority from frontier",
      "    if current is delivery:",
      "        return rebuild_route(came_from, delivery)",
      "    for each next in neighbours(current):",
      "        new_cost = cost_so_far[current] + cost(current, next)",
      "        if next has no cost_so_far yet, or new_cost < cost_so_far[next]:",
      "            cost_so_far[next] = new_cost",
      "            came_from[next] = current",
      "            priority = new_cost + weight * distance(next, delivery)",
      "            add next to frontier with priority",
      "return no route",
    ],
    walkthrough: [
      { from: 1, to: 1, explain: "One new number. It says how much to trust the straight-line guess. 1 would be ordinary A*. Bigger numbers trust the guess more." },
      { from: 2, to: 13, explain: "Identical to A*. Compare with slide 4: the only changes are line 1 and line 14." },
      { from: 14, to: 14, explain: "The guess is multiplied by the weight, so it dominates the ticket. The search rushes toward the delivery, exploring even less, but it may accept a slightly more expensive route because the guess is shouting louder than the real cost. This is the trade a routing engine makes at 7am when 4,000 vans need routes in the next ten minutes.", onMap: "fewer blue cells than slide 4, and a route that is a little longer." },
      { from: 15, to: 15, explain: "Into the queue." },
      { from: 16, to: 16, explain: "No route." },
    ],
    statements: [
      { id: "was-p1", text: "Faster than plain A*, often by a large margin", kind: "strength" },
      { id: "was-p2", text: "A good-enough route quickly can beat a perfect route slowly", kind: "strength" },
      { id: "was-p3", text: "The weight can be tuned to trade speed for quality", kind: "strength" },
      { id: "was-c1", text: "No longer guaranteed to find the cheapest route", kind: "weakness" },
      { id: "was-c2", text: "A high weight behaves like greedy search", kind: "weakness" },
      { id: "was-c3", text: "Route quality varies by map, so it needs testing", kind: "weakness" },
      { id: "was-d1", text: "Always finds the cheapest route", kind: "na", explanation: "The weight breaks that guarantee. Compare the path cost readout with slide 4." },
      { id: "was-d2", text: "Explores more of the map than plain A*", kind: "na", explanation: "It explores less; that is the reason to use it." },
    ],
  },
];
