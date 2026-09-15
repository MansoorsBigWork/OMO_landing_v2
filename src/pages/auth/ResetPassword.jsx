import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import Field from '../../components/auth/Field.jsx'
import SuccessState from '../../components/auth/SuccessState.jsx'
import { getRecoverySession, updatePassword } from '../../lib/auth.js'
import { validateNewPassword, validatePasswordMatch } from '../../lib/validation.js'

/* Reached after a verified reset code (router state carries { email })
   or straight from a reset link in the email (Supabase signs the user in from the URL). */
export default function ResetPassword() {
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.email ?? null)
  const [checking, setChecking] = useState(!state?.email)
  const [linkError, setLinkError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!checking) return
    let current = true
    getRecoverySession().then((result) => {
      if (!current) return
      setEmail(result.email)
      setLinkError(result.error)
      setChecking(false)
    })
    return () => {
      current = false
    }
  }, [checking])

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {
      password: validateNewPassword(password),
      confirm: validatePasswordMatch(password, confirm),
    }
    setErrors(found)
    setFormError('')
    if (Object.values(found).some(Boolean)) return

    setSubmitting(true)
    try {
      await updatePassword({ password })
      setDone(true)
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  if (checking) return <AuthLayout title="New password" />

  if (linkError) {
    return (
      <AuthLayout title="Link expired" backTo="/login">
        <h1>This link has expired</h1>
        <p className="auth-sub">{linkError} Request a new code to reset your password.</p>
        <Link className="auth-btn" to="/forgot-password">Send a new code</Link>
      </AuthLayout>
    )
  }

  if (!email) return <Navigate to="/forgot-password" replace />

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <SuccessState title="Password updated!" message="Logging you in right away…" redirectTo="/portal" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="New password">
      <h1>Choose a new password</h1>
      <p className="auth-sub">For <strong>{email}</strong>. Use at least 8 characters.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="auth-error" role="alert">{formError}</p>}
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Field
          label="Re-type password"
          type="password"
          autoComplete="new-password"
          placeholder="Same again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
