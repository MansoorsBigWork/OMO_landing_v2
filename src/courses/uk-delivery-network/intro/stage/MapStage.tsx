import { memo, useMemo, type CSSProperties, type ReactElement } from "react";
import { CUES, sceneAt } from "./composition";
import { MAP_GEO } from "./map-geo";

/* The map stage, ported from the Claude Design export (Map Stage Brief A).
   One fixed illustrated UK map, 960 by 1200, that never zooms: routes draw
   on in blue, an amber parcel marker rides them, depots light up, and
   notification cards pop in for each event. Everything below renders from
   T alone, so the catch-up playhead can run it in either direction. */

export const STAGE_W = 960;
export const STAGE_H = 1200;

const OMO = {
  blue: "var(--omo-blue)",
  amber: "var(--omo-amber)",
  canvas: "var(--omo-canvas)",
  ash: "var(--omo-ash)",
};
const MAP = {
  water: "var(--map-water)",
  bathy1: "var(--map-bathy-1)",
  bathy2: "var(--map-bathy-2)",
  bathy3: "var(--map-bathy-3)",
  land: "var(--map-land)",
  contour: "var(--map-contour)",
  contour2: "var(--map-contour-2)",
  urban: "var(--map-urban)",
  road: "var(--map-road)",
  motorway: "var(--map-motorway)",
  motorwayEdge: "var(--map-motorway-edge)",
  coast: "var(--map-coast)",
};
const FONT = "var(--omo-font)";
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;
const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const MOTION = {
  enter: (p: number) => easeOutCubic(clamp(p, 0, 1)),
  draw: (p: number) => easeInOutSine(clamp(p, 0, 1)),
  pop: (p: number) => easeOutBack(clamp(p, 0, 1)),
};

const at = (k: string, dt: number) => (CUES[k] || 0) + dt;

/* Authored composition data: the event cards, journey stats and clock. */
type EventType =
  | "order" | "warehouse" | "collection" | "depot" | "trunk" | "hub" | "van" | "delivery" | "alert";

interface StageEvent {
  at: number;
  type: EventType;
  title: string;
  body: string;
  time: string;
}

const EVENTS: StageEvent[] = [
  { at: at("K1", 0.5), type: "order", title: "Order placed", body: "Northline Outfitters, 1 item, next-day", time: "21:14" },
  { at: at("K2", 2.4), type: "warehouse", title: "Order received", body: "Milton Keynes fulfilment centre", time: "21:15" },
  { at: at("K3", 0.8), type: "collection", title: "Picked and packed", body: "Label printed, 1.2 kg declared", time: "21:15" },
  { at: at("K4", 0.6), type: "depot", title: "Collected", body: "640 parcels, Kestrel MK depot", time: "18:10" },
  { at: at("K4", 2.6), type: "alert", title: "Re-rated", body: "Scale reads 2.6 kg, billed at 2.6 kg", time: "18:12" },
  { at: at("K5", 0.8), type: "trunk", title: "Trunk departed", body: "MK to national hub, 4,000 parcels", time: "23:40" },
  { at: at("K6", 0.8), type: "hub", title: "Sorted", body: "Chute S, Sheffield cage sealed", time: "01:10" },
  { at: at("K7", 0.6), type: "van", title: "Out for delivery", body: "Route R5, stop 41 of 142", time: "06:45" },
  { at: at("K7", 5.5), type: "delivery", title: "Delivered", body: "Left with neighbour, photo taken", time: "14:52" },
];

const STATS: Array<{ value: string; label: string }> = [
  { value: "4,000", label: "parcels on the night trunk" },
  { value: "2.6 kg", label: "billed, 1.2 kg declared" },
  { value: "12,000 / h", label: "sorted at the national hub" },
  { value: "142", label: "stops on route R5" },
];

const CLOCKS: Array<[number, string]> = [
  [at("K1", 0), "21:14"], [at("K2", 0), "21:15"], [at("K4", 0), "18:10"], [at("K5", 0), "23:40"],
  [at("K6", 0), "01:10"], [at("K7", 0), "06:45"], [at("K7", 3.8), "14:52"], [at("K8", 0), ""],
];

