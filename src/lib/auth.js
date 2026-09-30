import { initialUrlHash, supabase } from './supabase.js'

/* Sign-in, sign-up, email codes and the signed-in user, backed by Supabase Auth.
   Errors are thrown as AuthError with a message that's safe to show on screen. */

export class AuthError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

const ACCOUNT_EXISTS = 'An account with this email already exists. Sign in instead.'

// Supabase error codes → wording for the screen; anything else falls back to Supabase's own message
const MESSAGES = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Confirm your email to finish signing up.',
  otp_expired: 'That code is incorrect or has expired.',
  user_already_exists: ACCOUNT_EXISTS,
  email_exists: ACCOUNT_EXISTS,
  same_password: 'Your new password must be different from your old one.',
  over_email_send_rate_limit: 'We’ve sent too many emails to this address. Please wait a minute and try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
}

function toAuthError(error) {
  if (import.meta.env.DEV) console.warn('[auth]', error.code ?? error.name, error.message)
  if (error.name === 'AuthRetryableFetchError') {
    return new AuthError('We couldn’t reach OMO. Check your connection and try again.', 'network')
  }
  return new AuthError(MESSAGES[error.code] ?? error.message ?? 'Something went wrong. Please try again.', error.code)
}

function client() {
  if (!supabase) throw new AuthError('Sign-in isn’t set up yet. Please try again later.', 'not_configured')
  return supabase
}

// Awaits a Supabase request and throws its error, if any, as an AuthError
async function run(request) {
  const { data, error } = await request
  if (error) throw toAuthError(error)
  return data
}

export async function signIn({ email, password }) {
  await run(client().auth.signInWithPassword({ email, password }))
}

/* No role is sent, so handle_new_user makes the account a student.
   Resolves to { needsCode }: false only if "Confirm email" is switched off in Supabase. */
export async function signUp({ fullName, email, password }) {
  const data = await run(
    client().auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  )
  // Supabase reports an already-registered email as a user with no identities rather than an error
  if (data.user && data.user.identities?.length === 0) throw new AuthError(ACCOUNT_EXISTS, 'user_already_exists')
  return { needsCode: !data.session }
}

// type: 'signup' confirms a new account; 'recovery' signs the user in so they can set a new password
export async function verifyCode({ email, code, type }) {
  await run(client().auth.verifyOtp({ email, token: code, type: type === 'recovery' ? 'recovery' : 'email' }))
}

export async function resendCode({ email, type }) {
  if (type === 'recovery') await requestPasswordReset({ email })
  else await run(client().auth.resend({ type: 'signup', email }))
}

// redirectTo only matters if the email template contains a link rather than a code
export async function requestPasswordReset({ email }) {
  await run(client().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }))
}

/* A reset link in the email signs the user in via the URL and lands on /reset-password.
   Resolves to { email } of the signed-in user, or { error } when the link was expired or already used. */
export async function getRecoverySession() {
  const linkFailed = new URLSearchParams(initialUrlHash.slice(1)).has('error_code')
  if (!supabase) return { email: null, error: '' }
  const { data } = await supabase.auth.getSession()
  const email = data.session?.user.email ?? null
  return { email, error: !email && linkFailed ? 'This reset link has expired or has already been used.' : '' }
}

export async function updatePassword({ password }) {
  await run(client().auth.updateUser({ password }))
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

// Calls `callback` when the session ends (signed out in another tab, expired login). Returns an unsubscribe function.
export function onSignedOut(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback()
  })
  return () => data.subscription.unsubscribe()
}

// role → [table, columns] holding that role's extra details
const DETAILS = {
  student: [
    'student_profiles',
    'education_stage, university, subject_name, graduation_year, linkedin_url, cv_path, onboarding_completed_at',
  ],
  employer: ['employer_profiles', 'company_name, website, job_title, is_verified'],
}

// The signed-in user with their profile, or null when nobody is signed in
export async function getCurrentUser() {
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await run(supabase.from('profiles').select('role, first_name, full_name, email, welcomed_at').eq('id', user.id).single())
  const [table, columns] = DETAILS[profile.role] ?? []
  const details = table ? await run(supabase.from(table).select(columns).eq('id', user.id).maybeSingle()) : null

  return {
    id: user.id,
    email: profile.email ?? user.email,
    fullName: profile.full_name ?? '',
    firstName: profile.first_name?.trim() ?? '',
    role: profile.role,
    welcomedAt: profile.welcomed_at,
    onboardingCompleted: Boolean(details?.onboarding_completed_at),
    isVerified: Boolean(details?.is_verified),
    details: details ?? {},
  }
}


/* Where a signed-in user belongs: students who haven't finished onboarding go to /onboarding,
   other students to their dashboard (/omoships), employers and admins to /portal. Students never see /portal. */
export function landingPathFor(user) {
  if (!user) return '/login'
  if (user.role === 'student') return user.onboardingCompleted ? '/omoships' : '/onboarding'
  return '/portal'
}

// Used right after sign-in; falls back to /omoships, which shows its own error if the account can't load
export async function landingPath() {
  const user = await getCurrentUser().catch(() => null)
  return user ? landingPathFor(user) : '/omoships'
}

// The save function's own messages are safe to show; anything else gets the generic one
const ONBOARDING_MESSAGES = [
  'First name and last name are required',
  'Choose between one and three goals',
  'University and subject are required',
  'Tell us when you finish',
]

/* Saves every onboarding answer in one call; the database stores all of them or none. */
export async function completeOnboarding(answers) {
  const { error } = await client().rpc('complete_student_onboarding', answers)
  if (!error) return
  const safe = ONBOARDING_MESSAGES.find((message) => error.message?.includes(message))
  throw new AuthError(safe ?? 'Something went wrong. Please try again.', error.code)
}

// Records the first dashboard visit so later visits get a time-of-day greeting instead
export async function markWelcomed() {
  const {
    data: { user },
  } = await client().auth.getUser()
  if (!user) return
  await client().from('profiles').update({ welcomed_at: new Date().toISOString() }).eq('id', user.id)
}
