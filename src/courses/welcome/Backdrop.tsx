/* Decorative delivery-network backdrop for the slideshow: faint dashed
   routes between depot dots, a hub with soft rings, and one parcel
   drifting along its route. Pure decoration: aria-hidden, no pointer
   events, quiet enough that text contrast is untouched. */

const ROUTE_TOP = "M -40 150 C 240 70, 520 190, 780 120 S 1260 60, 1500 150";
const ROUTE_BOTTOM = "M -40 760 C 300 830, 620 700, 940 790 S 1330 840, 1500 740";
const ROUTE_DRIFT = "M -60 240 C 340 150, 780 260, 1120 170 S 1400 120, 1560 190";

const DEPOTS: Array<[number, number]> = [
  [128, 118], [452, 148], [780, 120], [1108, 96], [1372, 128],
  [180, 792], [560, 742], [940, 790], [1268, 812],
];

const PARCELS: Array<[number, number]> = [
  [310, 128], [1230, 104], [740, 772],
];

export default function Backdrop() {
  return (
    <svg
      className="welcome-backdrop"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* Hub, top right */}
      <g fill="none">
        <circle cx="1372" cy="128" r="40" fill="var(--omo-blue-tint)" opacity="0.55" />
        <circle cx="1372" cy="128" r="40" stroke="var(--omo-canvas-shade)" strokeWidth="1.6" />
        <circle cx="1372" cy="128" r="72" stroke="var(--omo-canvas-shade)" strokeWidth="1.3" opacity="0.65" />
        <circle cx="1372" cy="128" r="104" stroke="var(--omo-canvas-shade)" strokeWidth="1" opacity="0.4" />
        <circle cx="1372" cy="128" r="5.5" fill="var(--omo-blue)" opacity="0.55" />
      </g>

      {/* Routes */}
      <path d={ROUTE_TOP} className="backdrop-route" />
      <path d={ROUTE_BOTTOM} className="backdrop-route" />
      <path d={ROUTE_DRIFT} className="backdrop-route is-active" />

      {/* Depot dots */}
      {DEPOTS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          fill="var(--omo-canvas)"
          stroke="var(--omo-canvas-shade)"
          strokeWidth="2"
        />
      ))}

      {/* Resting parcels */}
      {PARCELS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} stroke="var(--omo-canvas-shade)" fill="none" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M-9 -4.5 L0 -9 L9 -4.5 V5 L0 9.5 L-9 5 Z" />
          <path d="M-9 -4.5 L0 0 L9 -4.5 M0 0 V9.5" opacity="0.7" />
        </g>
      ))}

      {/* The one moving parcel, drifting along its route */}
      <g className="backdrop-drifter">
        <rect x="-6" y="-6" width="12" height="12" rx="3" fill="var(--omo-blue-tint)" stroke="var(--omo-blue)" strokeWidth="1.5" opacity="0.8" />
      </g>
    </svg>
  );
}