/* Glyphs on a 24-grid, single colour. */
function Glyph({ name, color = OMO.ash, size = 20, x = 0, y = 0 }: { name: EventType | "parcel" | "truck" | "house"; color?: string; size?: number; x?: number; y?: number }) {
  const s = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const g: Record<string, ReactElement> = {
    parcel: <g {...s}><path d="M4 8l8-4 8 4v9l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v9" /></g>,
    truck: <g {...s}><path d="M2 6h11v10H2zM13 9h5l3 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></g>,
    van: <g {...s}><path d="M2 8h12l6 4v5H2z" /><path d="M9 8v9M14 8v4h6" /><circle cx="6" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></g>,
    house: <g {...s}><path d="M4 11l8-7 8 7v9H4z" /><path d="M10 20v-6h4v6" /></g>,
    order: <g {...s}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></g>,
    warehouse: <g {...s}><path d="M3 10l9-6 9 6v11H3z" /><path d="M7 21v-7h10v7M7 17h10" /></g>,
    collection: <g {...s}><path d="M4 8l8-4 8 4v9l-8 4-8-4z" /><path d="M12 12v9M4 8l8 4 8-4" /><path d="M17 3l3 3-3 3" /></g>,
    depot: <g {...s}><path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></g>,
    trunk: <g {...s}><path d="M2 6h11v10H2zM13 9h5l3 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></g>,
    hub: <g {...s}><circle cx="12" cy="12" r="3" /><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /></g>,
    delivery: <g {...s}><circle cx="12" cy="12" r="9" /><path d="M7.5 12.5l3 3 6-6" /></g>,
    alert: <g {...s}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></g>,
  };
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      {g[name]}
    </svg>
  );
}

function NotificationCard({ ev, y, opacity }: { ev: StageEvent; y: number; opacity: number }) {
  const alert = ev.type === "alert";
  return (
    <div style={{ position: "absolute", right: 0, top: 0, width: 360, minHeight: 72, boxSizing: "border-box", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "center",
      background: "rgba(248,246,240,0.96)", border: "1px solid rgba(51,51,51,0.10)", boxShadow: "inset 0 0 0 2px var(--omo-canvas)", color: OMO.ash, fontFamily: FONT,
      transform: `translateY(${y}px)`, opacity, willChange: "transform, opacity" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: alert ? "rgba(232,101,10,0.15)" : "rgba(51,51,51,0.08)" }}>
        <Glyph name={ev.type} color={alert ? OMO.amber : OMO.ash} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: "18px" }}>{ev.title}</div>
        <div style={{ fontSize: 13, lineHeight: "17px", color: "rgba(51,51,51,0.75)" }}>{ev.body}</div>
      </div>
      <div style={{ position: "absolute", top: 14, right: 16, fontSize: 12, color: "rgba(51,51,51,0.55)", fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{ev.time}</div>
    </div>
  );
}

function StatCard({ value, label, p }: { value: string; label: string; p: number }) {
  return (
    <div style={{ width: 180, height: 96, boxSizing: "border-box", borderRadius: 12, padding: "18px 18px 16px", background: "rgba(248,246,240,0.96)", border: "1px solid rgba(51,51,51,0.10)", boxShadow: "inset 0 0 0 2px var(--omo-canvas)", color: OMO.ash, fontFamily: FONT,
      display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: MOTION.enter(p), transform: `translateY(${8 * (1 - MOTION.enter(p))}px)` }}>
      <div style={{ fontSize: 28, fontWeight: 600, lineHeight: "30px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(51,51,51,0.70)", lineHeight: "14px" }}>{label}</div>
    </div>
  );
}

