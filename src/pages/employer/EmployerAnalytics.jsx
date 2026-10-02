import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router'
import EmployerFrame, { useEmployerData } from './EmployerFrame.jsx'
import { SignupsChart } from './charts.jsx'
import { breakdown, goalLabel, overviewStats, sectorLabel, stageLabel, timeline } from '../../employer/stats.js'

const TOP_ROWS = 8
/* One answer from sign-up, counted across everyone enrolled, as labelled bars */
function Breakdown({ title, note, rows, total }) {
  const shown = rows.slice(0, TOP_ROWS)
  const rest = rows.slice(TOP_ROWS).reduce((sum, row) => sum + row.count, 0)
  const max = Math.max(1, ...shown.map((r) => r.count))
  return (
    <section className="ed-card ed-breakdown">
      <h2 className="ed-h2">{title}</h2>
      {note && <p className="ed-muted">{note}</p>}
      <ul>
        {shown.map((row) => (
          <li key={row.value}>
            <div className="ed-breakdown-row">
              <span>{row.label}</span>
              <span className="ed-num">{row.count}<span className="ed-muted"> · {Math.round((row.count / total) * 100)}%</span></span>
            </div>
            <div className="ed-meter" aria-hidden="true"><div style={{ width: `${(row.count / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="ed-muted ed-small">And {rest} more across {rows.length - TOP_ROWS} others.</p>}
    </section>
  )
}

export default function EmployerAnalytics() {
  const { slug } = useParams()
  const { omoship, students, now } = useEmployerData(slug)
  const total = students.length
  const stats = useMemo(() => overviewStats(students, now), [students, now])
  const points = useMemo(() => timeline(students, now), [students, now])
  const sections = useMemo(
    () => [
      { title: 'Studying at', note: 'Universities, plus students at school, college or on an apprenticeship.', rows: breakdown(students, (s) => s.university ?? stageLabel(s)) },
      { title: 'Subjects', note: 'Degree students only.', rows: breakdown(students, (s) => s.subject) },
      { title: 'Stage of education', rows: breakdown(students, (s) => s.stage, (v) => stageLabel({ stage: v })) },
      { title: 'Finishing study', rows: breakdown(students, (s) => s.graduationYear).sort((a, b) => a.value - b.value) },
      { title: 'Looking for', note: 'Each student picks up to three.', rows: breakdown(students, (s) => s.goals, goalLabel) },
      { title: 'Sectors of interest', note: 'Optional, up to three each.', rows: breakdown(students, (s) => s.sectors, sectorLabel) },
    ],
    [students],
  )

  if (!omoship) return <Navigate to="/portal" replace />

  return (
    <EmployerFrame title={`Analytics · ${omoship.title}`} omoship={omoship}>
      <div className="ed-head">
        <div>
          <span className="ed-eyebrow">Everyone enrolled</span>
          <h1 className="ed-h1">Analytics</h1>
          <p className="ed-lede">
            {total} students enrolled on {omoship.title}, described by what they told OMO when they signed up. Counts
            include students who haven’t submitted yet.
          </p>
        </div>
      </div>

      <section className="ed-card ed-growth" aria-labelledby="ed-signups-title">
        <div className="ed-growth-head">
          <div>
            <h2 id="ed-signups-title" className="ed-h2">Signed up and finished</h2>
            <p className="ed-muted">
              Running totals since the pilot opened: everyone who has signed up, and everyone who has finished by
              handing in their project and video. Hover to see any day.
            </p>
          </div>
          <dl className="ed-growth-figures">
            <div><dt>Finished</dt><dd>{stats.completionRate}%</dd></div>
            <div><dt>Median time to finish</dt><dd>{stats.medianDays === null ? '–' : `${stats.medianDays} days`}</dd></div>
          </dl>
        </div>
        <SignupsChart points={points} />
      </section>

      <div className="ed-breakdowns">
        {sections.map((section) => <Breakdown key={section.title} {...section} total={total} />)}
      </div>
    </EmployerFrame>
  )
}
