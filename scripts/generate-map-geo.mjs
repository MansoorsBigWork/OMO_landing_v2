/* Run with: node scripts/generate-map-geo.mjs (from the repo root)
   Build-time port of the export's buildGeo(): precomputes every path so the
   app ships no d3 and fetches nothing at runtime. */
import { geoTransverseMercator, geoPath, geoCentroid } from "d3-geo";
import { line as d3line, curveCatmullRom } from "d3-shape";
import * as topojson from "topojson-client";
import fs from "node:fs";

/* Natural Earth 1:50m via world-atlas; fetched on demand. */
const SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";
const CACHE = "scripts/.countries-50m.json";
if (!fs.existsSync(CACHE)) {
  const res = await fetch(SRC);
  fs.writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}
const topo = JSON.parse(fs.readFileSync(CACHE, "utf8"));

const DEPOTS = [
  ["aberdeen", "Aberdeen", -2.10, 57.15, "r"], ["glasgow", "Glasgow", -4.25, 55.86, "l"],
  ["newcastle", "Newcastle", -1.61, 54.97, "r"], ["leeds", "Leeds", -1.55, 53.80, "r", -5],
  ["manchester", "Manchester", -2.24, 53.48, "l", -9], ["sheffield", "Sheffield", -1.47, 53.38, "r", 20],
  ["liverpool", "Liverpool", -2.98, 53.41, "l", 11], ["nottingham", "Nottingham", -1.15, 52.95, "r"],
  ["birmingham", "Birmingham", -1.90, 52.49, "l"], ["rugby", "Rugby", -1.26, 52.37, "r", -8],
  ["milton-keynes", "Milton Keynes", -0.76, 52.04, "r", 8], ["bristol", "Bristol", -2.59, 51.45, "r", 2],
  ["cardiff", "Cardiff", -3.18, 51.48, "l", 6], ["london", "London", -0.13, 51.51, "r"],
  ["southampton", "Southampton", -1.40, 50.90, "r"], ["exeter", "Exeter", -3.53, 50.72, "l"],
  ["belfast", "Belfast", -5.93, 54.60, "l"],
];
const OTHER_CITIES = [[-3.19, 55.95, 1], [-1.13, 52.63, 0.8], [-1.51, 52.41, 0.8], [-1.75, 53.80, 0.8], [-0.34, 53.75, 0.8], [-4.14, 50.37, 0.7]];
const CITY_SIZE = { london: 2.6, birmingham: 1.7, manchester: 1.6, leeds: 1.4, glasgow: 1.4, liverpool: 1.3, sheffield: 1.2, bristol: 1.1, newcastle: 1.1, nottingham: 1, cardiff: 1, belfast: 1.1, southampton: 0.9, exeter: 0.7, rugby: 0.6, "milton-keynes": 0.9, aberdeen: 0.9 };
const HILLS = [[-4.6, 57.1, 68], [-3.6, 56.8, 44], [-5.2, 56.4, 34], [-3.5, 55.4, 34], [-3.1, 54.5, 26], [-2.1, 54.4, 30], [-1.95, 53.9, 26], [-1.8, 53.3, 22], [-3.9, 53.0, 30], [-3.5, 51.9, 26], [-3.95, 50.6, 20], [-6.0, 54.2, 16], [-7.0, 54.8, 20]];
const MOTORWAYS = {
  M1: [[-0.2, 51.55], [-0.42, 51.9], [-0.75, 52.05], [-0.9, 52.24], [-1.12, 52.62], [-1.22, 52.93], [-1.3, 53.36], [-1.55, 53.78]],
  M6: [[-1.28, 52.38], [-1.5, 52.45], [-1.87, 52.5], [-2.1, 52.8], [-2.6, 53.38], [-2.7, 53.75], [-2.8, 54.05], [-2.75, 54.3], [-2.95, 54.9]],
  M5: [[-1.95, 52.45], [-2.2, 52.2], [-2.25, 51.85], [-2.55, 51.45], [-3.1, 51.0], [-3.53, 50.72]],
  M4: [[-0.3, 51.5], [-0.95, 51.45], [-1.8, 51.55], [-2.6, 51.5], [-3.0, 51.58], [-3.2, 51.5], [-3.95, 51.62]],
  M62: [[-2.95, 53.4], [-2.6, 53.4], [-2.25, 53.5], [-1.8, 53.65], [-1.5, 53.75], [-0.35, 53.75]],
  M8: [[-4.25, 55.86], [-3.7, 55.9], [-3.2, 55.94]],
  A1M: [[-0.15, 51.6], [-0.2, 51.9], [-0.25, 52.55], [-0.6, 53.0], [-1.1, 53.5], [-1.35, 53.8], [-1.55, 54.5], [-1.6, 54.97]],
  M74: [[-4.2, 55.85], [-4.0, 55.75], [-3.45, 55.3], [-2.95, 54.9]],
  M25: Array.from({ length: 13 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [-0.12 + Math.cos(a) * 0.36, 51.5 + Math.sin(a) * 0.22]; }),
};
const ROUTES = {
  r1: [[-1.47, 53.38], [-1.3, 53.33], [-1.22, 52.93], [-1.12, 52.62], [-0.9, 52.24], [-0.76, 52.04]],
  r2: [[-0.76, 52.04], [-0.9, 52.24], [-1.15, 52.32], [-1.26, 52.37]],
  r3: [[-1.26, 52.37], [-1.15, 52.32], [-1.12, 52.62], [-1.22, 52.93], [-1.3, 53.33], [-1.47, 53.38]],
};

