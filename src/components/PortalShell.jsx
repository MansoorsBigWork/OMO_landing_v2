import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import logo from '../assets/omo-logo.png'
import ProfileMenu from './ProfileMenu.jsx'
import { getCurrentUser, onSignedOut, signOut } from '../lib/auth.js'

/* Loads the signed-in user for pages behind the login.
   user is undefined while loading and null when signed out. */
export function usePortalUser() {
  const navigate = useNavigate()
  const [user, setUser] = useState()
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let current = true
    getCurrentUser()
      .then((found) => {
        if (current) setUser(found)
      })
      .catch((error) => {
        if (current) setLoadError(error.message)
      })
    return () => {
      current = false
    }
  }, [])

  // Leave if the session ends elsewhere (signed out in another tab, expired login)
  useEffect(() => onSignedOut(() => navigate('/login', { replace: true })), [navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return { user, loadError, handleSignOut }
}

/* `profile` swaps the email and Sign out button for the round account menu */
export function PortalHeader({ email, name, profile, onSignOut }) {
  return (
    <header className="portal-header">
      <Link to="/">
        <img className="portal-logo" src={logo} alt="OMO" />
      </Link>
      {profile ? (
        <ProfileMenu name={name} email={email} onSignOut={onSignOut} />
      ) : (
        <div className="portal-user">
          <span className="portal-email ph-no-capture">{email}</span>
          <button type="button" className="portal-signout" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </header>
  )
}

export function PortalError({ message, onSignOut }) {
  return (
    <div className="portal">
      <main className="portal-main">
        <h1>Something went wrong</h1>
        <p className="portal-intro">We couldn’t load your account. {message}</p>
        <button type="button" className="portal-signout portal-error-action" onClick={onSignOut}>
          Sign out
        </button>
      </main>
    </div>
  )
}