function UrbanBlob({ c, fill }: { c: { x: number; y: number; size: number }; fill: string }) {
  const s = 14 * Math.sqrt(c.size);
  return (
    <g transform={`translate(${c.x} ${c.y})`}>
      <rect x={-s} y={-s * 0.7} width={s * 2} height={s * 1.4} rx={s * 0.5} fill={fill} transform="rotate(-14)" />
      <rect x={-s * 0.5} y={-s * 1.05} width={s * 1.3} height={s * 1.2} rx={s * 0.45} fill={fill} transform="rotate(22)" />
      <rect x={-s * 1.2} y={-s * 0.2} width={s * 1.1} height={s * 1.1} rx={s * 0.4} fill={fill} transform="rotate(8)" />
    </g>
  );
}

/* Everything that does not depend on T, rendered once. */
const StaticMap = memo(function StaticMap() {
  const geo = MAP_GEO;
  const cities = [...geo.depots, ...geo.others];
  return (
    <g>
      <g id="water">
        <path d={`${geo.land} ${geo.ireland}`} fill="none" stroke={MAP.bathy1} strokeWidth="44" strokeLinejoin="round" />
        <path d={`${geo.land} ${geo.ireland}`} fill="none" stroke={MAP.bathy2} strokeWidth="28" strokeLinejoin="round" />
        <path d={`${geo.land} ${geo.ireland}`} fill="none" stroke={MAP.bathy3} strokeWidth="13" strokeLinejoin="round" />
      </g>
      <g id="land">
        <path d={geo.ireland} fill={MAP.land} opacity="0.5" />
        <path d={geo.land} fill={MAP.land} />
      </g>
      <g id="contours" clipPath="url(#landClip)">
        {geo.hills.map((h, i) => (
          <g key={i}>
            <ellipse cx={h.x} cy={h.y} rx={h.r} ry={h.r * 0.78} fill={MAP.contour} transform={`rotate(-20 ${h.x} ${h.y})`} />
            <ellipse cx={h.x + h.r * 0.1} cy={h.y - h.r * 0.05} rx={h.r * 0.52} ry={h.r * 0.4} fill={MAP.contour2} transform={`rotate(-20 ${h.x} ${h.y})`} />
          </g>
        ))}
      </g>
      <g id="urban" clipPath="url(#landClip)">
        {cities.map((c, i) => <UrbanBlob key={i} c={c} fill={MAP.urban} />)}
      </g>
      <g id="roads" clipPath="url(#landClip)">
        {cities.map((c, i) => <UrbanBlob key={i} c={c} fill="url(#roads)" />)}
      </g>
      <g id="motorways">
        {geo.motorways.map((d, i) => <path key={`e${i}`} d={d} fill="none" stroke={MAP.motorwayEdge} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />)}
        {geo.motorways.map((d, i) => <path key={`m${i}`} d={d} fill="none" stroke={MAP.motorway} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
      <g id="coast">
        <path d={geo.land} fill="none" stroke={MAP.coast} strokeWidth="1.5" />
        <path d={geo.ireland} fill="none" stroke={MAP.coast} strokeWidth="1.5" opacity="0.6" />
      </g>
      <g id="labels" fill={OMO.ash} opacity="0.55" fontSize="11" fontFamily={FONT} letterSpacing="1.6" style={{ textTransform: "uppercase" }}>
        {geo.depots.map((d) => {
          const hub = d.slug === "rugby";
          const dx = d.side === "r" ? 13 : -13;
          return (
            <text key={d.slug} x={d.x + dx} y={d.y + 4 + d.dy} textAnchor={d.side === "r" ? "start" : "end"}>
              {d.label.toUpperCase()}
              {hub && <tspan fontSize="8.5" letterSpacing="1.2" x={d.x + dx} dy="12">NATIONAL HUB</tspan>}
            </text>
          );
        })}
      </g>
    </g>
  );
});

interface PathTool {
  d: string;
  len: number;
  at: (p: number) => [number, number];
}

function pathTool(d: string): PathTool {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  const len = el.getTotalLength();
  return {
    d,
    len,
    at: (p) => {
      const pt = el.getPointAtLength(clamp(p, 0, 1) * len);
      return [pt.x, pt.y];
    },
  };
}

function RouteTrim({ tool, p, dashed }: { tool: PathTool; p: number; dashed?: boolean }) {
  if (p <= 0) return null;
  const vis = tool.len * p;
  if (dashed) {
    return (
      <g>
        <mask id="r1mask" maskUnits="userSpaceOnUse" x="0" y="0" width={STAGE_W} height={STAGE_H}>
          <path d={tool.d} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${vis} ${tool.len + 20}`} />
        </mask>
        <path id="route-r1" d={tool.d} strokeWidth="2" strokeDasharray="5 6" mask="url(#r1mask)" />
      </g>
    );
  }
  return <path d={tool.d} strokeWidth="3" strokeDasharray={`${vis} ${tool.len + 20}`} />;
}

export default function MapStage({ T }: { T: number }) {
  const geo = MAP_GEO;
  const routes = useMemo(
    () => ({
      r1: pathTool(geo.routes.r1),
      r2: pathTool(geo.routes.r2),
      r3: pathTool(geo.routes.r3),
      local: pathTool(geo.routes.local),
    }),
    [geo],
  );

  /* HUD clock */
  const clock = CLOCKS.filter((c) => c[0] <= T).pop();
  const clockText = T >= (CUES.K1 || 0) && clock ? clock[1] : "";

  /* Card stack: newest on top, three visible, older slide down and out */
  const active = EVENTS.filter((e) => e.at <= T).sort((a, b) => b.at - a.at);
  const newest = active[0];
  const enterP = newest ? MOTION.enter((T - newest.at) / 0.24) : 1;
  const exitP = newest ? clamp((T - newest.at) / 0.2, 0, 1) : 1;
  const clearP = clamp((T - at("K8", 0)) / 0.3, 0, 1);
  const ROW = 84;
  const cards = active.map((ev, i) => {
    let y: number;
    let op: number;
    if (i === 0) { y = 8 * (1 - enterP); op = enterP; }
    else if (i < 3) { y = lerp((i - 1) * ROW, i * ROW, enterP); op = 1; }
    else if (i === 3) { y = lerp(2 * ROW, 3 * ROW, enterP) + 8 * exitP; op = 1 - exitP; }
    else return null;
    op *= 1 - clearP;
    y += 8 * clearP;
    return op > 0.001 ? <NotificationCard key={ev.title} ev={ev} y={y} opacity={op} /> : null;
  });

  /* Routes draw on and stay */
  const r1P = MOTION.draw((T - at("K2", 0.2)) / 2);
  const r2P = MOTION.draw((T - at("K5", 0.5)) / 3);
  const r3P = MOTION.draw((T - at("K7", 0.3)) / 3);
  const locP = MOTION.draw((T - at("K7", 3.8)) / 1.5);

  /* Depot activation and pulses */
  const activation: Record<string, number> = { sheffield: at("K1", 0.3), "milton-keynes": at("K2", 2.2), rugby: at("K5", 3.5) };
  const pulses: Record<string, number[]> = { sheffield: [at("K1", 0.3), at("K7", 3.3)], "milton-keynes": [at("K2", 2.2)], rugby: [at("K5", 3.5), at("K6", 0.4)] };
  const fadeOthers = 1 - 0.6 * MOTION.enter((T - at("K8", 0.3)) / 1);

  /* The parcel marker riding the routes */
  let marker: ReactElement | null = null;
  if (T >= at("K3", 0.4)) {
    const pop = MOTION.pop((T - at("K3", 0.4)) / 0.45);
    let pos: [number, number];
    let glyph: "truck" | "van" | null = null;
    if (T < at("K4", 0.3)) pos = routes.r2.at(0);
    else if (T < at("K5", 0.5)) pos = routes.r2.at(0.06 * MOTION.enter((T - at("K4", 0.3)) / 1));
    else if (T < at("K7", 0.3)) { pos = routes.r2.at(lerp(0.06, 1, r2P)); glyph = r2P < 1 ? "truck" : null; }
    else if (T < at("K7", 3.8)) pos = routes.r3.at(r3P);
    else { pos = routes.local.at(locP); glyph = locP < 1 ? "van" : null; }
    marker = (
      <g transform={`translate(${pos[0]} ${pos[1]})`}>
        <g transform={`scale(${pop})`}>
          <rect x="-8" y="-8" width="16" height="16" rx="4" fill={OMO.amber} stroke={OMO.canvas} strokeWidth="2" />
          <Glyph name="parcel" color={OMO.canvas} size={11} x={-5.5} y={-5.5} />
        </g>
        {glyph && <Glyph name={glyph} size={20} x={12} y={-26} />}
      </g>
    );
  }

  const duskA = MOTION.enter((T - at("K5", 0)) / 1.5) * (1 - MOTION.enter((T - at("K7", 0)) / 1));
  const houseP = MOTION.pop((T - at("K7", 4.6)) / 0.4);
  const statP = (i: number) => (T - at("K8", 0.7) - i * 0.12) / 0.4;
  const scene = sceneAt(T);

  const rootStyle: CSSProperties = { position: "absolute", inset: 0, background: MAP.water, overflow: "hidden", fontFamily: FONT };
  return (
    <div data-scene={scene} style={rootStyle}>
      <svg width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} style={{ position: "absolute", inset: 0, display: "block" }} aria-hidden="true">
        <defs>
          <pattern id="roads" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
            <path d="M0 7H14M7 0V14" stroke={MAP.road} strokeWidth="1.2" />
          </pattern>
          <clipPath id="landClip"><path d={geo.land} /></clipPath>
        </defs>
        <StaticMap />
        <g id="depots">
          {geo.depots.map((d) => {
            const on = activation[d.slug] !== undefined && T >= activation[d.slug];
            const r = d.slug === "rugby" ? 7 : 5;
            const op = activation[d.slug] !== undefined ? 1 : fadeOthers;
            return (
              <g key={d.slug} id={`depot-${d.slug}`} opacity={op}>
                {(pulses[d.slug] || []).map((p0, i) => {
                  const p = (T - p0) / 0.9;
                  if (p < 0 || p > 1) return null;
                  const e = MOTION.enter(p);
                  return <circle key={i} className="ring" cx={d.x} cy={d.y} r={lerp(r, 11 + (r - 5), e)} fill="none" stroke={OMO.blue} strokeWidth="2" opacity={0.25 * (1 - p)} />;
                })}
                <circle className="dot" cx={d.x} cy={d.y} r={r} fill={on ? OMO.blue : OMO.canvas} stroke={OMO.blue} strokeWidth="2" />
              </g>
            );
          })}
        </g>
        <g id="routes" fill="none" stroke={OMO.blue} strokeLinecap="round" strokeLinejoin="round">
          <RouteTrim tool={routes.r1} p={r1P} dashed />
          <RouteTrim tool={routes.r2} p={r2P} />
          <RouteTrim tool={routes.r3} p={r3P} />
          <RouteTrim tool={routes.local} p={locP} />
        </g>
        {houseP > 0 && (
          <g id="house" transform={`translate(${geo.house[0]} ${geo.house[1]}) scale(${houseP})`}>
            <circle r="9" fill={OMO.canvas} stroke={OMO.blue} strokeWidth="1.5" />
            <Glyph name="house" size={12} x={-6} y={-6} color={OMO.ash} />
          </g>
        )}
        <g id="parcel">{marker}</g>
        <rect id="dusk" width={STAGE_W} height={STAGE_H} fill={OMO.ash} opacity={0.06 * duskA} />
      </svg>
      <div style={{ position: "absolute", left: 32, top: 30, fontSize: 13, fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: "rgba(51,51,51,0.70)", letterSpacing: 0.5, minHeight: 16 }}>{clockText}</div>
      <div style={{ position: "absolute", right: 32, top: 32, width: 360, height: 400 }}>{cards}</div>
      {T >= at("K8", 0.7) && (
        <div style={{ position: "absolute", right: 32, bottom: 32, display: "grid", gridTemplateColumns: "180px 180px", gap: 12 }}>
          {STATS.map((s, i) => <StatCard key={s.label} value={s.value} label={s.label} p={statP(i)} />)}
        </div>
      )}
    </div>
  );
}
