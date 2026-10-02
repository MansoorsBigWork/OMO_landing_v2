import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router'
import { PortalError, PortalHeader, usePortalUser } from '../components/PortalShell.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { omoships } from '../courses/index.ts'
import OmoshipTile, { courseStatus } from '../components/OmoshipTile.jsx'
import { loadCourseSummaries } from '../courses/shared/lib/progressStore.ts'
import { markWelcomed } from '../lib/auth.js'
import { firstVisitGreeting, greeting } from '../lib/greeting.js'
import '../styles/portal.css'
import '../styles/omoships.css'

/* Live OMOships come from the course registry in src/courses; each renders as an OmoshipTile */

// Teasers shown blurred behind a wrench until they're announced; the images are random placeholders
const COMING_SOON = [
  {
    id: 'green-grid',
    title: 'The Green Grid: Forecasting Britain’s Energy Demand',
    skills: ['Data analysis', 'Python', 'Forecasting'],
    image: 'https://picsum.photos/seed/omo-green-grid/800/480',
  },
  {
    id: 'high-street',
    title: 'Back to the High Street: Rethinking Local Retail',
    skills: ['Market research', 'UX design', 'Presenting'],
    image: 'https://picsum.photos/seed/omo-high-street/800/480',
  },
]

function Spanner() {
  return (
    <svg className="om-spanner" viewBox="-1 -1 26 26" aria-hidden="true">
      <path
        d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
        fill="#fff" stroke="#1A1A1A" strokeWidth="1.1" strokeLinejoin="round"
      />
    </svg>
  )
}

const RING_RADIUS = 20
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/* Milestones the database records for each course: enrolled, submitted, results released */
const MILESTONES = 3
function courseMilestone(summary) {
  if (summary?.submission?.status === 'released') return { done: 3, label: 'Results out' }
  if (summary?.submission) return { done: 2, label: 'Submitted' }
  if (summary?.enrolledAt) return { done: 1, label: 'In progress' }
  return { done: 0, label: 'Not started' }
}

function ProgressRing({ summary }) {
  const { done, label } = courseMilestone(summary)
  const percent = (done / MILESTONES) * 100
  return (
    <div className="om-progress">
      <svg
        className="om-ring"
        viewBox="0 0 48 48"
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={MILESTONES}
        aria-valuenow={done}
        aria-valuetext={`${label}, ${done} of ${MILESTONES} steps`}
      >
        <circle className="om-ring-track" cx="24" cy="24" r={RING_RADIUS} />
        <circle
          className={`om-ring-value${percent === 0 ? ' is-empty' : ''}`}
          cx="24"
          cy="24"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
        />
        <text x="24" y="24" dominantBaseline="central" textAnchor="middle">{done}/{MILESTONES}</text>
      </svg>
      <span className="om-progress-label">{label}</span>
    </div>
  )
}

function CardBody({ title, skills, summary, media }) {
  return (
    <>
      <div className="om-media">
        {media}
        <div className="om-skills">
          <span className="om-skills-label">Skills gained</span>
          <ul>
            {skills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </div>
      </div>
      <div className="om-body">
        <h3 className="om-title">{title}</h3>
        <ProgressRing summary={summary} />
      </div>
    </>
  )
}

function ComingSoonCard({ image, ...omoship }) {
  return (
    <article className="om-card om-card-soon" aria-label="OMOship coming soon">
      <div className="om-soon-blur" aria-hidden="true">
        <CardBody {...omoship} media={<img className="om-photo" src={image} alt="" />} />
      </div>
      <div className="om-soon-overlay">
        <Spanner />
      </div>
    </article>
  )
}

const FOOTER_LINKS = [
  { href: 'mailto:buildingomo@gmail.com', label: 'Contact Us' },
  { to: '/privacypolicies', label: 'Privacy Policy' },
  { to: '/', label: 'OMO Home' },
]

function today() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function OMOships() {
  const { user, loadError, handleSignOut } = usePortalUser()

  useEffect(() => {
    document.title = 'OMOships — OMO'
  }, [])

  // No rubber-band bounce past the footer (trackpads, phones); other pages keep the default
  useEffect(() => {
    document.documentElement.classList.add('no-overscroll')
    return () => document.documentElement.classList.remove('no-overscroll')
  }, [])

  // Students still onboarding are about to be redirected, so their first visit hasn't happened yet
  const needsOnboarding = user?.role === 'student' && !user.onboardingCompleted
  const firstVisit = Boolean(user) && !user.welcomedAt && !needsOnboarding

  // Picked once per page load, so it doesn't change on re-render
  const heading = useMemo(
    () => (user === undefined ? '' : firstVisit ? firstVisitGreeting(user.firstName) : greeting(user?.firstName)),
    [user, firstVisit],
  )

  useEffect(() => {
    if (firstVisit) markWelcomed().catch(() => {})
  }, [firstVisit])

  // Where the student is with each course; tiles show "Not started" until this loads or if it fails
  const [summaries, setSummaries] = useState({})
  useEffect(() => {
    if (!user?.id) return
    let current = true
    loadCourseSummaries(user.id)
      .then((found) => {
        if (current) setSummaries(found)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [user?.id])

  if (loadError && !import.meta.env.DEV) return <PortalError message={loadError} onSignOut={handleSignOut} />
  if (user === undefined && !loadError) return <div className="portal" aria-busy="true" />
  // Local dev only: preview the page without signing in. Production still requires login.
  if (user === null && !import.meta.env.DEV) return <Navigate to="/login" replace />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return (
    <div className="portal om">
      <PortalHeader
        profile
        name={user ? user.fullName || user.firstName : 'Preview Student'}
        email={user?.email}
        onSignOut={handleSignOut}
      />

      <main className="portal-main om-main">
        <div className="om-intro">
          <p className="om-date">{today()}</p>
          <h1 className="om-greeting ph-no-capture">{heading || '\u00A0'}</h1>
        </div>

        <section aria-labelledby="om-section-title">
          <div className="om-section-head">
            <h2 id="om-section-title">OMOSHIPS</h2>
            <span className="om-count">{`${omoships.length} live \u00B7 ${COMING_SOON.length} coming soon`}</span>
          </div>
          <div className="om-grid">
            {omoships.map((course) => (
              <OmoshipTile
                key={course.slug}
                course={course}
                status={courseStatus(summaries[course.slug])}
                enrolled={Boolean(summaries[course.slug]?.enrolledAt)}
              />
            ))}
            {COMING_SOON.map(({ id, ...omoship }) => <ComingSoonCard key={id} {...omoship} />)}
          </div>
        </section>
      </main>

      <footer className="om-footer">
        <SiteFooter links={FOOTER_LINKS} />
      </footer>
    </div>
  )
}
