import {
  Heap,
  cellCost,
  manhattan,
  neighbours,
  pathCost,
  reconstruct,
  type CellId,
  type CityGrid,
  type Run,
} from "./types.ts";

/* All five algorithms share one best-first skeleton; the priority
   function is the whole difference between them, which is the point the
   task teaches. Each yield is tagged with the pseudocode line it acts
   out: the initial frontier, the take-from-frontier, and the
   add-to-frontier lines from Part 6.5. The minimum street cost keeps
   the A* heuristic admissible. */

const MIN_COST = 0.6;

type Priority = (g: number, h: number) => number;

interface LineMap {
  init: number;
  pop: number;
  push: number;
}

function* bestFirst(grid: CityGrid, start: CellId, goal: CellId, priority: Priority, lines: LineMap): Run {
  const open = new Heap();
  const gScore = new Map<CellId, number>([[start, 0]]);
  const cameFrom = new Map<CellId, CellId>();
  const closed = new Set<CellId>();
  const inFrontier = new Set<CellId>([start]);
  open.push(priority(0, manhattan(grid, start, goal)), start);
  let steps = 1;
  yield { visited: [], frontier: [start], current: start, line: lines.init };

  while (open.size > 0) {
    const current = open.pop();
    if (closed.has(current)) continue;
    inFrontier.delete(current);
    closed.add(current);
    steps++;

    if (current === goal) {
      const path = reconstruct(cameFrom, goal);
      return { path, visitedCount: closed.size, pathCost: pathCost(grid, path), steps };
    }
    yield { visited: [current], frontier: [], current, line: lines.pop };

    const newFrontier: CellId[] = [];
    for (const next of neighbours(grid, current)) {
      if (closed.has(next)) continue;
      const g = (gScore.get(current) ?? 0) + cellCost(grid, next);
      const known = gScore.get(next);
      if (known === undefined || g < known) {
        gScore.set(next, g);
        cameFrom.set(next, current);
        open.push(priority(g, manhattan(grid, next, goal)), next);
        if (!inFrontier.has(next)) {
          inFrontier.add(next);
          newFrontier.push(next);
        }
      }
    }
    if (newFrontier.length > 0) {
      steps++;
      yield { visited: [], frontier: newFrontier, current, line: lines.push };
    }
  }
  return { path: [], visitedCount: closed.size, pathCost: 0, steps };
}

/* Breadth-first: ring by ring, every street costs the same. */
export function* bfs(grid: CityGrid, start: CellId, goal: CellId): Run {
  const open: CellId[] = [start];
  const cameFrom = new Map<CellId, CellId>();
  const seen = new Set<CellId>([start]);
  const closed = new Set<CellId>();
  let steps = 1;
  yield { visited: [], frontier: [start], current: start, line: 1 };

  while (open.length > 0) {
    const current = open.shift() as CellId;
    closed.add(current);
    steps++;
    if (current === goal) {
      const path = reconstruct(cameFrom, goal);
      return { path, visitedCount: closed.size, pathCost: pathCost(grid, path), steps };
    }
    yield { visited: [current], frontier: [], current, line: 5 };
    const newFrontier: CellId[] = [];
    for (const next of neighbours(grid, current)) {
      if (!seen.has(next)) {
        seen.add(next);
        cameFrom.set(next, current);
        open.push(next);
        newFrontier.push(next);
      }
    }
    if (newFrontier.length > 0) {
      steps++;
      yield { visited: [], frontier: newFrontier, current, line: 12 };
    }
  }
  return { path: [], visitedCount: closed.size, pathCost: 0, steps };
}

export const dijkstra = (grid: CityGrid, start: CellId, goal: CellId): Run =>
  bestFirst(grid, start, goal, (g) => g, { init: 1, pop: 5, push: 13 });

export const greedy = (grid: CityGrid, start: CellId, goal: CellId): Run =>
  bestFirst(grid, start, goal, (_g, h) => h, { init: 1, pop: 5, push: 12 });

export const astar = (grid: CityGrid, start: CellId, goal: CellId): Run =>
  bestFirst(grid, start, goal, (g, h) => g + MIN_COST * h, { init: 1, pop: 5, push: 13 });

export const weightedAstar = (grid: CityGrid, start: CellId, goal: CellId): Run =>
  bestFirst(grid, start, goal, (g, h) => g + 1.8 * MIN_COST * h, { init: 2, pop: 6, push: 14 });

export const ALGORITHMS = { bfs, dijkstra, greedy, astar, weightedAstar } as const;
export type AlgorithmId = keyof typeof ALGORITHMS;

/* Runs an algorithm to completion off-screen so the Explain status bar
   can show the true step total before playback begins. Milliseconds of
   work, done once per slide. */
export function measureRun(grid: CityGrid, algorithm: AlgorithmId): { totalSteps: number } {
  const start = grid.start.y * grid.w + grid.start.x;
  const goal = grid.goal.y * grid.w + grid.goal.x;
  const gen = ALGORITHMS[algorithm](grid, start, goal);
  let r = gen.next();
  while (!r.done) r = gen.next();
  return { totalSteps: r.value.steps };
}
