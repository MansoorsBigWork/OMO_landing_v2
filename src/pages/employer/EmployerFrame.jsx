import { useEffect } from 'react'
import { Link, Navigate, NavLink, useOutletContext } from 'react-router'
import PortalBar from '../../components/PortalBar.jsx'
import SiteFooter from '../../components/SiteFooter.jsx'
import { landingPathFor } from '../../lib/auth.js'
import { SAMPLE_NOW, SAMPLE_OMOSHIP, SAMPLE_STUDENTS } from '../../employer/sampleData.js'
import '../../styles/portal.css'
import '../../styles/omoships.css'
import '../../styles/employer.css'

export const dashboardPath = (slug) => `/portal/dashboard/${slug}`

const FOOTER_LINKS = [
  { href: 'mailto:buildingomo@gmail.com', label: 'Contact Us' },
  { to: '/privacypolicies', label: 'Privacy Policy' },
  { to: '/', label: 'OMO Home' },
]

/* The employer's OMOships and their students. Sample data for now; real students will come
   from student_profiles, enrolments and submission_results, built into the same shape.
   `now` is the date the figures are measured to (fixed for the sample). */
export function useEmployerData(slug) {
  const omoship = slug && slug !== SAMPLE_OMOSHIP.slug ? null : SAMPLE_OMOSHIP
  return { omoship, students: SAMPLE_STUDENTS, now: SAMPLE_NOW, isSample: true }
}

/* Top bar and notices shared by every employer page; company details and log out are in the
   account menu. Inside an OMOship (`omoship`) the bar below holds its Overview / Analytics
   tabs, a back link sits above the page (to the OMOships unless `back` says otherwise) and
   the OMO footer closes it. Only employers get in. */
export default function EmployerFrame({ title, omoship, back, children }) {
  const { user, signOut } = useOutletContext() // RequireAuth has already loaded a signed-in user
  const { isSample } = useEmployerData()

  useEffect(() => {
    document.title = `${title} — OMO`
  }, [title])

  // No rubber-band pull past the top or bottom of the page (trackpads, phones)
  useEffect(() => {
    document.documentElement.classList.add('no-overscroll')
    return () => document.documentElement.classList.remove('no-overscroll')
  }, [])

  if (user.role !== 'employer') return <Navigate to={landingPathFor(user)} replace />

  const base = omoship && dashboardPath(omoship.slug)

  return (
    <div className="portal ed">
      <PortalBar user={user} onSignOut={signOut} />
      {omoship && (
        <nav className="ed-tabs" aria-label={omoship.title}>
          <div className="ed-tabs-inner">
            <NavLink to={base} end className="ed-tab">Overview</NavLink>
            <NavLink to={`${base}/analytics`} className="ed-tab">Analytics</NavLink>
            {isSample && <span className="ed-sample-tag">Sample data</span>}
          </div>
        </nav>
      )}

      <main className="ed-main">
        {!user.isVerified && (
          <p className="ed-notice" role="status">
            <strong>Your account is pending verification.</strong> We check every employer by hand and will email you
            once you’re approved.
          </p>
        )}
        {omoship && (
          <Link className="ed-back" to={back?.to ?? '/portal'}>← {back?.label ?? 'Your OMOships'}</Link>
        )}
        {children}
      </main>

      {omoship && (
        <footer className="om-footer">
          <SiteFooter links={FOOTER_LINKS} />
        </footer>
      )}
    </div>
  )
}
