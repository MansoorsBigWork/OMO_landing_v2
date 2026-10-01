/* The simulation engine contract (Brief 4, Part 4.2). Steps are deltas
   so the renderer only touches changed cells. Everything deterministic:
   ties break by cell index, no randomness. */

export type CellId = number;

export interface CityGrid {
  w: number;
  h: number;
  cell: number;
  start: { x: number; y: number };
  goal: { x: number; y: number };
  costs: Record<number, number>;
  cells: number[];
  /* Presentation extras written by the generator: water and park cells
     and the congestion ellipse, so the page can paint the map from the
     same model the algorithms search. */
  river: number[];
  parks: number[];
  zone: { x: number; y: number; rx: number; ry: number };
}

export interface Step {
  visited: CellId[];
  frontier: CellId[];
  current: CellId;
  /* The 1-based pseudocode line (Brief 4 v2, Part 6) that produced this
     step, so the Explain editor can highlight it in sync with the map. */
  line: number;
}

export interface Result {
  path: CellId[];
  visitedCount: number;
  pathCost: number;
  steps: number;
}

export type Run = Generator<Step, Result>;

export interface AlgorithmModule {
  run: (grid: CityGrid, start: CellId, goal: CellId) => Run;
}

export const cellId = (grid: CityGrid, x: number, y: number): CellId => y * grid.w + x;

export function cellCost(grid: CityGrid, id: CellId): number {
  const code = grid.cells[id];
  return code === 0 ? Infinity : grid.costs[code];
}

/* Neighbours in a fixed order (up, right, down, left) for determinism.
   Diagonal moves are not allowed. */
export function neighbours(grid: CityGrid, id: CellId): CellId[] {
  const x = id % grid.w;
  const y = Math.floor(id / grid.w);
  const out: CellId[] = [];
  if (y > 0 && grid.cells[id - grid.w] !== 0) out.push(id - grid.w);
  if (x < grid.w - 1 && grid.cells[id + 1] !== 0) out.push(id + 1);
  if (y < grid.h - 1 && grid.cells[id + grid.w] !== 0) out.push(id + grid.w);
  if (x > 0 && grid.cells[id - 1] !== 0) out.push(id - 1);
  return out;
}

export function manhattan(grid: CityGrid, a: CellId, b: CellId): number {
  const ax = a % grid.w;
  const ay = Math.floor(a / grid.w);
  const bx = b % grid.w;
  const by = Math.floor(b / grid.w);
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/* Binary min-heap keyed on [priority, tiebreak (cell index)]. */
export class Heap {
  private keys: number[] = [];
  private ties: number[] = [];
  private ids: CellId[] = [];

  get size(): number {
    return this.ids.length;
  }

  push(key: number, id: CellId): void {
    this.keys.push(key);
    this.ties.push(id);
    this.ids.push(id);
    let i = this.ids.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.less(i, p)) {
        this.swap(i, p);
        i = p;
      } else break;
    }
  }

  pop(): CellId {
    const top = this.ids[0];
    const last = this.ids.length - 1;
    this.swap(0, last);
    this.keys.pop();
    this.ties.pop();
    this.ids.pop();
    let i = 0;
    for (;;) {
      const l = i * 2 + 1;
      const r = l + 1;
      let m = i;
      if (l < this.ids.length && this.less(l, m)) m = l;
      if (r < this.ids.length && this.less(r, m)) m = r;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
    return top;
  }

  private less(a: number, b: number): boolean {
    if (this.keys[a] !== this.keys[b]) return this.keys[a] < this.keys[b];
    return this.ties[a] < this.ties[b];
  }

  private swap(a: number, b: number): void {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.ties[a], this.ties[b]] = [this.ties[b], this.ties[a]];
    [this.ids[a], this.ids[b]] = [this.ids[b], this.ids[a]];
  }
}

export function reconstruct(cameFrom: Map<CellId, CellId>, goal: CellId): CellId[] {
  const path = [goal];
  let cur = goal;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur) as CellId;
    path.push(cur);
  }
  return path.reverse();
}

export function pathCost(grid: CityGrid, path: CellId[]): number {
  let cost = 0;
  for (let i = 1; i < path.length; i++) cost += cellCost(grid, path[i]);
  return Math.round(cost * 10) / 10;
}
