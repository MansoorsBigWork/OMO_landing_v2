import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Field from '../../components/auth/Field.jsx'
import { requestPasswordReset } from '../../lib/auth.js'
import { validateEmail } from '../../lib/validation.js'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateEmail(email)
    setError(found)
    setFormError('')
    if (found) return

    setSubmitting(true)
    try {
      await requestPasswordReset({ email: email.trim() })
      navigate('/verify', { state: { email: email.trim(), type: 'recovery' } })
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset password" backTo="/login">
      <h1>Reset your password</h1>
      <p className="auth-sub">Enter the email you signed up with and we’ll send you a code.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="auth-error" role="alert">{formError}</p>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send code'}
        </button>
      </form>

      <p className="auth-switch">Remembered it? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
