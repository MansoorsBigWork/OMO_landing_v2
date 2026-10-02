import { Link, useOutletContext } from 'react-router'
import EmployerFrame from './EmployerFrame.jsx'

// [column in employer_profiles, label]
const FIELDS = [
  ['company_name', 'Company name'],
  ['website', 'Website'],
  ['job_title', 'Your job title'],
]

export default function EmployerCompany() {
  const { user } = useOutletContext()
  return (
    <EmployerFrame title="Company details">
      <Link className="ed-back" to="/portal">← Your OMOships</Link>
      <div className="ed-head">
        <div>
          <span className="ed-eyebrow">Your account</span>
          <h1 className="ed-h1">Company details</h1>
          <p className="ed-lede">What you told us when you signed up. Email OMO to change these.</p>
        </div>
      </div>
      <section className="ed-card ed-company-card">
        <dl className="ed-facts">
          {FIELDS.map(([key, label]) => (
            <div key={key}><dt>{label}</dt><dd>{user.details[key] || 'Not added yet'}</dd></div>
          ))}
          <div><dt>Sign-in email</dt><dd>{user.email}</dd></div>
          <div><dt>Status</dt><dd>{user.isVerified ? 'Verified' : 'Pending verification'}</dd></div>
        </dl>
      </section>
    </EmployerFrame>
  )
}
