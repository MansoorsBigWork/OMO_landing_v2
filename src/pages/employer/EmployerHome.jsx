import { useState } from 'react'
import { useOutletContext } from 'react-router'
import EmployerFrame, { dashboardPath, useEmployerData } from './EmployerFrame.jsx'
import OmoshipTile from '../../components/OmoshipTile.jsx'
import { omoships } from '../../courses/index.ts'
import '../../styles/omoships.css'

const CONTACT = 'mailto:buildingomo@gmail.com?subject=Build%20our%20own%20OMOship'

/* The empty slot beside an employer's OMOships. Click it to find out about building one. */
function BuildCard() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button type="button" className="ed-build" onClick={() => setOpen(true)} aria-label="Build your own OMOship">
        <span className="ed-build-plus" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    )
  }

  return (
    <section className="ed-build is-open" aria-labelledby="ed-build-title">
      <h3 id="ed-build-title" className="ed-build-title">Build your own OMOship</h3>
      <p>
        Turn a real problem from your business into a remote project. Students do the work, OMO grades it against your
        criteria, and you get a ranked leaderboard of who can actually do the job.
      </p>
      <div className="ed-build-actions">
        <a className="ed-btn ed-btn-primary" href={CONTACT}>Talk to OMO</a>
        <button type="button" className="ed-btn" onClick={() => setOpen(false)}>Close</button>
      </div>
    </section>
  )
}

export default function EmployerHome() {
  const { user } = useOutletContext()
  const { omoship } = useEmployerData()
  const firstName = user.firstName || user.fullName?.trim().split(/\s+/)[0]
  // The employer's OMOships, from the course registry: the pilot for now
  const mine = omoships.filter((course) => course.slug === omoship.slug)

  return (
    <EmployerFrame title="Your OMOships">
      <div className="ed-head">
        <div>
          <span className="ed-eyebrow">Employer portal</span>
          <h1 className="ed-h1 ph-no-capture">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
          <p className="ed-lede">Open an OMOship to see its leaderboard and analytics.</p>
        </div>
      </div>

      <section aria-labelledby="ed-omoships-title">
        <div className="om-section-head">
          <h2 id="ed-omoships-title">YOUR OMOSHIPS</h2>
          <span className="om-count">{`${mine.length} live`}</span>
        </div>
        <div className="om-grid">
          {mine.map((course) => (
            <OmoshipTile
              key={course.slug}
              course={course}
              to={dashboardPath(course.slug)}
              ctaLabel="Open dashboard"
              badge="Pilot"
            />
          ))}
          <BuildCard />
        </div>
      </section>
    </EmployerFrame>
  )
}
