import { useEffect } from 'react'
import { Navigate, useOutletContext } from 'react-router'
import PortalBar from '../components/PortalBar.jsx'
import { landingPathFor } from '../lib/auth.js'
import EmployerHome from './employer/EmployerHome.jsx'
import '../styles/portal.css'

const ROLE_LABELS = { admin: 'Admin' }

const INTROS = {
  admin: 'Review employers waiting for approval and manage accounts.',
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
    document.title = 'Portal — OMO'
  }, [])

  // Students only ever see their dashboard (or onboarding); this page is for employers and admins
  if (user.role === 'student') return <Navigate to={landingPathFor(user)} replace />
  if (user.role === 'employer') return <EmployerHome />

  const firstName = user.firstName || user.fullName?.trim().split(/\s+/)[0]

  return (
    <div className="portal">
      <PortalBar user={user} onSignOut={signOut} />

      <main className="portal-main">
        <span className="portal-tag">{`// ${ROLE_LABELS[user.role] ?? 'OMO'} portal`}</span>
        <h1 className="ph-no-capture">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
        <p className="portal-intro">{INTROS[user.role]}</p>

        <div className="portal-grid">
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
