import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import AccountTypeToggle, { useAccountType, withAccountType } from '../../components/auth/AccountTypeToggle.jsx'
import Field from '../../components/auth/Field.jsx'
import { landingPath, signUp } from '../../lib/auth.js'
import { validateEmail, validateNewPassword, validatePasswordMatch } from '../../lib/validation.js'

const CONTACT = 'mailto:buildingomo@gmail.com?subject=Employer%20account'

/* Students sign up here and get a student account (the database default). Employer accounts
   are made by OMO (supabase/migrations/007_employers_by_invite.sql), so the Employer side
   only says how to get one; the database refuses employer sign-ups made any other way. */
export default function SignUp() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useAccountType()
  const isEmployer = accountType === 'employer'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {
      fullName: fullName.trim() ? '' : 'Enter your name.',
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirm: validatePasswordMatch(password, confirm),
    }
    setErrors(found)
    setFormError('')
    if (Object.values(found).some(Boolean)) return

    setSubmitting(true)
    try {
      const { needsCode } = await signUp({ fullName: fullName.trim(), email: email.trim(), password })
      if (needsCode) navigate('/verify', { state: { email: email.trim(), type: 'signup' } })
      else navigate(await landingPath(), { replace: true })
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  if (isEmployer) {
    return (
      <AuthLayout title="Employer accounts" backTo={withAccountType('/login', accountType)}>
        <AccountTypeToggle value={accountType} onChange={setAccountType} />
        <h1>Hiring<br />with OMO?</h1>
        <p className="auth-sub">
          We set up employer accounts for each company ourselves. Get in touch and we’ll send you your login.
        </p>
        <a className="auth-btn" href={CONTACT}>Talk to OMO</a>
        <p className="auth-switch">
          Already have an account? <Link to={withAccountType('/login', accountType)}>Sign in</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Sign up" backTo="/login">
      <AccountTypeToggle value={accountType} onChange={setAccountType} />
      <h1>Welcome<br />to OMO!</h1>
      <p className="auth-sub">Create your account to get started.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="auth-error" role="alert">{formError}</p>}
        <Field
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Password"
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
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
