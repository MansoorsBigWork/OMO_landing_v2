import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import EmployerFrame, { dashboardPath, useEmployerData } from './EmployerFrame.jsx'
import OmoshipCard from './OmoshipCard.jsx'
import { SignupsChart } from './charts.jsx'
import { omoships } from '../../courses/index.ts'
import {
  HIRING_GOALS,
  RECENT_DAYS,
  TOP_PICKS,
  TOP_SCORE,
  candidateFilters,
  candidatesCsv,
  fullName,
  goalLabel,
  overviewStats,
  rankCandidates,
  recentStats,
  scoreBands,
  shortStage,
  timeline,
  totalScore,
} from '../../employer/stats.js'
import { INTRO_QUESTIONS } from '../../employer/sampleData.js'

function Stat({ label, value, note }) {
  return (
    <div className="ed-card ed-stat">
      <span className="ed-stat-label">{label}</span>
      <span className="ed-stat-value">{value ?? '–'}</span>
      {note && <span className="ed-stat-note">{note}</span>}
    </div>
  )
}

/* A share as a ring: the arc is `part` of `whole`, the number inside is `part` */
function Ring({ label, part, whole, note }) {
  const radius = 34
  const length = 2 * Math.PI * radius
  const share = whole ? Math.min(1, part / whole) : 0
  return (
    <div className="ed-ring">
      <svg viewBox="0 0 80 80" role="img" aria-label={`${label}: ${part}${note ? `, ${note}` : ''}`}>
        <circle className="ed-ring-track" cx="40" cy="40" r={radius} />
        {share > 0 && (
          <circle
            className="ed-ring-value"
            cx="40"
            cy="40"
            r={radius}
            strokeDasharray={length}
            strokeDashoffset={length * (1 - share)}
          />
        )}
        <text x="40" y="40" dominantBaseline="central" textAnchor="middle">{part}</text>
      </svg>
      <span className="ed-ring-label">{label}</span>
      {note && <span className="ed-stat-note">{note}</span>}
    </div>
  )
}

function Highlight({ value, title, children, accent }) {
  return (
    <div className="ed-card ed-highlight">
      <span className={`ed-highlight-value${accent ? ' is-accent' : ''}`}>{value}</span>
      <div>
        <span className="ed-highlight-title">{title}</span>
        <span className="ed-highlight-body">{children}</span>
      </div>
    </div>
  )
}

