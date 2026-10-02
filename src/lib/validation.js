export const MIN_PASSWORD_LENGTH = 8

// Each check returns an error message, or '' when the value is fine.

export function validateEmail(email) {
  const value = email.trim()
  if (!value) return 'Enter your email address.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address, like name@example.com.'
}

export function validateNewPassword(password) {
  return password.length >= MIN_PASSWORD_LENGTH ? '' : `Use at least ${MIN_PASSWORD_LENGTH} characters.`
}

export function validatePasswordMatch(password, confirm) {
  if (!confirm) return 'Type your password again.'
  return password === confirm ? '' : 'Passwords don’t match.'
}

/* Employer sign-up: the work email has to be on the company's own domain.
   Kept in step with public.employer_email_problem() in supabase/migrations/004_employer_signup.sql,
   which enforces the same rule when the account is created. */

// Personal mailboxes, which say nothing about where someone works
export const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk',
  'msn.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'proton.me', 'protonmail.com', 'pm.me', 'gmx.com', 'gmx.co.uk', 'mail.com', 'zoho.com', 'yandex.com',
  'btinternet.com', 'sky.com', 'virginmedia.com', 'talktalk.net', 'tutanota.com', 'fastmail.com', 'hey.com',
]

// "https://www.Acme.co.uk/careers" → "acme.co.uk"; '' when it doesn't look like a website
export function websiteDomain(website) {
  const host = website.trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : ''
}

export function validateCompanyWebsite(website) {
  if (!website.trim()) return 'Enter your company’s website.'
  return websiteDomain(website) ? '' : 'Enter a website like acme.com.'
}

// The email's domain must be the website's domain or a subdomain of it (jo@uk.acme.com for acme.com)
export function validateWorkEmail(email, website) {
  const basic = validateEmail(email)
  if (basic) return basic
  const emailDomain = email.trim().toLowerCase().split('@')[1]
  if (FREE_EMAIL_DOMAINS.includes(emailDomain)) return 'Use your work email, not a personal address.'
  const company = websiteDomain(website)
  if (!company) return '' // the website field shows its own error
  const matches = emailDomain === company || emailDomain.endsWith(`.${company}`)
  return matches ? '' : `This email doesn’t match your company. Use an address ending @${company}.`
}
