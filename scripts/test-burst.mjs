/* Headless physics validation across 50 seeds (Interlude Brief B, Part
   8). Run from the repo root:
   node --experimental-strip-types scripts/test-burst.mjs */
const { createBurst, PARTS, FLOOR, CX, BURST_DUR, SCENE_H } = await import(
  "../src/courses/ai-interlude/physics.ts"
);
let fail = 0;
for (let seed = 1; seed <= 50; seed++) {
  const b = createBurst(seed * 7919);
  PARTS.forEach((p, i) => {
    const rest = b.phys(i, BURST_DUR + 1);
    const x = CX + p.cx + rest.dx;
    const yTop = FLOOR + p.cy + rest.dy - p.h;
    const yContact = FLOOR + p.cy + p.h + rest.dy;
    const land = b.phys(i, BURST_DUR);
    if (!land.landed) { fail++; console.log(`seed ${seed} ${p.id}: not at rest by ${BURST_DUR}s`); }
    if (Math.abs(yContact - FLOOR) > 0.5) { fail++; console.log(`seed ${seed} ${p.id}: off the floor`); }
    if (x < 40 || x > 1560) { fail++; console.log(`seed ${seed} ${p.id}: off stage`); }
    if (yTop < SCENE_H * 0.45) { fail++; console.log(`seed ${seed} ${p.id}: in the text safe zone`); }
    if (p.id === "eye" && Math.abs(rest.rot % 360) > 0.5) { fail++; console.log(`seed ${seed}: eye not upright`); }
  });
}
console.log(fail === 0 ? "PASS: 50 seeds, all parts settle on stage, outside the text zone, eye upright" : `${fail} violations`);
process.exit(fail ? 1 : 0);