function ScoreDistribution({ students, graded }) {
  const bands = scoreBands(students)
  const max = Math.max(1, ...bands.map((b) => b.count))
  return (
    <section className="ed-card ed-side-card">
      <h2 className="ed-h2">Score distribution</h2>
      <p className="ed-muted">{graded} graded submissions, total out of 100</p>
      <div className="ed-bars" role="img" aria-label={bands.map((b) => `${b.label}: ${b.count}`).join(', ')}>
        {bands.map((band) => (
          <div key={band.label} className="ed-bar-col">
            <span className="ed-bar-count">{band.count}</span>
            <div className={`ed-bar${band.top ? ' is-top' : ''}`} style={{ height: `${(band.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="ed-bar-labels" aria-hidden="true">
        {bands.map((band) => <span key={band.label}>{band.label}</span>)}
      </div>
    </section>
  )
}

function downloadCsv(ranked) {
  const blob = new Blob([`﻿${candidatesCsv(ranked)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: 'omoship-leaderboard.csv' })
  link.click()
  URL.revokeObjectURL(url)
}

export default function EmployerOverview() {
  const { slug } = useParams()
  const { omoship, students, now } = useEmployerData(slug)
  const stats = useMemo(() => overviewStats(students, now), [students, now])
  const recent = useMemo(() => recentStats(students, now), [students, now])
  const ranked = useMemo(() => rankCandidates(students), [students])
  const filters = useMemo(() => candidateFilters(stats.soonYear), [stats.soonYear])
  const [filterKey, setFilterKey] = useState('all')
  const filter = filters.find((f) => f.key === filterKey) ?? filters[0]
  const shown = ranked.filter(filter.test)
  const points = useMemo(() => timeline(students, now), [students, now])
  const course = omoships.find((c) => c.slug === omoship?.slug)

  if (!omoship) return <Navigate to="/portal" replace />

  function showFilter(key) {
    setFilterKey(key)
    document.getElementById('ed-leaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <EmployerFrame title={omoship.title} omoship={omoship}>
      <div className="ed-head">
        <div>
          <span className="ed-eyebrow">Dashboard</span>
          <h1 className="ed-h1">{omoship.title}</h1>
        </div>
        <button type="button" className="ed-btn ed-btn-primary" onClick={() => downloadCsv(shown)}>
          Download leaderboard (CSV)
        </button>
      </div>

      <div className="ed-layout">
        <div className="ed-layout-main">
          <section className="ed-card ed-rings" aria-label="Where students are">
            <Ring label="Enrolled" part={stats.enrolled} whole={stats.enrolled} note="Students on the OMOship" />
            <Ring label="Submitted" part={stats.submitted} whole={stats.enrolled} note={`${stats.completionRate}% of enrolled`} />
            <Ring
              label="Graded"
              part={stats.graded}
              whole={stats.submitted}
              note={stats.awaiting ? `${stats.awaiting} awaiting marks` : 'All marked'}
            />
          </section>

          <div className="ed-stats">
            <Stat label="Average score" value={stats.average} note="Out of 100" />
            <Stat label="Universities" value={stats.universities} note="Plus colleges and apprentices" />
            <Stat label="Subjects" value={stats.subjects} note="Not only engineering" />
          </div>

          <section aria-labelledby="ed-recent-title" className="ed-recent">
            <div className="ed-recent-head">
              <h2 id="ed-recent-title" className="ed-label">In the last {RECENT_DAYS} days</h2>
              <span className="ed-muted">{recent.enrolled} new enrolments</span>
            </div>
            <div className="ed-highlights">
              <Highlight value={recent.topScorers} title={`Scored ${TOP_SCORE} or above`} accent>
                Results released in the last {RECENT_DAYS} days.
              </Highlight>
              <Highlight value={recent.finishingSoon} title={`Finishing study by ${recent.soonYear}`}>
                Newly graded, ready for your next intake.
              </Highlight>
              <Highlight value={recent.medianDays === null ? '–' : `${recent.medianDays}d`} title="Median time to submit">
                For work handed in recently.
              </Highlight>
            </div>
          </section>

          <section className="ed-card ed-chart-card" aria-labelledby="ed-signups-title">
            <div className="ed-card-head">
              <h2 id="ed-signups-title" className="ed-h2">Signed up and finished</h2>
              <Link className="ed-text-link" to={`${dashboardPath(omoship.slug)}/analytics`}>Full analytics →</Link>
            </div>
            <SignupsChart points={points} compact />
          </section>

          <section className="ed-card ed-pipeline" aria-labelledby="ed-pipeline-title">
            <div className="ed-pipeline-intro">
              <h2 id="ed-pipeline-title" className="ed-label">What they’re looking for</h2>
              <p className="ed-muted">Chosen by each graded student at sign-up. Click one to filter the leaderboard.</p>
            </div>
            <div className="ed-pipeline-grid">
              {HIRING_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={`ed-pipe${filterKey === goal ? ' is-active' : ''}`}
                  onClick={() => showFilter(goal)}
                  aria-pressed={filterKey === goal}
                >
                  <span className="ed-pipe-value">{stats.goals[goal]}</span>
                  <span className="ed-pipe-title">{goalLabel(goal)}</span>
                </button>
              ))}
            </div>
          </section>

          <section id="ed-leaderboard" className="ed-card ed-table-card" aria-labelledby="ed-leaderboard-title">
            <div className="ed-table-head">
              <h2 id="ed-leaderboard-title" className="ed-h2">Ranked leaderboard</h2>
              <p className="ed-muted">
                Sorted by total score, with the top {TOP_PICKS} highlighted. Click a name to see their work, feedback and
                profile.
              </p>
              <ol className="ed-funnel" aria-label="Funnel">
                <li><strong>{stats.enrolled}</strong> enrolled</li>
                <li><strong>{stats.submitted}</strong> submitted</li>
                <li><strong>{stats.graded}</strong> graded</li>
                <li><strong className="is-accent">{stats.topScorers}</strong> scored {TOP_SCORE}+</li>
              </ol>
              <div className="ed-chips" role="group" aria-label="Filter the leaderboard">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`ed-chip${f.key === filterKey ? ' is-active' : ''}`}
                    onClick={() => setFilterKey(f.key)}
                    aria-pressed={f.key === filterKey}
                  >
                    {f.key === 'all' ? `All ${ranked.length}` : f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ed-table-scroll">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Name</th>
                    <th scope="col">Studying at</th>
                    <th scope="col">Subject</th>
                    <th scope="col" className="is-num">Finishes</th>
                    <th scope="col" className="is-num">Quiz</th>
                    <th scope="col" className="is-num">Project /50</th>
                    <th scope="col" className="is-num">Video /50</th>
                    <th scope="col" className="is-num">Total /100</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} className={s.rank <= TOP_PICKS ? 'is-top' : undefined}>
                      <td className="is-num is-muted">{s.rank}</td>
                      <td>
                        <Link className="ed-name" to={`${dashboardPath(omoship.slug)}/candidates/${s.id}`}>{fullName(s)}</Link>
                      </td>
                      <td>{s.university ?? shortStage(s)}</td>
                      <td className="is-muted">{s.subject ?? '–'}</td>
                      <td className="is-num">{s.graduationYear}</td>
                      <td className="is-num">{s.introCorrect == null ? '–' : `${s.introCorrect}/${INTRO_QUESTIONS}`}</td>
                      <td className="is-num">{s.submission.projectScore}</td>
                      <td className="is-num">{s.submission.videoScore}</td>
                      <td className="is-num is-total">{totalScore(s)}</td>
                    </tr>
                  ))}
                  {!shown.length && (
                    <tr><td colSpan={9} className="ed-empty">No graded candidates match this filter yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="ed-table-foot">
              <span>Showing {shown.length} of {ranked.length} on the leaderboard</span>
              <span className="ed-muted">Quiz: questions right first time on the parcel’s journey.</span>
            </p>
          </section>
        </div>

        <aside className="ed-layout-side">
          {course && <OmoshipCard course={course} />}
          <section className="ed-card ed-side-card">
            <h2 className="ed-h2">How every score is built</h2>
            <div className="ed-rubric">
              <div className="ed-rubric-row"><span>The project</span><span className="ed-num">50</span></div>
              <p>
                Their GitHub repository: a planner that assigns, routes and replans a day of deliveries, run against
                normal and disrupted days. On-time parcels count first, then kilometres driven.
              </p>
            </div>
            <div className="ed-rubric">
              <div className="ed-rubric-row"><span>The video</span><span className="ed-num">50</span></div>
              <p>A two-minute video talking through what they built and why, for a non-technical audience.</p>
            </div>
            <p className="ed-muted ed-small">Both are marked by OMO, with written feedback on each.</p>
          </section>
          <ScoreDistribution students={students} graded={stats.graded} />
        </aside>
      </div>

    </EmployerFrame>
  )
}
