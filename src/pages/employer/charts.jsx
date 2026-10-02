import { useState } from 'react'

/* The employer dashboard's line chart. Series colours (validated for colour-blind separation
   and contrast) live in employer.css as --ed-enrolled and --ed-submitted. */

const SERIES = [
  { key: 'enrolled', label: 'Signed up', className: 'is-enrolled' },
  { key: 'submitted', label: 'Finished', className: 'is-submitted' },
]

const shortDate = (key) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/* Running totals over time: everyone who has signed up, and everyone who has finished
   (handed in their project and video). Hover for any day. `compact` is the Overview's
   smaller version, without the table view. */
export function SignupsChart({ points, compact = false }) {
  const [hover, setHover] = useState(null)
  if (!points.length) return <p className="ed-muted">No sign-ups yet.</p>

  const W = compact ? 760 : 1180
  const H = compact ? 230 : 320
  const pad = { top: 22, right: compact ? 104 : 120, bottom: 30, left: 40 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const max = Math.max(1, ...points.map((p) => p.enrolled))
  const niceMax = Math.max(5, Math.ceil(max / 5) * 5)
  const x = (i) => pad.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2)
  const y = (v) => pad.top + innerH - (v / niceMax) * innerH
  const labelEvery = Math.max(1, Math.ceil(points.length / (compact ? 5 : 8)))
  const last = points[points.length - 1]

  function handleMove(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * W
    const index = Math.round(((px - pad.left) / innerW) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, index)))
  }
  const point = hover === null ? null : points[hover]

  return (
    <div className={`ed-chart${compact ? ' is-compact' : ''}`}>
      <ul className="ed-legend" aria-hidden="true">
        {SERIES.map((s) => <li key={s.key} className={s.className}>{s.label}</li>)}
      </ul>
      <div className="ed-chart-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`By ${shortDate(last.date)}: ${last.enrolled} signed up and ${last.submitted} finished`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          {[0, niceMax / 2, niceMax].map((t) => (
            <g key={t}>
              <line className="ed-grid" x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} />
              <text className="ed-axis" x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="central">{t}</text>
            </g>
          ))}
          <text className="ed-axis" x={pad.left - 8} y={pad.top - 10} textAnchor="end">Students</text>
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 ? (
              <text key={p.date} className="ed-axis" x={x(i)} y={H - 8} textAnchor="middle">{shortDate(p.date)}</text>
            ) : null,
          )}
          {SERIES.map((s) => (
            <g key={s.key} className={s.className}>
              <polyline className="ed-line" points={points.map((p, i) => `${x(i)},${y(p[s.key])}`).join(' ')} />
              <circle className="ed-dot" cx={x(points.length - 1)} cy={y(last[s.key])} r="4" />
              <text className="ed-direct" x={x(points.length - 1) + 10} y={y(last[s.key])} dominantBaseline="central">
                {last[s.key]} {s.label.toLowerCase()}
              </text>
            </g>
          ))}
          {point && (
            <g>
              <line className="ed-crosshair" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} />
              {SERIES.map((s) => (
                <circle key={s.key} className={`ed-dot ${s.className}`} cx={x(hover)} cy={y(point[s.key])} r="4" />
              ))}
            </g>
          )}
          <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="transparent" />
        </svg>
        {point && (
          <div
            className="ed-tooltip"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > points.length / 2 ? '-105%' : '5%'})` }}
          >
            <strong>{shortDate(point.date)}</strong>
            <span className="is-enrolled">{point.enrolled} signed up</span>
            <span className="is-submitted">{point.submitted} finished</span>
          </div>
        )}
      </div>
      {!compact && (
        <details className="ed-table-view">
          <summary>View as a table</summary>
          <table>
            <thead><tr><th scope="col">Date</th><th scope="col">Signed up</th><th scope="col">Finished</th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}><td>{shortDate(p.date)}</td><td>{p.enrolled}</td><td>{p.submitted}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}
