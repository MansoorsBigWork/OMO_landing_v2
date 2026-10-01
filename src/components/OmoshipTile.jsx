import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { MAP_GEO } from '../courses/uk-delivery-network/intro/stage/map-geo.ts'
import { coursePath } from '../courses/index.ts'
import '../styles/omoship-tile.css'

/* The OMOship tile on the student portal: a live window onto the course's own
   UK map (the intro page's geography, cropped to the Midlands and the North),
   with the title, the two facts a student weighs first, where they are up to,
   and the way in. Idle, the national hub pulses. On hover a glare crosses the
   map (react-bits GlareHover), the trunk routes draw on and a parcel rides
   them. Reduced motion and touch get the finished map. */

const VIEW = { x: 330, y: 555, w: 400, h: 330 } // the window onto the 960 by 1200 stage
const NAMED = { sheffield: 'Sheffield', 'milton-keynes': 'Milton Keynes', rugby: 'National hub', london: 'London' }
const LABEL_LIFT = { rugby: -9 } // keeps the hub's label clear of the route that leaves it
const HUB = MAP_GEO.depots.find((d) => d.slug === 'rugby')

const RIDE_PATH = MAP_GEO.routes.r3 // Sheffield to the hub, the longer trunk leg

/* Where the student is with a course, from its enrolment and submission rows */
export function courseStatus(summary) {
  if (!summary?.enrolledAt) return { key: 'new', label: 'Not started' }
  if (summary.submission?.status === 'released') return { key: 'graded', label: 'Results out' }
  if (summary.submission) return { key: 'submitted', label: 'Submitted' }
  return { key: 'active', label: 'In progress' }
}

const PARCEL_DELAY_MS = 350 // the routes start drawing first
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OmoshipTile({ course, status, enrolled }) {
  const ride = useRef(null) // the SMIL animateMotion element
  const rideTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(rideTimer.current), [])

  function startRide() {
    if (reducedMotion()) return
    window.clearTimeout(rideTimer.current)
    rideTimer.current = window.setTimeout(() => ride.current?.beginElement?.(), PARCEL_DELAY_MS)
  }

  function rest() {
    window.clearTimeout(rideTimer.current)
  }

  const cta = status?.key === 'graded' ? 'See your results' : enrolled ? course.enrol.continueLabel : 'View OMOship'
  const commitment = course.stats.find((s) => s.label === 'Commitment')?.value

  return (
    <article className="otile" onMouseEnter={startRide} onMouseLeave={rest}>
      <div className="otile-map" aria-hidden="true">
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          {/* Sea: three bathymetry steps around the coast, as on the intro stage */}
          <path d={`${MAP_GEO.land} ${MAP_GEO.ireland}`} className="ot-bathy ot-bathy-1" />
          <path d={`${MAP_GEO.land} ${MAP_GEO.ireland}`} className="ot-bathy ot-bathy-2" />
          <path d={`${MAP_GEO.land} ${MAP_GEO.ireland}`} className="ot-bathy ot-bathy-3" />
          <path d={MAP_GEO.ireland} className="ot-land ot-land-ie" />
          <path d={MAP_GEO.land} className="ot-land" />
          {MAP_GEO.hills.map((h, i) => (
            <g key={i} transform={`rotate(-20 ${h.x} ${h.y})`}>
              <ellipse cx={h.x} cy={h.y} rx={h.r} ry={h.r * 0.78} className="ot-hill" />
              <ellipse cx={h.x + h.r * 0.1} cy={h.y - h.r * 0.05} rx={h.r * 0.52} ry={h.r * 0.4} className="ot-hill-2" />
            </g>
          ))}
          {MAP_GEO.motorways.map((d, i) => (
            <path key={`e${i}`} d={d} className="ot-motorway-edge" />
          ))}
          {MAP_GEO.motorways.map((d, i) => (
            <path key={`m${i}`} d={d} className="ot-motorway" />
          ))}
          <path d={MAP_GEO.land} className="ot-coast" />
          <path d={MAP_GEO.ireland} className="ot-coast ot-coast-ie" />

          {/* Trunk routes: drawn on hover, from the hub outwards */}
          <path d={MAP_GEO.routes.r3} pathLength="1" className="ot-route" />
          <path d={MAP_GEO.routes.r2} pathLength="1" className="ot-route ot-route-2" />

          {/* The hub's idle pulse */}
          {HUB && (
            <>
              <circle cx={HUB.x} cy={HUB.y} r="6" className="ot-pulse" />
              <circle cx={HUB.x} cy={HUB.y} r="6" className="ot-pulse ot-pulse-2" />
            </>
          )}

          {/* The parcel: an amber marker that rides the trunk route on hover */}
          <g className="ot-parcel">
            <circle r="5.5" />
            <animateMotion
              ref={ride}
              dur="2.4s"
              begin="indefinite"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.45 0 0.3 1"
              path={RIDE_PATH}
            />
          </g>

          {/* Depots, sized as the intro sizes them; the story's three are named */}
          {MAP_GEO.depots.map((d) => (
            <g key={d.slug} className={`ot-depot${NAMED[d.slug] ? ' is-named' : ''}`}>
              <circle cx={d.x} cy={d.y} r={2.4 + d.size * 1.1} />
              {NAMED[d.slug] && (
                <text x={d.x + (d.side === 'l' ? -9 : 9)} y={d.y + 3 + d.dy + (LABEL_LIFT[d.slug] ?? 0)} textAnchor={d.side === 'l' ? 'end' : 'start'}>
                  {NAMED[d.slug]}
                </text>
              )}
            </g>
          ))}
        </svg>
        <span className="ot-glare" />
        {status && <span className={`otile-status is-${status.key}`}>{status.label}</span>}
      </div>

      <div className="otile-body">
        <h3 className="otile-title">{course.title}</h3>
        <p className="otile-strap">{course.strapline}</p>
        <div className="otile-foot">
          <ul className="otile-meta">
            <li>{course.sector}</li>
            {commitment && <li>{commitment}</li>}
            <li>Remote</li>
          </ul>
          <Link className="otile-cta" to={enrolled ? `${coursePath(course.slug)}/continue` : coursePath(course.slug)}>
            {cta}
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}
