import { useEffect } from 'react'
import { Navigate, useOutletContext } from 'react-router'
import { PortalHeader } from '../components/PortalShell.jsx'
import { landingPathFor } from '../lib/auth.js'
import '../styles/portal.css'

const ROLE_LABELS = { employer: 'Employer', admin: 'Admin' }

const INTROS = {
  employer: 'Manage your company details and, once youâ€™re verified, find students for your OMOships.',
  admin: 'Review employers waiting for approval and manage accounts.',
}

// [column in Supabase, label, optional display format]
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
  const { user, signOut } = useOutletContext() // RequireAuth has already loaded a signed-in user

  useEffect(() => {
    document.title = 'Portal â€” OMO'
  }, [])

  // Students only ever see their dashboard (or onboarding); this page is for employers and admins
  if (user.role === 'student') return <Navigate to={landingPathFor(user)} replace />

  const firstName = user.firstName || user.fullName?.trim().split(/\s+/)[0]

  return (
    <div className="portal">
      <PortalHeader email={user.email} onSignOut={signOut} />

      <main className="portal-main">
        <span className="portal-tag">{`// ${ROLE_LABELS[user.role] ?? 'OMO'} portal`}</span>
        <h1 className="ph-no-capture">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
        <p className="portal-intro">{INTROS[user.role]}</p>

        {user.role === 'employer' && !user.isVerified && (
          <div className="portal-notice" role="status">
            <strong>Your account is pending verification.</strong>
            We check every employer by hand and will email you once youâ€™re approved. Until then, student profiles
            stay hidden.
          </div>
        )}

        <div className="portal-grid">
          {user.role === 'employer' && (
            <>
              <DetailsCard title="Company details" fields={EMPLOYER_FIELDS} values={user.details} />
              <PlaceholderCard title="Students">
                Once youâ€™re verified, youâ€™ll be able to browse student profiles here.
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
