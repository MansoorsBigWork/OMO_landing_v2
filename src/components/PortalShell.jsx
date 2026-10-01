import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import PortalBar from './PortalBar.jsx'
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

/* Kept for the dashboard and onboarding pages, which load the user themselves.
   `profile` shows the round account menu instead of the email and Sign out button. */
export function PortalHeader({ email, name, profile, onSignOut }) {
  return <PortalBar user={{ email, fullName: name }} menu={Boolean(profile)} homeTo="/" onSignOut={onSignOut} />
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
