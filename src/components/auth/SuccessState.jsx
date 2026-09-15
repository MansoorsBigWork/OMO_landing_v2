import { useEffect } from 'react'
import { useNavigate } from 'react-router'

const REDIRECT_MS = 1600

export default function SuccessState({ title = 'Success!', message, redirectTo }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!redirectTo) return
    const timer = setTimeout(() => navigate(redirectTo, { replace: true }), REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [redirectTo, navigate])

  return (
    <div className="auth-success" role="status">
      <h1>{title}</h1>
      <div className="auth-success-mark" aria-hidden="true">
        <svg viewBox="0 0 52 52">
          <path d="M14 27l8 8 16-17" />
        </svg>
      </div>
      <p>{message}</p>
    </div>
  )
}
