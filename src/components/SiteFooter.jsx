import { Link } from 'react-router'

const PUBLIC_LINKS = [
  { to: '/#how', label: 'How It Works' },
  { to: '/#for-business', label: 'For Businesses' },
  { to: '/#different', label: 'What Makes Us Different' },
  { to: '/privacypolicies', label: 'Privacy Policy' },
]

// `links` entries are { to, label } for pages on the site or { href, label } for mailto and other URLs
export default function SiteFooter({ links = PUBLIC_LINKS }) {
  return (
    <div className="contact-footer">
      <span className="footer-logo">OMO</span>
      <div className="footer-links">
        {links.map(({ to, href, label }) =>
          href ? <a key={label} href={href}>{label}</a> : <Link key={label} to={to}>{label}</Link>,
        )}
      </div>
      <span className="footer-copy">© 2026 One Million Opportunities Ltd</span>
    </div>
  )
}
