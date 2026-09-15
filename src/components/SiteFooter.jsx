import { Link } from 'react-router'

export default function SiteFooter() {
  return (
    <div className="contact-footer">
      <span className="footer-logo">OMO</span>
      <div className="footer-links">
        <Link to="/#how">How It Works</Link>
        <Link to="/#for-business">For Businesses</Link>
        <Link to="/#different">What Makes Us Different</Link>
        <Link to="/privacypolicies">Privacy Policy</Link>
      </div>
      <span className="footer-copy">© 2026 One Million Opportunities Ltd</span>
    </div>
  )
}
