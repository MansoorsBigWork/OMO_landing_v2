/* Generates the pathfinding city as one model: a fine grid (8px cells)
   whose street network is organic rather than orthogonal, in the manner
   of a real city plan: districts each carry their own street grid at
   their own angle and spacing, Voronoi boundaries between districts
   become through-routes, a curved ring road and radial arterials carry
   the fast traffic, and a winding river cuts off the north east with
   two bridges. The page paints the map itself from this grid, so the
   drawing and the graph cannot disagree.
   The page paints the visual layers from this JSON at runtime.
   Run from the repo root:
   node --experimental-strip-types scripts/rasterise-city.ts */

import fs from "node:fs";

const W = 150;
const H = 112;
const CELL = 8;

const BLOCKED = 0;
const STREET = 1;
const FAST = 2;
const SLOW = 3;

const at = (x: number, y: number) => y * W + x;
const inb = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H;

/* Deterministic RNG so the committed grid never changes between runs */
let seed = 20260915;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const grid: number[] = new Array(W * H).fill(BLOCKED);

/* ---- Districts: jittered seed points, each with its own street angle
   and spacing ---- */
interface District {
  x: number;
  y: number;
  angle: number;
  spacing: number;
}
const districts: District[] = [];
for (let gy = 0; gy < 3; gy++) {
  for (let gx = 0; gx < 5; gx++) {
    districts.push({
      x: ((gx + 0.5) / 5) * W + (rand() - 0.5) * 18,
      y: ((gy + 0.5) / 3) * H + (rand() - 0.5) * 14,
      angle: (rand() - 0.5) * 1.5,
      spacing: 4 + Math.floor(rand() * 3),
    });
  }
}

function nearestTwo(x: number, y: number): [number, number, number] {
  let best = Infinity;
  let second = Infinity;
  let bi = 0;
  for (let i = 0; i < districts.length; i++) {
    const d = districts[i];
    const dist = (x - d.x) ** 2 + (y - d.y) ** 2;
    if (dist < best) {
      second = best;
      best = dist;
      bi = i;
    } else if (dist < second) {
      second = dist;
    }
  }
  return [bi, Math.sqrt(best), Math.sqrt(second)];
}

/* Local street grids, rotated per district, plus Voronoi-edge streets */
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const [di, d1, d2] = nearestTwo(x + 0.5, y + 0.5);
    const d = districts[di];
    const cos = Math.cos(d.angle);
    const sin = Math.sin(d.angle);
    const u = (x + 0.5 - d.x) * cos + (y + 0.5 - d.y) * sin;
    const v = -(x + 0.5 - d.x) * sin + (y + 0.5 - d.y) * cos;
    const onU = Math.abs(u - Math.round(u / d.spacing) * d.spacing) < 0.55;
    const onV = Math.abs(v - Math.round(v / d.spacing) * d.spacing) < 0.55;
    if (onU || onV) grid[at(x, y)] = STREET;
    /* district boundary becomes a through-route */
    if (d2 - d1 < 0.8) grid[at(x, y)] = STREET;
  }
}

/* ---- Polyline rasteriser ---- */
function rasterise(pts: Array<[number, number]>, code: number, thickness: number, overrideBlocked = false) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let s = 0; s <= steps; s++) {
      const px = x0 + ((x1 - x0) * s) / steps;
      const py = y0 + ((y1 - y0) * s) / steps;
      const r = thickness / 2;
      for (let dy = Math.floor(-r); dy <= Math.ceil(r); dy++) {
        for (let dx = Math.floor(-r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy > r * r + 0.5) continue;
          const cx = Math.round(px + dx);
          const cy = Math.round(py + dy);
          if (!inb(cx, cy)) continue;
          if (!overrideBlocked && grid[at(cx, cy)] === BLOCKED && code !== BLOCKED) {
            grid[at(cx, cy)] = code;
          } else if (overrideBlocked || grid[at(cx, cy)] !== BLOCKED) {
            grid[at(cx, cy)] = code;
          }
        }
      }
    }
  }
}

function curve(from: [number, number], via: [number, number], to: [number, number], n = 24): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    pts.push([a * from[0] + b * via[0] + c * to[0], a * from[1] + b * via[1] + c * to[1]]);
  }
  return pts;
}

/* ---- Fast roads: a curved ring and radial arterials ---- */
const CX = W * 0.46;
const CY = H * 0.54;
const ring: Array<[number, number]> = [];
for (let i = 0; i <= 72; i++) {
  const a = (i / 72) * Math.PI * 2;
  const wobble = 1 + 0.06 * Math.sin(a * 3 + 1.2);
  ring.push([CX + Math.cos(a) * W * 0.27 * wobble, CY + Math.sin(a) * H * 0.3 * wobble]);
}
rasterise(ring, FAST, 1.6);

const EDGE_TARGETS: Array<[[number, number], [number, number]]> = [
  [[W * 0.06, H * 0.95], [W * 0.3, H * 0.72]],          /* south west, past the depot */
  [[W * 0.92, H * 0.04], [W * 0.72, H * 0.3]],          /* north east, toward the delivery */
  [[W * 0.04, H * 0.3], [W * 0.24, H * 0.42]],
  [[W * 0.5, H * 0.02], [W * 0.5, H * 0.3]],
  [[W * 0.96, H * 0.62], [W * 0.74, H * 0.58]],
  [[W * 0.4, H * 0.98], [W * 0.44, H * 0.8]],
];
for (const [edge, via] of EDGE_TARGETS) {
  rasterise(curve(edge, via, [CX, CY]), FAST, 1.6);
}

