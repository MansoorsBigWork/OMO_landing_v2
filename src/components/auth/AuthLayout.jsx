import { useEffect } from 'react'
import { Link } from 'react-router'
import logo from '../../assets/omo-logo.png'
import '../../styles/auth.css'

/* Split screen shared by every sign-in step: brand panel on the left, the step on the right. */
export default function AuthLayout({ title, backTo, children }) {
  useEffect(() => {
    document.title = `${title} — OMO`
  }, [title])

  // No rubber-band pull past the page edges (trackpads, phones); where a browser still bounces,
  // the page behind shows the auth canvas colour rather than white
  useEffect(() => {
    document.documentElement.classList.add('no-overscroll', 'auth-page')
    return () => document.documentElement.classList.remove('no-overscroll', 'auth-page')
  }, [])

  return (
    <div className="auth">
      <aside className="auth-panel">
        <Link to="/" aria-label="OMO home">
          <img className="auth-panel-logo" src={logo} alt="OMO" />
        </Link>
      </aside>

      <main className="auth-main">
        {backTo && (
          <Link className="auth-back" to={backTo} aria-label="Back">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </Link>
        )}
        <div className="auth-content">{children}</div>
        <p className="auth-legal">
          By continuing, you confirm you’ve read OMO’s{' '}
          <a href="/privacypolicies" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </p>
      </main>
    </div>
  )
}
