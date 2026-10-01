import { useEffect } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router'
import PortalBar from '../components/PortalBar.jsx'
import StudentProfileCard from '../components/StudentProfileCard.jsx'
import { landingPathFor } from '../lib/auth.js'
import '../styles/portal.css'

/* A student's profile page, reached from the account menu. Employers and admins
   have their details on the portal, so they are sent there. */
export default function Profile() {
  const { user, signOut, updateUser } = useOutletContext()

  useEffect(() => {
    document.title = 'Your profile — OMO'
  }, [])

  if (user.role !== 'student') return <Navigate to="/portal" replace />

  return (
    <div className="portal">
      <PortalBar user={user} onSignOut={signOut} />
      <main className="portal-main profile-main">
        <p className="profile-back">
          <Link to={landingPathFor(user)}>Back to your OMOships</Link>
        </p>
        <StudentProfileCard user={user} onSaved={updateUser} />
      </main>
    </div>
  )
}
