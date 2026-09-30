import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import logo from '../assets/omo-logo.png'
import { coursePath, omoships } from '../courses/index.ts'
import { loadCourseSummaries } from '../courses/shared/lib/progressStore.ts'
import '../styles/portal.css'

const ROLE_LABELS = { student: 'Student', employer: 'Employer', admin: 'Admin' }

const INTROS = {
  student: 'This is your OMO home. Pick an OMOship to start, or carry on where you left off.',
  employer: 'Manage your company details and, once you’re verified, find students for your OMOships.',
  admin: 'Review employers waiting for approval and manage accounts.',
}

// [column in Supabase, label, optional display format]
const STUDENT_FIELDS = [
  ['university', 'University'],
  ['course', 'Course'],
  ['graduation_year', 'Graduation year'],
  ['bio', 'Bio'],
  ['linkedin_url', 'LinkedIn'],
  ['cv_path', 'CV', () => 'Uploaded'],
]
const EMPLOYER_FIELDS = [
  ['company_name', 'Company name'],
  ['website', 'Website'],
  ['job_title', 'Your job title'],
]

function DetailsCard({ title, fields, values }) {
  return (
    <section className="portal-card">
      <h2>{title}</h2>
      <dl className="portal-details">
        {fields.map(([key, label, format]) => {
          const value = values[key]
          const hasValue = value !== null && value !== undefined && value !== ''
          return (
            <div key={key}>
              <dt>{label}</dt>
              <dd className={hasValue ? undefined : 'is-empty'}>
                {hasValue ? (format ? format(value) : value) : 'Not added yet'}
              </dd>
            </div>
          )
        })}
      </dl>
      <button type="button" className="portal-btn" disabled>Edit (coming soon)</button>
    </section>
  )
}

function PlaceholderCard({ title, children }) {
  return (
    <section className="portal-card portal-card-placeholder">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  )
}

// What a student sees next to each course: where they are with it
function courseStatus(summary) {
  if (!summary?.enrolledAt) return { key: 'new', label: 'Not started' }
  if (summary.submission?.status === 'released') return { key: 'graded', label: 'Results out' }
  if (summary.submission) return { key: 'submitted', label: 'Submitted' }
  return { key: 'active', label: 'In progress' }
}

function OmoshipsCard({ userId }) {
  const [summaries, setSummaries] = useState(null) // null while loading
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    loadCourseSummaries(userId)
      .then((found) => {
        if (current) setSummaries(found)
      })
      .catch((err) => {
        if (current) setError(err.message)
      })
    return () => {
      current = false
    }
  }, [userId])

  return (
    <section className="portal-card">
      <h2>OMOships</h2>
      <ul className="portal-courses">
        {omoships.map((course) => {
          const summary = summaries?.[course.slug]
          const status = summaries ? courseStatus(summary) : null
          return (
            <li key={course.slug}>
              <div className="portal-course-text">
                <strong>{course.title}</strong>
                <span>{course.strapline}</span>
              </div>
              <div className="portal-course-actions">
                {status && <span className={`portal-status is-${status.key}`}>{status.label}</span>}
                <Link className="portal-btn portal-btn-primary" to={coursePath(course.slug)}>
                  {summary?.enrolledAt ? 'Continue' : 'View OMOship'}
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
      {error && <p className="portal-card-error">We couldn’t load your progress. {error}</p>}
    </section>
  )
}

export default function Portal() {
  const { user, signOut } = useOutletContext()

  useEffect(() => {
    document.title = 'Portal — OMO'
  }, [])

  const firstName = user.fullName?.trim().split(/\s+/)[0] || user.email

  return (
    <div className="portal">
      <header className="portal-header">
        <Link to="/">
          <img className="portal-logo" src={logo} alt="OMO" />
        </Link>
        <div className="portal-user">
          <span className="portal-email">{user.email}</span>
          <button type="button" className="portal-signout" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <main className="portal-main">
        <span className="portal-tag">{`// ${ROLE_LABELS[user.role] ?? 'OMO'} portal`}</span>
        <h1>Welcome, {firstName}</h1>
        <p className="portal-intro">{INTROS[user.role]}</p>

        {user.role === 'employer' && !user.isVerified && (
          <div className="portal-notice" role="status">
            <strong>Your account is pending verification.</strong>
            We check every employer by hand and will email you once you’re approved. Until then, student profiles
            stay hidden.
          </div>
        )}

        <div className="portal-grid">
          {user.role === 'student' && (
            <>
              <OmoshipsCard userId={user.id} />
              <DetailsCard title="Your profile" fields={STUDENT_FIELDS} values={user.details} />
            </>
          )}
          {user.role === 'employer' && (
            <>
              <DetailsCard title="Company details" fields={EMPLOYER_FIELDS} values={user.details} />
              <PlaceholderCard title="Students">
                Once you’re verified, you’ll be able to browse student profiles here.
              </PlaceholderCard>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <PlaceholderCard title="Employer verification">
                Employers waiting for approval will be listed here.
              </PlaceholderCard>
              <PlaceholderCard title="OMOship submissions">
                Submissions are marked with the mark_submission function in Supabase for now. A review screen will appear here.
              </PlaceholderCard>
              <PlaceholderCard title="Accounts">Student and employer accounts will be listed here.</PlaceholderCard>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
