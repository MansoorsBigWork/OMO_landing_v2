import { supabase } from './supabase.js'

/* Student profile edits and CV storage. The CV file itself lives in the private
   `cvs` bucket at <user_id>/<filename>; only that path goes in the database.
   Errors are thrown with a message that's safe to show on screen. */

export const BIO_MAX = 1000
export const CV_MAX_BYTES = 5 * 1024 * 1024
export const GRADUATION_YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i) // matches the database check

const BUCKET = 'cvs'

function client() {
  if (!supabase) throw new Error('Sign-in isn’t set up yet, so your profile can’t be saved.')
  return supabase
}

function fail(error, fallback) {
  if (import.meta.env.DEV) console.warn('[profile]', error)
  throw new Error(error?.message || fallback)
}

/* Saves the editable fields. Empty optional values are stored as null. */
export async function saveStudentProfile(userId, { fullName, university, subject, graduationYear, bio, linkedinUrl }) {
  const db = client()
  const firstName = fullName.split(/\s+/)[0]
  const profile = await db.from('profiles').update({ full_name: fullName, first_name: firstName }).eq('id', userId)
  if (profile.error) fail(profile.error, 'Your name could not be saved.')

  const details = await db
    .from('student_profiles')
    .update({
      university,
      subject_name: subject,
      graduation_year: graduationYear,
      bio: bio || null,
      linkedin_url: linkedinUrl || null,
    })
    .eq('id', userId)
  if (details.error) fail(details.error, 'Your profile could not be saved.')
}

/* Keeps a file name readable but safe as an object key */
function safeFileName(name) {
  const trimmed = name.trim().replace(/[^\w.() -]+/g, '-').replace(/\s+/g, ' ')
  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`
}

/* Uploads a CV, replacing the previous file, and records its path. Resolves to the new path. */
export async function uploadCv(userId, file, previousPath) {
  const db = client()
  const path = `${userId}/${safeFileName(file.name)}`

  const upload = await db.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: 'application/pdf' })
  if (upload.error) fail(upload.error, 'Your CV could not be uploaded.')

  const record = await db.from('student_profiles').update({ cv_path: path }).eq('id', userId)
  if (record.error) fail(record.error, 'Your CV was uploaded but could not be saved to your profile.')

  // One file per student: drop the old object once the new one is recorded
  if (previousPath && previousPath !== path) await db.storage.from(BUCKET).remove([previousPath])
  return path
}

export async function removeCv(userId, path) {
  const db = client()
  const record = await db.from('student_profiles').update({ cv_path: null }).eq('id', userId)
  if (record.error) fail(record.error, 'Your CV could not be removed.')
  if (path) await db.storage.from(BUCKET).remove([path])
}

/* A short-lived link to view the CV; files are never public */
export async function cvViewUrl(path) {
  const { data, error } = await client().storage.from(BUCKET).createSignedUrl(path, 60)
  if (error) fail(error, 'Your CV could not be opened.')
  return data.signedUrl
}

export const cvFileName = (path) => (path ? path.slice(path.indexOf('/') + 1) : '')
