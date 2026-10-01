import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router'
import { getCurrentUser, onSignedOut, signOut } from '../lib/auth.js'
import '../styles/portal.css'

/* Wraps every signed-in route. Loads the user once, sends visitors to /login,
   and leaves when the session ends elsewhere (signed out in another tab, expired login).
   Child routes read { user, signOut, updateUser } from useOutletContext(). */
export default function RequireAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState() // undefined while loading, null when signed out
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

  useEffect(() => onSignedOut(() => navigate('/login', { replace: true })), [navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (loadError) {
    return (
      <div className="portal">
        <main className="portal-main">
          <h1>Something went wrong</h1>
          <p className="portal-intro">We couldn’t load your account. {loadError}</p>
          <button type="button" className="portal-signout portal-error-action" onClick={handleSignOut}>
            Sign out
          </button>
        </main>
      </div>
    )
  }
  if (user === undefined) return <div className="portal" aria-busy="true" />
  if (user === null) return <Navigate to="/login" replace />

  // Children merge saved changes in, so the portal reflects a profile edit without a reload
  const updateUser = (patch) => setUser((current) => ({ ...current, ...patch }))

  return <Outlet context={{ user, signOut: handleSignOut, updateUser }} />
}
