import { Navigate, useParams } from 'react-router'
import EmployerFrame, { dashboardPath, useEmployerData } from './EmployerFrame.jsx'
import { INTRO_QUESTIONS } from '../../employer/sampleData.js'
import {
  daysToSubmit,
  fullName,
  goalLabel,
  initials,
  rankCandidates,
  sectorLabel,
  stageLabel,
  totalScore,
} from '../../employer/stats.js'

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/* A link to the student's work. Sample data has no real files, so it shows the address without linking. */
function WorkLink({ href, children, isSample }) {
  if (!href) return <span className="ed-btn is-disabled" aria-disabled="true">{children}</span>
  if (isSample) {
    return (
      <span className="ed-btn is-disabled" title="Sample data: no real file" aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <a className="ed-btn" href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noreferrer">
      {children} ↗
    </a>
  )
}

function ScoreCard({ title, score, feedback, children }) {
  return (
    <section className="ed-card ed-score-card">
      <div className="ed-score-head">
        <h2 className="ed-h2">{title}</h2>
        <span className="ed-score">{score}<span>/50</span></span>
      </div>
      <div className="ed-meter" aria-hidden="true"><div style={{ width: `${(score / 50) * 100}%` }} /></div>
      <div className="ed-feedback">
        <span className="ed-label">OMO feedback</span>
        <p>{feedback}</p>
      </div>
      {children}
    </section>
  )
}

export default function EmployerCandidate() {
  const { slug, id } = useParams()
  const { omoship, students, isSample } = useEmployerData(slug)
  const ranked = rankCandidates(students)
  const student = ranked.find((s) => s.id === id)

  if (!omoship) return <Navigate to="/portal" replace />
  if (!student) return <Navigate to={dashboardPath(omoship.slug)} replace />

  const { submission } = student
  const days = daysToSubmit(student)
  const studying = [student.university, student.subject].filter(Boolean).join(' · ') || stageLabel(student)

  return (
    <EmployerFrame
      title={fullName(student)}
      omoship={omoship}
      back={{ to: dashboardPath(omoship.slug), label: 'Ranked leaderboard' }}
    >

      <section className="ed-card ed-person">
        <div className="ed-avatar" aria-hidden="true">{initials(student)}</div>
        <div className="ed-person-main">
          <h1 className="ed-h1">{fullName(student)}</h1>
          <p className="ed-person-meta">
            {studying} · {stageLabel(student)} ·{' '}
            {student.stage === 'graduated' ? `Graduated ${student.graduationYear}` : `Finishes ${student.graduationYear}`}
          </p>
        </div>
        <div className="ed-person-scores">
          <div>
            <span className="ed-stat-label">Total score</span>
            <span className="ed-big-num">{totalScore(student)}<span>/100</span></span>
          </div>
          <div className="ed-divider" aria-hidden="true" />
          <div>
            <span className="ed-stat-label">Rank</span>
            <span className="ed-big-num">{student.rank}<span>/{ranked.length}</span></span>
          </div>
        </div>
        <div className="ed-person-actions">
          <WorkLink href={student.hasCv ? 'cv' : null} isSample={isSample}>{student.hasCv ? 'View CV' : 'No CV uploaded'}</WorkLink>
          <WorkLink href={student.linkedin} isSample={isSample}>{student.linkedin ? 'LinkedIn' : 'No LinkedIn'}</WorkLink>
        </div>
      </section>

      <div className="ed-two">
        <ScoreCard title="The project" score={submission.projectScore} feedback={submission.projectFeedback}>
          <div className="ed-work-row">
            <span className="ed-muted">GitHub repository</span>
            <WorkLink href={submission.repoUrl} isSample={isSample}>{submission.repoUrl}</WorkLink>
          </div>
        </ScoreCard>
        <ScoreCard title="The video" score={submission.videoScore} feedback={submission.videoFeedback}>
          <div className="ed-work-row">
            <span className="ed-muted">Two-minute explanation</span>
            <WorkLink href={submission.videoUrl} isSample={isSample}>Watch on Google Drive</WorkLink>
          </div>
        </ScoreCard>
      </div>

      <div className="ed-two">
        <section className="ed-card">
          <h2 className="ed-h2">Through the OMOship</h2>
          <dl className="ed-facts">
            <div><dt>Enrolled</dt><dd>{formatDate(student.enrolledAt)}</dd></div>
            <div><dt>Submitted</dt><dd>{formatDate(submission.submittedAt)}</dd></div>
            <div><dt>Time taken</dt><dd>{days} {days === 1 ? 'day' : 'days'}</dd></div>
            <div>
              <dt>Network quiz</dt>
              <dd>
                {student.introCorrect == null ? 'Not recorded' : `${student.introCorrect} of ${INTRO_QUESTIONS} right first time`}
              </dd>
            </div>
            <div><dt>Pathfinding algorithms</dt><dd>{student.pathfindingDone ? 'All five sorted' : 'Not finished'}</dd></div>
          </dl>
        </section>

        <section className="ed-card">
          <h2 className="ed-h2">About {student.firstName}</h2>
          {student.bio ? <p className="ed-bio">{student.bio}</p> : <p className="ed-muted">No bio added yet.</p>}
          <div className="ed-tag-group">
            <span className="ed-label">Looking for</span>
            <ul className="ed-tags">{student.goals.map((g) => <li key={g} className="is-accent">{goalLabel(g)}</li>)}</ul>
          </div>
          {student.sectors.length > 0 && (
            <div className="ed-tag-group">
              <span className="ed-label">Interested in</span>
              <ul className="ed-tags">{student.sectors.map((s) => <li key={s}>{sectorLabel(s)}</li>)}</ul>
            </div>
          )}
        </section>
      </div>
    </EmployerFrame>
  )
}
