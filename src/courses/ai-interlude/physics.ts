/* Burst physics for the Bolt interlude, ported from the Claude Design
   export: 22 parts leave with capped random velocities biased upward,
   fall under gravity, bounce once at 35 per cent restitution and settle
   on the floor line. Deterministic for a given seed; the page seeds per
   session so replays differ slightly. Landing on the floor line keeps
   every part out of the text safe zone by construction; horizontal
   travel is clamped to the stage. One module serves the scene and the
   headless 50-seed test. */

export const SCENE_W = 1600;
export const SCENE_H = 1000;
export const FLOOR = 720;
export const CX = 800;
export const GRAVITY = 2400;
export const BURST_DUR = 1.38;
const MAX_RISE_VY = 680;
const MAX_VX = 760;
const X_MIN = 60;
const X_MAX = 1540;
const D = Math.PI / 180;

/* Part anchors in robot coordinates (origin at the feet, y up is
   negative); h is the half height used for the landing contact. */
export interface PartMeta {
  id: string;
  cx: number;
  cy: number;
  h: number;
}

export const PARTS: PartMeta[] = [
  { id: "cog-l", cx: 0, cy: -125, h: 22 },
  { id: "cog-m", cx: -22, cy: -100, h: 14 },
  { id: "cog-s", cx: 24, cy: -145, h: 9 },
  { id: "spring-1", cx: 26, cy: -108, h: 8 },
  { id: "spring-2", cx: -16, cy: -140, h: 8 },
  { id: "leg-l", cx: -17, cy: -31, h: 19 },
  { id: "leg-r", cx: 17, cy: -31, h: 19 },
  { id: "foot-l", cx: -17, cy: -6, h: 6 },
  { id: "foot-r", cx: 17, cy: -6, h: 6 },
  { id: "hip", cx: 0, cy: -65, h: 15 },
  { id: "body-l", cx: -24, cy: -123, h: 43 },
  { id: "body-r", cx: 24, cy: -123, h: 43 },
  { id: "head-l", cx: -19, cy: -202, h: 32 },
  { id: "head-r", cx: 19, cy: -202, h: 32 },
  { id: "eye", cx: 0, cy: -204, h: 21 },
  { id: "pupil-lens", cx: 0, cy: -204, h: 21 },
  { id: "aerial-rod", cx: 0, cy: -248, h: 14 },
  { id: "aerial-ball", cx: 0, cy: -266, h: 8 },
  { id: "arm-l", cx: -56, cy: -118, h: 33 },
  { id: "arm-r", cx: 56, cy: -118, h: 33 },
  { id: "hand-l", cx: -56, cy: -78, h: 13 },
  { id: "hand-r", cx: 56, cy: -78, h: 13 },
  { id: "screw-1", cx: 0, cy: -228, h: 5 },
  { id: "screw-2", cx: -38, cy: -156, h: 5 },
  { id: "screw-3", cx: 38, cy: -156, h: 5 },
  { id: "screw-4", cx: 0, cy: -86, h: 5 },
];

export const EYE_INDEX = PARTS.findIndex((p) => p.id === "eye");

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Kinematics {
  vx: number;
  vy: number;
  w: number;
  t1: number;
  vy1: number;
  vx1: number;
  w1: number;
  t2: number;
}

export interface PartState {
  dx: number;
  dy: number;
  rot: number;
  landed: boolean;
  tLand: number;
}

export interface Burst {
  phys: (index: number, t: number) => PartState;
  kin: Kinematics[];
}

export function createBurst(seed: number): Burst {
  const kin: Kinematics[] = PARTS.map((p, i) => {
    const r = mulberry(seed + i * 17);
    const up = r() < 0.6;
    const screwy = p.id.startsWith("screw");
    const ang = up ? -(15 + r() * 150) : 15 + r() * 150;
    let sp = screwy ? 950 + r() * 350 : 520 + r() * 480;
    for (;;) {
      let vx = Math.cos(ang * D) * sp;
      let vy = Math.sin(ang * D) * sp;
      if (vy < -MAX_RISE_VY) vy = -MAX_RISE_VY;
      if (Math.abs(vx) > MAX_VX) vx = Math.sign(vx) * MAX_VX;
      const w = (90 + r() * 630) * (r() < 0.5 ? -1 : 1) * (p.id === "cog-l" ? 1.4 : 1);
      const c = p.cy + p.h;
      const t1 = (-vy + Math.sqrt(vy * vy - 2 * GRAVITY * c)) / GRAVITY;
      const vy1 = -(vy + GRAVITY * t1) * 0.35;
      const vx1 = vx * 0.5;
      const w1 = w * 0.35;
      const t2 = (2 * -vy1) / GRAVITY;
      if (t1 + t2 <= BURST_DUR - 0.04 || sp < 200) {
        return { vx, vy, w, t1, vy1, vx1, w1, t2 };
      }
      sp *= 0.9;
    }
  });

  const phys = (i: number, t: number): PartState => {
    const q = kin[i];
    const p = PARTS[i];
    let dx: number;
    let dy: number;
    let rot: number;
    if (t < q.t1) {
      dx = q.vx * t;
      dy = q.vy * t + 0.5 * GRAVITY * t * t;
      rot = q.w * t;
    } else {
      const u = Math.min(t - q.t1, q.t2);
      dx = q.vx * q.t1 + q.vx1 * u;
      dy = -(p.cy + p.h) + q.vy1 * u + 0.5 * GRAVITY * u * u;
      rot = q.w * q.t1 + q.w1 * u;
      if (p.id === "eye") {
        const target = Math.round(rot / 360) * 360;
        const k = clamp(u / 0.25, 0, 1);
        rot = rot + (target - rot) * k;
      }
    }
    const wx = CX + p.cx + dx;
    dx += clamp(wx, X_MIN, X_MAX) - wx;
    return { dx, dy, rot, landed: t >= q.t1 + q.t2, tLand: q.t1 + q.t2 };
  };

  return { phys, kin };
}
