import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import logo from '../assets/omo-logo.png'
import { getCurrentUser, onSignedOut, signOut } from '../lib/auth.js'
import '../styles/portal.css'

const ROLE_LABELS = { student: 'Student', employer: 'Employer', admin: 'Admin' }

const INTROS = {
  student: 'This is your OMO home. Finish your profile so employers can find you.',
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

export default function Portal() {
  const navigate = useNavigate()
  const [user, setUser] = useState() // undefined while loading, null when signed out
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    document.title = 'Portal — OMO'
  }, [])

  useEffect(() => {
    let current = true
    getCurrentUser()
      .then((found) => {
        if (current) setUser(found)
      })
      .catch((error) => {
        if (current) setLoadError(error.message)
      })
    return () => {
      current = false
    }
  }, [])

  // Leave if the session ends elsewhere (signed out in another tab, expired login)
  useEffect(() => onSignedOut(() => navigate('/login', { replace: true })), [navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (loadError) {
    return (
      <div className="portal">
        <main className="portal-main">
          <h1>Something went wrong</h1>
          <p className="portal-intro">We couldn’t load your account. {loadError}</p>
          <button type="button" className="portal-signout portal-error-action" onClick={handleSignOut}>
            Sign out
          </button>
        </main>
      </div>
    )
  }
  if (user === undefined) return <div className="portal" aria-busy="true" />
  if (user === null) return <Navigate to="/login" replace />

  const firstName = user.fullName?.trim().split(/\s+/)[0] || user.email

  return (
    <div className="portal">
      <header className="portal-header">
        <Link to="/">
          <img className="portal-logo" src={logo} alt="OMO" />
        </Link>
        <div className="portal-user">
          <span className="portal-email">{user.email}</span>
          <button type="button" className="portal-signout" onClick={handleSignOut}>Sign out</button>
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
              <DetailsCard title="Your profile" fields={STUDENT_FIELDS} values={user.details} />
              <PlaceholderCard title="OMOships">Live OMOships will appear here.</PlaceholderCard>
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
              <PlaceholderCard title="Accounts">Student and employer accounts will be listed here.</PlaceholderCard>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
