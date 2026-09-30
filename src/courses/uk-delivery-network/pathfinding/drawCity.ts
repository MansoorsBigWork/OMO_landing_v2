import type { CityGrid } from "./engine/types";

/* Paints the city onto a static canvas from the grid itself: building
   mass as the ground, streets as cream gaps, fast roads pale yellow,
   the congestion zone hatched amber, the river in banded water blues
   and the parks sage. One model drives both the picture and the graph,
   which is also far cheaper than thousands of SVG rects. Colours are
   the map palette from Map Stage Brief A. */

const C = {
  ground: "#E4E3DF",
  groundLine: "#DBDAD5",
  street: "#F5F3EC",
  fast: "#F2EBC8",
  fastEdge: "#E3DBB0",
  slowHatch: "rgba(232, 101, 10, 0.14)",
  water: "#D3DBEE",
  waterEdge: "#E4E8F3",
  park: "#C9D2B4",
  parkDark: "#B4BF9C",
};

export function drawCity(ctx: CanvasRenderingContext2D, grid: CityGrid): void {
  const { w, h, cell } = grid;
  const river = new Set(grid.river);
  const parks = new Set(grid.parks);

  /* Ground: building mass with a faint block texture */
  ctx.fillStyle = C.ground;
  ctx.fillRect(0, 0, w * cell, h * cell);
  ctx.strokeStyle = C.groundLine;
  ctx.lineWidth = 1;
  for (let y = 0; y < h * cell; y += cell * 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w * cell, y);
    ctx.stroke();
  }

  const paint = (id: number, colour: string, inset = 0) => {
    const x = (id % w) * cell;
    const y = Math.floor(id / w) * cell;
    ctx.fillStyle = colour;
    ctx.fillRect(x - inset, y - inset, cell + inset * 2, cell + inset * 2);
  };

  /* Water first, with a soft edge band */
  for (const id of river) paint(id, C.waterEdge, 2);
  for (const id of river) paint(id, C.water);

  /* Parks */
  for (const id of parks) paint(id, C.park);
  for (const id of parks) {
    const x = id % w;
    const y = Math.floor(id / w);
    if ((x * 7 + y * 13) % 19 === 0) paint(id, C.parkDark);
  }

  /* Streets: slight bleed so the network reads as connected lines */
  for (let id = 0; id < grid.cells.length; id++) {
    const code = grid.cells[id];
    if (code === 0) continue;
    paint(id, C.street, 0.5);
  }
  /* Fast roads over the top with an edge tint */
  for (let id = 0; id < grid.cells.length; id++) {
    if (grid.cells[id] === 2) paint(id, C.fastEdge, 1);
  }
  for (let id = 0; id < grid.cells.length; id++) {
    if (grid.cells[id] === 2) paint(id, C.fast, 0.5);
  }

  /* Congestion hatch over the zone's road cells */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(grid.zone.x * cell, grid.zone.y * cell, grid.zone.rx * cell, grid.zone.ry * cell, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = C.slowHatch;
  ctx.lineWidth = 3;
  const span = (w + h) * cell;
  for (let d = -span; d < span; d += 12) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + h * cell, h * cell);
    ctx.stroke();
  }
  ctx.restore();
}
