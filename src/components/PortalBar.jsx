import { Link } from 'react-router'
import logo from '../assets/omo-logo.png'
import ProfileMenu, { EMPLOYER_MENU, STUDENT_MENU } from './ProfileMenu.jsx'
import { landingPathFor } from '../lib/auth.js'
import '../styles/portal.css'

/* The signed-in top bar, shared by the dashboard, the portal, onboarding and
   every course page so the student never loses the way back. Students and
   employers get the round account menu (employers' holds Company details);
   admins get their email and a Sign out button. Its height is --portal-bar-h; course pages offset their sticky and
   fixed parts by it. */
export default function PortalBar({ user, onSignOut, homeTo = null, menu = null }) {
  const showMenu = menu ?? (user?.role === 'student' || user?.role === 'employer')
  const home = homeTo ?? landingPathFor(user)

  return (
    <header className="portal-bar">
      <Link to={home} className="portal-bar-home" aria-label="OMO home">
        <img className="portal-logo" src={logo} alt="OMO" />
      </Link>
      {showMenu ? (
        <ProfileMenu
          name={user?.fullName || user?.firstName}
          email={user?.email}
          onSignOut={onSignOut}
          items={user?.role === 'employer' ? EMPLOYER_MENU : STUDENT_MENU}
        />
      ) : (
        <div className="portal-user">
          <span className="portal-email ph-no-capture">{user?.email}</span>
          <button type="button" className="portal-signout" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </header>
  )
}
