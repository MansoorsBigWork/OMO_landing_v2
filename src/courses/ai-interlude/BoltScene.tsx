import { useMemo, type ReactElement } from "react";
import timing from "./timing.json";
import {
  CX,
  FLOOR,
  PARTS,
  SCENE_H,
  SCENE_W,
  createBurst,
} from "./physics";

/* Bolt, ported from the Claude Design export (the source .jsx is not kept in the repo)
   as a typed pure function of T. Part ids and data-origin attributes are
   preserved from the export contract. The robot is the original design;
   nothing here derives from any known mascot. */

export const CUES: Record<string, { start: number; end: number }> = Object.fromEntries(
  (timing as Array<{ id: string; start: number; end: number }>).map((r) => [r.id, r]),
);
export const CONTINUE_AT = CUES.Continue.start;
export const MESSAGE2_AT = CUES.Message2.start;
export const SETTLED_AT = CUES.Burst.end;

const C = {
  bg: "#0F0F0F",
  lift: "#1A1A1A",
  floor: "#2A2A2A",
  canvas: "#F8F6F0",
  ash: "#333333",
  body: "#6F6D69",
  bodyHi: "#7E7C77",
  bodyLo: "#5D5B57",
  feet: "#4A4845",
  amber: "#E8650A",
};

const D = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInQuad = (t: number) => t * t;
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const ez = (T: number, s: number, e: number, fn: (t: number) => number = easeOutCubic) =>
  fn(clamp((T - s) / (e - s), 0, 1));

