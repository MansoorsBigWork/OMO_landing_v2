import { useEffect, useMemo } from 'react'
import { Navigate } from 'react-router'
import { PortalError, PortalHeader, usePortalUser } from '../components/PortalShell.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { markWelcomed } from '../lib/auth.js'
import { firstVisitGreeting, greeting } from '../lib/greeting.js'
import '../styles/portal.css'
import '../styles/omoships.css'

const LIVE = [
  {
    id: 'the-last-mile',
    title: 'The Last Mile: The UK’s Delivery Infrastructure',
    skills: ['Path-finding algorithms', 'GitHub', 'Programming'],
    progress: 0, // percent complete; static until progress is stored in the database
  },
]

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

/* A stylised delivery map: a depot, drop-off points and the shortest route between them */
function RouteMap() {
  return (
    <svg className="om-map" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="240" fill="#1B2140" />
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
        {[40, 80, 120, 160, 200].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />)}
        {[50, 100, 150, 200, 250, 300, 350].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" />)}
      </g>
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M0 150 L120 150 L200 80 L400 80" />
        <path d="M150 0 L150 240" />
        <path d="M260 240 L260 80" />
        <path d="M200 80 L300 190 L400 190" />
      </g>
      <path
        className="om-map-route"
        d="M60 150 L120 150 L200 80 L260 80 L260 160 L300 190 L350 190"
        stroke="#F26419" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 8" fill="none"
      />
      {[[200, 80], [260, 160], [150, 40]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="#fff" />
      ))}
      <rect x="48" y="138" width="24" height="24" rx="5" fill="#fff" />
      <circle cx="350" cy="190" r="11" fill="#F26419" />
      <circle cx="350" cy="190" r="4" fill="#fff" />
    </svg>
  )
}

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

function ProgressRing({ value }) {
  const percent = Math.min(100, Math.max(0, Math.round(value ?? 0)))
  const status = percent === 0 ? 'Not started' : percent === 100 ? 'Completed' : 'In progress'
  return (
    <div className="om-progress">
      <svg
        className="om-ring"
        viewBox="0 0 48 48"
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
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
        <text x="24" y="24" dominantBaseline="central" textAnchor="middle">{percent}%</text>
      </svg>
      <span className="om-progress-label">{status}</span>
    </div>
  )
}

function CardBody({ title, skills, progress, media }) {
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
        <ProgressRing value={progress} />
      </div>
    </>
  )
}

function LiveCard(omoship) {
  return (
    <article className="om-card">
      <CardBody {...omoship} media={<RouteMap />} />
    </article>
  )
}

function ComingSoonCard({ image, ...omoship }) {
  return (
    <article className="om-card om-card-soon" aria-label="OMOship coming soon">
      <div className="om-soon-blur" aria-hidden="true">
        <CardBody {...omoship} media={<img className="om-photo" src={image} alt="" />} />
      </div>
      <Spanner />
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
            <span className="om-count">{`${LIVE.length} live \u00B7 ${COMING_SOON.length} coming soon`}</span>
          </div>
          <div className="om-grid">
            {LIVE.map(({ id, ...omoship }) => <LiveCard key={id} {...omoship} />)}
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