const feats = topojson.feature(topo, topo.objects.countries).features;
const byId = (id) => feats.find((f) => String(f.id) === id);
const uk = byId("826"), ie = byId("372"), iom = byId("833");
const ukPolys = uk.geometry.coordinates.filter((poly) => geoCentroid({ type: "Polygon", coordinates: poly })[1] < 59.7);
const gb = { type: "Feature", geometry: { type: "MultiPolygon", coordinates: ukPolys.concat(iom ? (iom.geometry.type === "Polygon" ? [iom.geometry.coordinates] : iom.geometry.coordinates) : []) } };
const proj = geoTransverseMercator().rotate([2, 0]).fitExtent([[250, 96], [720, 1104]], gb);
const path = geoPath(proj);
const line = d3line().curve(curveCatmullRom.alpha(0.6));
const pl = (pts) => line(pts.map((p) => proj(p)));
const r1 = (v) => Math.round(v * 10) / 10;
const depots = DEPOTS.map(([slug, label, lon, lat, side, dy]) => { const [x, y] = proj([lon, lat]); return { slug, label, x: r1(x), y: r1(y), side, dy: dy || 0, size: CITY_SIZE[slug] || 1 }; });
const others = OTHER_CITIES.map(([lon, lat, s]) => { const [x, y] = proj([lon, lat]); return { x: r1(x), y: r1(y), size: s }; });
const hills = HILLS.map(([lon, lat, r]) => { const [x, y] = proj([lon, lat]); return { x: r1(x), y: r1(y), r }; });
const S = depots.find((d) => d.slug === "sheffield");
const local = line([[S.x, S.y], [S.x + 16, S.y - 24], [S.x + 42, S.y - 32], [S.x + 54, S.y - 14], [S.x + 42, S.y + 2]]);
const round = (d) => d.replace(/-?\d+\.\d+/g, (m) => String(Math.round(Number(m) * 10) / 10));

const out = {
  land: round(path(gb)), ireland: round(path(ie)),
  depots, others, hills,
  motorways: Object.values(MOTORWAYS).map((m) => round(pl(m))),
  routes: { r1: round(pl(ROUTES.r1)), r2: round(pl(ROUTES.r2)), r3: round(pl(ROUTES.r3)), local: round(local) },
  house: [r1(S.x + 42), r1(S.y + 2)],
};
const ts = `/* Generated by node_modules/.gen-geo.mjs. UK geography for the map stage,
   projected to the 960 by 1200 canvas exactly as the Claude Design export's
   buildGeo() did (transverse Mercator, 2W, Shetland dropped, Isle of Man
   kept). Source: Natural Earth 1:50m via world-atlas. Regenerate rather
   than editing by hand. */

export interface DepotAnchor {
  slug: string;
  label: string;
  x: number;
  y: number;
  side: string;
  dy: number;
  size: number;
}

export const MAP_GEO = ${JSON.stringify(out, null, 2)} as const;
`;
fs.writeFileSync("src/courses/uk-delivery-network/intro/stage/map-geo.ts", ts);
console.log("written, size:", ts.length, "bytes; depots:", out.depots.length);
