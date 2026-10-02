import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import AccountTypeToggle, { useAccountType, withAccountType } from '../../components/auth/AccountTypeToggle.jsx'
import Field from '../../components/auth/Field.jsx'
import { landingPath, resendCode, signIn } from '../../lib/auth.js'
import { validateEmail } from '../../lib/validation.js'

/* The Student / Employer switch must match the account: the database refuses a student
   signing in on the Employer side and the reverse (admins may use either). */
export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useAccountType()
  const isEmployer = accountType === 'employer'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {
      email: validateEmail(email),
      password: password ? '' : 'Enter your password.',
    }
    setErrors(found)
    setFormError('')
    if (Object.values(found).some(Boolean)) return

    setSubmitting(true)
    try {
      await signIn({ email: email.trim(), password, side: accountType })
      navigate(await landingPath(), { replace: true })
    } catch (error) {
      if (error.code === 'email_not_confirmed') {
        // Signed up but never entered the code: send a fresh one and pick up where they left off
        await resendCode({ email: email.trim(), type: 'signup' }).catch(() => {})
        navigate('/verify', { state: { email: email.trim(), type: 'signup', side: accountType } })
        return
      }
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Sign in">
      <AccountTypeToggle value={accountType} onChange={setAccountType} />
      {isEmployer ? (
        <>
          <h1>Find<br />Proven<br />Talent</h1>
          <p className="auth-sub">Set OMOships and see how students actually work before you hire.</p>
        </>
      ) : (
        <>
          <h1>Start<br />Career<br />Maxxing</h1>
          <p className="auth-sub">Access work experience remotely, project-based and human graded.</p>
        </>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="auth-error" role="alert">{formError}</p>}
        <Field
          label={isEmployer ? 'Work email' : 'Email'}
          type="email"
          autoComplete="email"
          placeholder={isEmployer ? 'you@company.com' : 'you@example.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          aside={<Link to="/forgot-password">Forgot?</Link>}
        />
        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">No account? <Link to={withAccountType('/signup', accountType)}>Sign up</Link></p>
    </AuthLayout>
  )
}
