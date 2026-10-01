import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import CodeInput from '../../components/auth/CodeInput.jsx'
import SuccessState from '../../components/auth/SuccessState.jsx'
import { landingPath, resendCode, verifyCode } from '../../lib/auth.js'

const CODE_LENGTH = 6
const RESEND_SECONDS = 60 // Supabase allows one email per address about every 60 seconds

const STEPS = {
  signup: { heading: 'Enter the code we sent to your email', back: '/signup' },
  recovery: { heading: 'Enter the reset code we sent to your email', back: '/forgot-password' },
}

/* Code screen for both sign-up confirmation and password reset. Expects { email, type } in router state. */
export default function Verify() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email
  const type = state?.type === 'recovery' ? 'recovery' : 'signup'
  const step = STEPS[type]

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [redirectTo, setRedirectTo] = useState('') // set once the sign-up code is accepted
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    if (code.length < CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits.`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await verifyCode({ email, code, type })
      if (type === 'recovery') navigate('/reset-password', { replace: true, state: { email } })
      else setRedirectTo(await landingPath())
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setNotice('')
    setCooldown(RESEND_SECONDS)
    try {
      await resendCode({ email, type })
      setNotice('We’ve sent you a new code.')
    } catch (err) {
      setError(err.message)
      setCooldown(0)
    }
  }

  if (!email) return <Navigate to={step.back} replace />

  if (redirectTo) {
    return (
      <AuthLayout title="Signed in">
        <SuccessState message="Logging you in right away…" redirectTo={redirectTo} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Check your email" backTo={step.back}>
      <h1>{step.heading}</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div>
          <CodeInput
            length={CODE_LENGTH}
            value={code}
            onChange={(next) => {
              setCode(next)
              setError('')
            }}
            invalid={Boolean(error)}
            disabled={submitting}
            autoFocus
          />
          <p className="auth-hint">
            {type === 'recovery' ? (
              // Supabase doesn't reveal whether an account exists, so don't promise an email arrived
              <>If there’s an account for <strong>{email}</strong>, we’ve sent it a code.</>
            ) : (
              <>Check <strong>{email}</strong></>
            )}
          </p>
          <p className="auth-tag">Can’t see it? Check your spam or junk folder. It can take a minute to arrive.</p>
          {error && <p className="auth-field-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
        </div>

        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? 'Checking…' : 'Confirm'}
        </button>
        <button className="auth-btn auth-btn-secondary" type="button" onClick={handleResend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </form>
    </AuthLayout>
  )
}
