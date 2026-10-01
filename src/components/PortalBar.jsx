import { Link } from 'react-router'
import logo from '../assets/omo-logo.png'
import '../styles/portal.css'

/* The signed-in top bar: logo, who is signed in, sign out. Shared by the portal
   and every course page so the student never loses the way back. Its height is
   --portal-bar-h; the course pages offset their sticky and fixed parts by it. */
export default function PortalBar({ user, onSignOut, homeTo = '/portal' }) {
  return (
    <header className="portal-bar">
      <Link to={homeTo} className="portal-bar-home" aria-label="OMO portal">
        <img className="portal-logo" src={logo} alt="OMO" />
      </Link>
      <div className="portal-user">
        <span className="portal-email">{user.email}</span>
        <button type="button" className="portal-signout" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
