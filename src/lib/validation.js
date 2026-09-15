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