/* Geometry helpers from the export */
const hr = (x: number, y: number, w: number, h: number, r: number, side: "l" | "r") =>
  side === "l"
    ? `M${x + r} ${y}H${x + w}V${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`
    : `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;

function cog(cx: number, cy: number, r: number, n: number): string {
  const ri = r * 0.74;
  const st = (Math.PI * 2) / n;
  const d: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * st;
    (
      [
        [a - st * 0.5, ri],
        [a - st * 0.22, ri],
        [a - st * 0.14, r],
        [a + st * 0.14, r],
        [a + st * 0.22, ri],
      ] as Array<[number, number]>
    ).forEach(([ang, rad], j) =>
      d.push((i === 0 && j === 0 ? "M" : "L") + (cx + Math.cos(ang) * rad).toFixed(1) + " " + (cy + Math.sin(ang) * rad).toFixed(1)),
    );
  }
  return d.join("") + "Z";
}

const springPts = (cx: number, cy: number) => {
  const p: string[] = [];
  for (let i = 0; i <= 6; i++) p.push(`${cx - 15 + i * 5},${cy + (i % 2 ? -6 : 6)}`);
  return p.join(" ");
};

const OUT = { stroke: C.ash, strokeWidth: 2, strokeLinejoin: "round" } as const;

const screw = (cx: number, cy: number) => (
  <g>
    <circle cx={cx} cy={cy} r={4.5} fill={C.bodyHi} stroke={C.ash} strokeWidth={1.5} />
    <line x1={cx - 2.5} y1={cy} x2={cx + 2.5} y2={cy} stroke={C.ash} strokeWidth={1.5} />
  </g>
);

const hand = (cx: number, cy: number, side: number) => (
  <g>
    <circle cx={cx} cy={cy} r={13} fill={C.bodyLo} {...OUT} />
    <circle cx={cx + side * 11} cy={cy - 5} r={4.5} fill={C.bodyLo} {...OUT} />
  </g>
);

interface DrawState {
  pupX: number;
  pupY: number;
  glow: number;
}

const DRAW: Record<string, (s: DrawState) => ReactElement> = {
  "cog-l": () => <path d={cog(0, -125, 22, 8)} fill={C.bodyHi} {...OUT} />,
  "cog-m": () => (
    <g>
      <path d={cog(-22, -100, 14, 7)} fill={C.bodyHi} {...OUT} />
      <circle cx={-22} cy={-100} r={4} fill={C.amber} />
    </g>
  ),
  "cog-s": () => <path d={cog(24, -145, 9, 6)} fill={C.body} {...OUT} />,
  "spring-1": () => <polyline points={springPts(26, -108)} fill="none" stroke={C.ash} strokeWidth={3} strokeLinejoin="round" />,
  "spring-2": () => <polyline points={springPts(-16, -140)} fill="none" stroke={C.amber} strokeWidth={3} strokeLinejoin="round" />,
  "leg-l": () => <rect x={-26} y={-50} width={18} height={38} rx={6} fill={C.body} {...OUT} />,
  "leg-r": () => <rect x={8} y={-50} width={18} height={38} rx={6} fill={C.body} {...OUT} />,
  "foot-l": () => <rect x={-33} y={-12} width={32} height={12} rx={5} fill={C.feet} {...OUT} />,
  "foot-r": () => <rect x={1} y={-12} width={32} height={12} rx={5} fill={C.feet} {...OUT} />,
  hip: () => <rect x={-36} y={-80} width={72} height={30} rx={7} fill={C.bodyLo} {...OUT} />,
  "body-l": () => <path d={hr(-48, -166, 48, 86, 12, "l")} fill={C.body} {...OUT} />,
  "body-r": () => <path d={hr(0, -166, 48, 86, 12, "r")} fill={C.bodyLo} {...OUT} />,
  "head-l": () => <path d={hr(-38, -234, 38, 64, 10, "l")} fill={C.body} {...OUT} />,
  "head-r": () => <path d={hr(0, -234, 38, 64, 10, "r")} fill={C.bodyLo} {...OUT} />,
  eye: (s) => (
    <g>
      <circle cx={0} cy={-204} r={20} fill={C.canvas} {...OUT} />
      <g transform={`translate(${s.pupX},${s.pupY})`}>
        <circle cx={0} cy={-204} r={9} fill={C.ash} />
        <circle cx={-3.5} cy={-207.5} r={2.6} fill={C.amber} />
      </g>
    </g>
  ),
  "pupil-lens": () => <circle cx={0} cy={-204} r={20} fill={C.canvas} opacity={0.16} />,
  "aerial-rod": () => <rect x={-2.5} y={-262} width={5} height={30} rx={2} fill={C.ash} />,
  "aerial-ball": (s) => (
    <g>
      <circle cx={0} cy={-266} r={8 + 16 * s.glow} fill={C.amber} opacity={0.4 * s.glow} />
      <circle cx={0} cy={-266} r={8} fill={C.amber} {...OUT} />
    </g>
  ),
  "arm-l": () => <rect x={-64} y={-152} width={16} height={68} rx={8} fill={C.body} {...OUT} />,
  "arm-r": () => <rect x={48} y={-152} width={16} height={68} rx={8} fill={C.body} {...OUT} />,
  "hand-l": () => hand(-56, -78, -1),
  "hand-r": () => hand(56, -78, 1),
  "screw-1": () => screw(0, -228),
  "screw-2": () => screw(-38, -156),
  "screw-3": () => screw(38, -156),
  "screw-4": () => screw(0, -86),
};

/* Blink: open 1, briefly 0.06; centred on `at` */
const blink = (T: number, at: number) => {
  const k = Math.abs(T - at) / 0.09;
  return k >= 1 ? 1 : 0.06 + 0.94 * k * k;
};

interface BoltSceneProps {
  T: number;
  reduced: boolean;
  seed: number;
}

export default function BoltScene({ T, reduced, seed }: BoltSceneProps) {
  const burstSim = useMemo(() => createBurst(seed), [seed]);

  const tw = CUES.WalkOn.start;
  const tk = CUES.Thinking.start;
  const tp = CUES.PreBurst.start;
  const tb = CUES.Burst.start;
  const walking = T >= tw && T < tk;
  const standing = T >= tk && T < tb;
  const burst = T >= tb;
  const tB = reduced ? 3 : T - tb;

  /* Robot rig state, straight from the export */
  let rx = -900;
  let bob = 0;
  let legL = 0;
  let armL = 0;
  let armR = 0;
  let aer = 0;
  let sqL = 1;
  let sqR = 1;
  let pupX = 6;
  let pupY = 0;
  let sx = 0.82;
  let wob = 0;
  let vx = 0;
  let vy = 0;
  let inf = 1;
  let eyeSY = 1;
  let glow = 0;
  let loosen = 0;

  if (walking) {
    const u = (T - tw) / (tk - tw);
    const lt = T - tw;
    rx = lerp(-900, 0, u);
    const fade = 1 - ez(T, tk - 0.18, tk);
    const s = Math.sin((2 * Math.PI * lt) / 0.2667);
    legL = 22 * s * fade;
    armL = -18 * s * fade;
    armR = 18 * s * fade;
    bob = -6 * Math.abs(Math.sin((Math.PI * lt) / 0.1333)) * fade;
    aer = 9 * Math.sin((2 * Math.PI * lt) / 0.1333 + 1) * fade;
    sqL = 1 - (2 / 12) * clamp(-s, 0, 1);
    sqR = 1 - (2 / 12) * clamp(s, 0, 1);
  }
  if (T >= tk) {
    rx = 0;
    const k = ez(T, tk, tk + 0.3);
    sx = lerp(0.82, 1, k);
    pupX = lerp(6, 0, k);
  }
  if (standing) {
    wob = 0.7 * Math.sin((T - tk) * 4);
    aer = 3 * Math.sin((T - tk) * 6);
    armR = 105 * ez(T, tk + 0.35, tk + 0.9);
    const b = clamp((T - tk - 0.5) / (tp - tk - 0.5), 0, 1);
    pupX = 5 * Math.sin(T * 9) * ez(T, tk + 0.6, tk + 1.2);
    pupY = 2 * Math.cos(T * 13) * b;
    eyeSY = 1 - 0.45 * ez(T, tk + 0.8, tp);
    loosen = ez(T, tk + 0.9, tp);
    let amp = 0;
    if (T > tk + 0.5) {
      const q = T - tk - 0.5;
      amp = q < 1 ? q : q < 1.7 ? 1 + 2 * Math.pow(q - 1, 1.5) : 3 + 5 * Math.pow((q - 1.7) / 0.5, 1.6);
    }
    vx = amp * Math.sin(T * 131);
    vy = amp * 0.6 * Math.cos(T * 173);
    if (T >= tk + 0.5) {
      let ph = 0;
      let t = tk + 0.5;
      const N = 48;
      const dt = (T - t) / N;
      for (let i = 0; i < N; i++) {
        const k = clamp((t - tk - 0.5) / (tp - tk - 0.5), 0, 1);
        ph += dt / lerp(0.6, 0.12, k * k);
        t += dt;
      }
      glow = ((Math.sin(ph * 2 * Math.PI) + 1) / 2) * b;
    }
    if (T >= tp) {
      eyeSY = lerp(0.55, 0.06, ez(T, tp, tp + 0.08));
      inf = lerp(1, 1.06, ez(T, tp, tp + 0.15, easeInQuad));
      vx = 8 * Math.sin(T * 131);
      vy = 4 * Math.cos(T * 173);
      glow = 1;
    }
  }
  if (!burst && !reduced) eyeSY *= blink(T, tk + 0.35);

  /* The eye part blinks after landing, then every 4 s */
  let eyeLandSY = 1;
  if (burst || reduced) {
    const eyeRest = burstSim.phys(PARTS.findIndex((p) => p.id === "eye"), tB);
    if (eyeRest.landed) {
      const u = tB - eyeRest.tLand - 0.4;
      if (u > 0) eyeLandSY = blink(u % 4, 0.09);
    }
  }

  const art: Record<string, string> = {
    "leg-l": `rotate(${legL} -17 -50)`,
    "leg-r": `rotate(${-legL} 17 -50)`,
    "foot-l": `rotate(${legL} -17 -50) scale(1 ${sqL}) rotate(7 -17 -6)`,
    "foot-r": `rotate(${-legL} 17 -50) scale(1 ${sqR}) rotate(-7 17 -6)`,
    "arm-l": `rotate(${armL} -56 -150)`,
    "hand-l": `rotate(${armL} -56 -150)`,
    "arm-r": `rotate(${armR} 56 -150)`,
    "hand-r": `rotate(${armR} 56 -150)`,
    "aerial-rod": `rotate(${aer} 0 -234)`,
    "aerial-ball": `rotate(${aer} 0 -234)`,
    eye: `translate(0 -204) scale(1 ${eyeSY}) translate(0 204)`,
    "pupil-lens": `translate(0 -204) scale(1 ${eyeSY}) translate(0 204)`,
    "screw-1": `translate(0 ${-6 * loosen}) rotate(${300 * loosen} 0 -228)`,
  };
  const st: DrawState = { pupX, pupY, glow: burst || reduced ? 0 : glow };
  const groupTf =
    burst || reduced
      ? `translate(${CX} ${FLOOR})`
      : `translate(${CX + rx + vx} ${FLOOR + bob + vy}) rotate(${wob}) translate(0 -130) scale(${sx * inf} ${inf}) translate(0 130)`;
  const robotVisible = reduced || T >= tw - 0.01;

  /* Thought bubble */
  const qN = T < tk + 0.2 ? 0 : T < tk + 0.9 ? 1 : T < tk + 1.4 ? 2 : T < tk + 1.9 ? 5 : 8;
  const bubS = ez(T, tk + 0.1, tk + 0.55, easeOutBack) * (1 - ez(T, tp + 0.18, tp + 0.26));
  const brx = 44 + qN * 6;
  const bry = brx * 0.72;
  const bcx = 896;
  const bcy = 392;
  const Q: Array<[number, number, number]> = [
    [0, 0, 1], [-0.42, -0.1, 0.8], [0.4, 0.15, 0.85], [-0.1, -0.5, 0.6],
    [0.2, 0.5, 0.6], [0.5, -0.45, 0.55], [-0.55, 0.42, 0.55], [-0.15, 0.15, 0.7],
  ];
  const bubShow = !reduced && T >= tk && T < tp + 0.3;
  const popK = ez(T, tp + 0.2, tp + 0.55, easeOutQuad);

  const puffs = [0, 1, 2].map((k) => {
    const s0 = tk + 1.3 + k * 0.3;
    const p = clamp((T - s0) / 0.9, 0, 1);
    return { p, k, on: !reduced && T >= s0 && p < 1 };
  });

  const ringK = ez(T, tb, tb + 0.6, easeOutQuad);

  return (
    <svg
      className="interlude-svg"
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="bolt-lift" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.lift} />
          <stop offset="1" stopColor={C.lift} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={CX} cy={FLOOR - 120} rx={520} ry={330} fill="url(#bolt-lift)" />
      <line id="floor" x1={0} y1={FLOOR} x2={SCENE_W} y2={FLOOR} stroke={C.floor} strokeWidth={1} />
      <g id="robot" transform={groupTf} style={{ display: robotVisible ? "block" : "none" }}>
        {PARTS.map((p, i) => {
          let tf = art[p.id] || "";
          if (burst || reduced) {
            const ph = burstSim.phys(i, tB);
            tf = `translate(${ph.dx} ${ph.dy}) rotate(${ph.rot} ${p.cx} ${p.cy})`;
            if (p.id === "eye") tf += ` translate(0 ${p.cy}) scale(1 ${eyeLandSY}) translate(0 ${-p.cy})`;
          }
          return (
            <g key={p.id} id={`part-${p.id}`} data-origin={`${p.cx} ${p.cy}`} transform={tf}>
              {DRAW[p.id](st)}
            </g>
          );
        })}
      </g>
      <g id="steam">
        {puffs.map(
          ({ p, k, on }) =>
            on && (
              <circle
                key={k}
                cx={800 + (k - 1) * 16 + Math.sin(p * 6 + k) * 6}
                cy={444 - 56 * p}
                r={5 + 11 * p}
                fill={C.canvas}
                opacity={0.45 * (1 - p)}
              />
            ),
        )}
      </g>
      {bubShow && (
        <g id="thought-bubble" transform={`translate(${bcx} ${bcy}) scale(${bubS}) translate(${-bcx} ${-bcy})`}>
          <circle cx={838} cy={466} r={6} fill={C.canvas} {...OUT} />
          <circle cx={856} cy={444} r={10} fill={C.canvas} {...OUT} />
          <ellipse cx={bcx} cy={bcy} rx={brx} ry={bry} fill={C.canvas} {...OUT} />
          {Q.slice(0, qN).map(([qx, qy, qs], i) => (
            <text
              key={i}
              id={`q-${i + 1}`}
              x={bcx + qx * brx * 0.9}
              y={bcy + qy * bry * 0.9 + 12 * qs}
              textAnchor="middle"
              fontWeight={700}
              fontSize={36 * qs}
              fill={C.ash}
              transform={`rotate(${(i % 2 ? -1 : 1) * i * 6} ${bcx + qx * brx * 0.9} ${bcy + qy * bry * 0.9})`}
            >
              ?
            </text>
          ))}
        </g>
      )}
      {!reduced && T >= tp + 0.2 && popK < 1 && (
        <circle cx={bcx} cy={bcy} r={20 + 70 * popK} fill="none" stroke={C.canvas} strokeWidth={3 * (1 - popK)} opacity={0.6 * (1 - popK)} />
      )}
      {!reduced && burst && ringK < 1 && (
        <circle id="ring-flash" cx={CX} cy={FLOOR - 140} r={20 + 420 * ringK} fill="none" stroke={C.canvas} strokeWidth={2 + 8 * (1 - ringK)} opacity={0.2 * (1 - ringK)} />
      )}
    </svg>
  );
}
