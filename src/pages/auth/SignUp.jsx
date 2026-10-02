import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import AccountTypeToggle, { useAccountType, withAccountType } from '../../components/auth/AccountTypeToggle.jsx'
import Field from '../../components/auth/Field.jsx'
import { landingPath, signUp } from '../../lib/auth.js'
import {
  validateCompanyWebsite,
  validateEmail,
  validateNewPassword,
  validatePasswordMatch,
  validateWorkEmail,
} from '../../lib/validation.js'

/* Students get a student account (the database default). Employers also give their company,
   and their email must be on the company's website domain; the database checks this again. */
export default function SignUp() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useAccountType()
  const isEmployer = accountType === 'employer'
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function switchType(next) {
    setAccountType(next)
    setErrors({})
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {
      fullName: fullName.trim() ? '' : 'Enter your name.',
      email: isEmployer ? validateWorkEmail(email, website) : validateEmail(email),
      password: validateNewPassword(password),
      confirm: validatePasswordMatch(password, confirm),
    }
    if (isEmployer) {
      found.companyName = companyName.trim() ? '' : 'Enter your company’s name.'
      found.website = validateCompanyWebsite(website)
      found.jobTitle = jobTitle.trim() ? '' : 'Enter your job title.'
    }
    setErrors(found)
    setFormError('')
    if (Object.values(found).some(Boolean)) return

    setSubmitting(true)
    try {
      const employer = isEmployer
        ? { companyName: companyName.trim(), website: website.trim(), jobTitle: jobTitle.trim() }
        : undefined
      const { needsCode } = await signUp({ fullName: fullName.trim(), email: email.trim(), password, employer })
      if (needsCode) navigate('/verify', { state: { email: email.trim(), type: 'signup', side: accountType } })
      else navigate(await landingPath(), { replace: true })
    } catch (error) {
      if (error.code === 'employer_email') setErrors((current) => ({ ...current, email: error.message }))
      else setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Sign up" backTo={withAccountType('/login', accountType)}>
      <AccountTypeToggle value={accountType} onChange={switchType} />
      <h1>Welcome<br />to OMO!</h1>
      <p className="auth-sub">
        {isEmployer
          ? 'Create your company account. Sign up with your work email, on your company’s own domain.'
          : 'Create your account to get started.'}
      </p>

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
        {isEmployer && (
          <>
            <Field
              label="Company name"
              autoComplete="organization"
              placeholder="Acme Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={errors.companyName}
            />
            <Field
              label="Company website"
              type="url"
              autoComplete="url"
              placeholder="acme.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              error={errors.website}
            />
            <Field
              label="Job title"
              autoComplete="organization-title"
              placeholder="Head of Talent"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              error={errors.jobTitle}
            />
          </>
        )}
        <Field
          label={isEmployer ? 'Work email' : 'Email'}
          type="email"
          autoComplete="email"
          placeholder={isEmployer ? 'you@acme.com' : 'you@example.com'}
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
          {submitting ? 'Creating account…' : isEmployer ? 'Create company account' : 'Sign up'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to={withAccountType('/login', accountType)}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}
