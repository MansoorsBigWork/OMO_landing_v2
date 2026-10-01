/* The authored timeline of the map stage, ported from the Claude Design
   export (Map Stage Brief A). Nine scenes in authored seconds; the whole
   piece is a pure function of T, so the catch-up playhead can run it
   forward or backward at its natural speed. */

export interface Scene {
  name: string;
  dur: number;
  desc: string;
}

export const SCENES: Scene[] = [
  { name: "K0", dur: 3, desc: "The quiet UK map: 17 depot dots, no routes, no clock" },
  { name: "K1", dur: 3.5, desc: "21:14, Sheffield lights up and the Order placed card appears" },
  { name: "K2", dur: 4, desc: "The dashed order line draws Sheffield to Milton Keynes; MK lights up" },
  { name: "K3", dur: 3.5, desc: "The parcel marker pops in at Milton Keynes; picked and packed" },
  { name: "K4", dur: 5, desc: "18:10, marker nudges to the depot side; Collected, then the amber Re-rated alert" },
  { name: "K5", dur: 5, desc: "23:40, dusk tint; the night trunk draws up the M1 to Rugby with the truck" },
  { name: "K6", dur: 3.5, desc: "01:10, the marker sits at Rugby; the hub ring pulses; Sorted" },
  { name: "K7", dur: 7, desc: "06:45, morning trunk to Sheffield, then the local van loop to the house; Delivered" },
  { name: "K8", dur: 5, desc: "Cards clear, unused depots fade, four stat cards land bottom-right" },
];

/* Scene start times. */
export const CUES: Record<string, number> = (() => {
  const cues: Record<string, number> = {};
  let acc = 0;
  for (const s of SCENES) {
    cues[s.name] = acc;
    acc += s.dur;
  }
  return cues;
})();

export const TOTAL_SECONDS = SCENES.reduce((a, s) => a + s.dur, 0);

/* A reading section targets the END of its scene, so arriving at a
   section plays that scene through and settles on its finished state. */
export function sceneEnd(name: string): number {
  const scene = SCENES.find((s) => s.name === name);
  return scene ? CUES[name] + scene.dur : 0;
}

export function sceneAt(t: number): string {
  let current = SCENES[0].name;
  for (const s of SCENES) {
    if (CUES[s.name] <= t) current = s.name;
  }
  return current;
}
