import { Link } from 'react-router'
import { OmoshipMap } from '../../components/OmoshipTile.jsx'
import { coursePath } from '../../courses/index.ts'
import '../../styles/omoship-tile.css'

/* The OMOship students see, as a card beside the dashboard: the course map, what it is and
   what students do in it. The whole card opens the course as a preview (CourseShell): the
   employer can try everything, but nothing they do is saved or scored. */
export default function OmoshipCard({ course }) {
  const commitment = course.stats.find((s) => s.label === 'Commitment')?.value

  return (
    <section className="otile ed-omo-card" aria-labelledby="ed-omo-card-title">
      <div className="otile-map" aria-hidden="true">
        <OmoshipMap />
        <span className="otile-status is-badge">Pilot</span>
      </div>
      <div className="ed-omo-body">
        <span className="ed-label">The OMOship</span>
        <h2 id="ed-omo-card-title" className="otile-title">{course.title}</h2>
        <p className="otile-strap">{course.strapline}</p>
        <ul className="otile-meta">
          <li>{course.sector}</li>
          {commitment && <li>{commitment}</li>}
          <li>Remote</li>
        </ul>
        <ol className="ed-omo-weeks">
          {course.weeks.map((week) => (
            <li key={week.label}>
              <span className="ed-omo-week-label">{week.label}</span>
              <span className="ed-omo-week-title">{week.title}</span>
            </li>
          ))}
        </ol>
        <ul className="ed-omo-tools" aria-label="Tools students use">
          {course.tools.map((tool) => <li key={tool.name}>{tool.name}</li>)}
        </ul>
        <div className="ed-omo-foot">
          <Link className="otile-cta" to={coursePath(course.slug)}>
            Try the OMOship
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="ed-muted ed-small">Preview only: nothing is saved or scored.</span>
        </div>
      </div>
      <span className="ot-glare" aria-hidden="true" />
    </section>
  )
}