/* ---- The river: a winding band cutting off the north east ---- */
const riverPts: Array<[number, number]> = [];
for (let i = 0; i <= 60; i++) {
  const t = i / 60;
  const x = W * (0.5 + t * 0.5);
  const y = H * (0.02 + t * 0.34) + Math.sin(t * 5.2) * H * 0.045;
  riverPts.push([x, y]);
}
const riverCells = new Set<number>();
{
  const before = grid.slice();
  rasterise(riverPts, BLOCKED, 3.4, true);
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === BLOCKED && before[i] !== BLOCKED) riverCells.add(i);
  }
  /* the band itself, including cells that were already blocked */
  for (let i = 1; i < riverPts.length; i++) {
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const px = riverPts[i - 1][0] + ((riverPts[i][0] - riverPts[i - 1][0]) * s) / steps;
      const py = riverPts[i - 1][1] + ((riverPts[i][1] - riverPts[i - 1][1]) * s) / steps;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx * dx + dy * dy > 3.4) continue;
          const cx = Math.round(px + dx);
          const cy = Math.round(py + dy);
          if (inb(cx, cy)) riverCells.add(at(cx, cy));
        }
      }
    }
  }
}

/* Bridges: the north-east arterial crosses fast; a street bridge west */
function carveBridge(cx: number, cy: number, code: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (inb(x, y) && riverCells.has(at(x, y))) {
        grid[at(x, y)] = code;
        riverCells.delete(at(x, y));
      }
    }
  }
}
/* find where the NE arterial's curve meets the river centreline */
const neCurve = curve([W * 0.92, H * 0.04], [W * 0.72, H * 0.3], [CX, CY]);
let bridgeNE: [number, number] = [W * 0.78, H * 0.2];
outer: for (const [ax, ay] of neCurve) {
  for (const [rx, ry] of riverPts) {
    if (Math.hypot(ax - rx, ay - ry) < 1.2) {
      bridgeNE = [ax, ay];
      break outer;
    }
  }
}
carveBridge(Math.round(bridgeNE[0]), Math.round(bridgeNE[1]), FAST, 3);
carveBridge(Math.round(W * 0.6), Math.round(H * 0.115), STREET, 3);

/* ---- Parks ---- */
const PARKS = [
  { x: W * 0.17, y: H * 0.2, rx: W * 0.07, ry: H * 0.09 },
  { x: W * 0.62, y: H * 0.72, rx: W * 0.055, ry: H * 0.08 },
];
const parkCells = new Set<number>();
for (const p of PARKS) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2 <= 1) {
        grid[at(x, y)] = BLOCKED;
        parkCells.add(at(x, y));
      }
    }
  }
}

/* ---- Congestion zone: the centre, overriding everything on roads ---- */
const ZONE = { x: CX, y: CY, rx: W * 0.13, ry: H * 0.16 };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (((x - ZONE.x) / ZONE.rx) ** 2 + ((y - ZONE.y) / ZONE.ry) ** 2 <= 1) {
      if (grid[at(x, y)] !== BLOCKED) grid[at(x, y)] = SLOW;
    }
  }
}

/* ---- Start and goal on the nearest road cells ---- */
function nearestRoad(tx: number, ty: number): { x: number; y: number } {
  let best = { x: 0, y: 0 };
  let bd = Infinity;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[at(x, y)] === BLOCKED) continue;
      const d = (x - tx) ** 2 + (y - ty) ** 2;
      if (d < bd) {
        bd = d;
        best = { x, y };
      }
    }
  }
  return best;
}
const START = nearestRoad(W * 0.07, H * 0.93);
const GOAL = nearestRoad(W * 0.91, H * 0.05);

/* ---- Connectivity: keep only what the depot can reach ---- */
{
  const seen = new Uint8Array(W * H);
  const queue = [at(START.x, START.y)];
  seen[queue[0]] = 1;
  while (queue.length) {
    const id = queue.pop() as number;
    const x = id % W;
    const y = Math.floor(id / W);
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Array<[number, number]>) {
      const nid = at(nx, ny);
      if (inb(nx, ny) && !seen[nid] && grid[nid] !== BLOCKED) {
        seen[nid] = 1;
        queue.push(nid);
      }
    }
  }
  let dropped = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== BLOCKED && !seen[i]) {
      grid[i] = BLOCKED;
      dropped++;
    }
  }
  if (!seen[at(GOAL.x, GOAL.y)]) throw new Error("goal unreachable");
  console.log(`dropped ${dropped} disconnected road cells`);
}

const COSTS: Record<number, number> = { [STREET]: 1, [FAST]: 0.6, [SLOW]: 2.5 };
const roads = grid.filter((c) => c !== BLOCKED).length;

fs.writeFileSync(
  "src/courses/uk-delivery-network/pathfinding/assets/city-grid.json",
  JSON.stringify({
    w: W,
    h: H,
    cell: CELL,
    start: START,
    goal: GOAL,
    costs: COSTS,
    cells: grid,
    river: [...riverCells],
    parks: [...parkCells],
    zone: ZONE,
  }),
);
console.log(`grid ${W}x${H} (${CELL}px cells), ${roads} road cells, start (${START.x},${START.y}), goal (${GOAL.x},${GOAL.y})`);
