import { useEffect, useId, useRef, useState } from 'react'
import { UK_UNIVERSITIES } from '../data/universities.js'
import { DEGREE_SUBJECTS } from '../data/degree-subjects.js'
import {
  BIO_MAX,
  CV_MAX_BYTES,
  GRADUATION_YEARS,
  cvFileName,
  cvViewUrl,
  removeCv,
  saveStudentProfile,
  uploadCv,
} from '../lib/profile.js'
import { normaliseLinkedIn } from '../lib/linkedin.js'

/* The student's profile card: what employers will see, and the form to fill it in.
   Name, university, course and graduation year are required. Bio, LinkedIn and CV
   are optional but recommended, since verified employers browse these profiles. */

const OTHER = '__other__'

const copy = {
  title: 'Your profile',
  employers: 'Verified employers can see this profile when they look for students.',
  incomplete: 'A few details are missing. Employers only see complete profiles.',
  edit: 'Edit profile',
  complete: 'Complete your profile',
  save: 'Save profile',
  saving: 'Saving…',
  cancel: 'Cancel',
  recommended: 'Recommended',
  optional: 'Optional',
  empty: 'Not added yet',
  select: 'Select…',
  other: 'Other (type it in)',
  view: 'View',
  replace: 'Replace CV',
  upload: 'Upload CV (PDF, up to 5 MB)',
  remove: 'Remove',
  chosen: 'Ready to upload:',
  removing: 'Will be removed when you save',
  saved: 'Profile saved.',
}

const labels = {
  fullName: 'Full name',
  university: 'University',
  subject: 'Course',
  graduationYear: 'Graduation year',
  bio: 'Bio',
  linkedinUrl: 'LinkedIn',
  cv: 'CV',
}

const errors = {
  fullName: 'Enter your name.',
  university: 'Choose your university, or pick Other and type it in.',
  subject: 'Choose your course, or pick Other and type it in.',
  graduationYear: 'Choose the year you graduate.',
  bio: `Keep your bio to ${BIO_MAX} characters.`,
  cvType: 'Your CV needs to be a PDF.',
  cvSize: 'Your CV needs to be 5 MB or smaller.',
}

/* Turns the stored row into form values */
function fromDetails(user) {
  const d = user.details ?? {}
  return {
    fullName: user.fullName ?? '',
    university: d.university ?? '',
    subject: d.subject_name ?? '',
    graduationYear: d.graduation_year ? String(d.graduation_year) : '',
    bio: d.bio ?? '',
    linkedinUrl: d.linkedin_url ?? '',
  }
}

const missingRequired = (values) => ['fullName', 'university', 'subject', 'graduationYear'].filter((k) => !values[k].trim())

/* A select backed by a preloaded list, with Other revealing a text box */
function ChoiceField({ label, options, value, onChange, error, placeholder }) {
  const id = useId()
  const known = options.includes(value)
  const [other, setOther] = useState(() => Boolean(value) && !known)
  const selectValue = other ? OTHER : known ? value : ''

  return (
    <div className="pf-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={selectValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOther(true)
            onChange('')
          } else {
            setOther(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="">{copy.select}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value={OTHER}>{copy.other}</option>
      </select>
      {other && (
        <input
          type="text"
          className="pf-other"
          aria-label={`${label}, typed in`}
          placeholder={placeholder}
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <p className="pf-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

function Field({ label, tag, hint, error, children }) {
  return (
    <div className="pf-field">
      <div className="pf-label-row">
        <label htmlFor={children.props.id}>{label}</label>
        {tag && <span className="pf-tag">{tag}</span>}
      </div>
      {children}
      {hint && !error && <p className="pf-hint">{hint}</p>}
      {error && <p className="pf-error" id={`${children.props.id}-error`}>{error}</p>}
    </div>
  )
}

function ProfileForm({ user, onSaved, onCancel }) {
  const ids = { name: useId(), year: useId(), bio: useId(), linkedin: useId(), cv: useId() }
  const [values, setValues] = useState(() => fromDetails(user))
  const [cvFile, setCvFile] = useState(null) // a File waiting to upload
  const [cvRemove, setCvRemove] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)
  const currentCv = user.details?.cv_path ?? null

  const set = (key) => (next) => setValues((v) => ({ ...v, [key]: typeof next === 'string' ? next : next.target.value }))

  function chooseFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    if (!isPdf) return setFieldErrors((f) => ({ ...f, cv: errors.cvType }))
    if (file.size > CV_MAX_BYTES) return setFieldErrors((f) => ({ ...f, cv: errors.cvSize }))
    setFieldErrors((f) => ({ ...f, cv: '' }))
    setCvFile(file)
    setCvRemove(false)
  }

  async function submit(e) {
    e.preventDefault()
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
    const linkedinResult = normaliseLinkedIn(trimmed.linkedinUrl)
    const linkedin = linkedinResult.value ?? ''

    const found = {}
    for (const key of missingRequired(trimmed)) found[key] = errors[key]
    if (trimmed.bio.length > BIO_MAX) found.bio = errors.bio
    if (linkedinResult.error) found.linkedinUrl = linkedinResult.error
    if (fieldErrors.cv) found.cv = fieldErrors.cv
    setFieldErrors(found)
    setFormError('')
    if (Object.keys(found).length) return

    setSaving(true)
    try {
      const graduationYear = Number(trimmed.graduationYear)
      await saveStudentProfile(user.id, { ...trimmed, linkedinUrl: linkedin, graduationYear })
      let cvPath = currentCv
      if (cvFile) cvPath = await uploadCv(user.id, cvFile, currentCv)
      else if (cvRemove && currentCv) {
        await removeCv(user.id, currentCv)
        cvPath = null
      }
      onSaved({
        fullName: trimmed.fullName,
        details: {
          ...user.details,
          university: trimmed.university,
          subject_name: trimmed.subject,
          graduation_year: graduationYear,
          bio: trimmed.bio || null,
          linkedin_url: linkedin || null,
          cv_path: cvPath,
        },
      })
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const cvStatus = cvFile
    ? `${copy.chosen} ${cvFile.name}`
    : cvRemove
      ? copy.removing
      : currentCv
        ? cvFileName(currentCv)
        : null

  return (
    <form className="pf-form" onSubmit={submit} noValidate>
      {formError && <p className="pf-form-error" role="alert">{formError}</p>}

      <Field label={labels.fullName} error={fieldErrors.fullName}>
        <input id={ids.name} type="text" autoComplete="name" value={values.fullName} onChange={set('fullName')} aria-invalid={fieldErrors.fullName ? true : undefined} />
      </Field>

      <ChoiceField label={labels.university} options={UK_UNIVERSITIES} value={values.university} onChange={set('university')} error={fieldErrors.university} placeholder="Your university" />
      <ChoiceField label={labels.subject} options={DEGREE_SUBJECTS} value={values.subject} onChange={set('subject')} error={fieldErrors.subject} placeholder="Your course" />

      <Field label={labels.graduationYear} error={fieldErrors.graduationYear}>
        <select id={ids.year} value={values.graduationYear} onChange={set('graduationYear')} aria-invalid={fieldErrors.graduationYear ? true : undefined}>
          <option value="">{copy.select}</option>
          {GRADUATION_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </Field>

      <p className="pf-divider">{copy.employers}</p>

      <Field label={labels.bio} tag={copy.recommended} error={fieldErrors.bio} hint={`${values.bio.length} / ${BIO_MAX}`}>
        <textarea id={ids.bio} rows={4} maxLength={BIO_MAX + 50} value={values.bio} onChange={set('bio')} placeholder="A few lines on what you’re studying, what you’ve built, and what you want to work on." aria-invalid={fieldErrors.bio ? true : undefined} />
      </Field>

      <Field label={labels.linkedinUrl} tag={copy.recommended} error={fieldErrors.linkedinUrl}>
        <input id={ids.linkedin} type="url" inputMode="url" autoComplete="url" placeholder="linkedin.com/in/your-name" value={values.linkedinUrl} onChange={set('linkedinUrl')} aria-invalid={fieldErrors.linkedinUrl ? true : undefined} />
      </Field>

      <div className="pf-field">
        <div className="pf-label-row">
          <label htmlFor={ids.cv}>{labels.cv}</label>
          <span className="pf-tag">{copy.recommended}</span>
        </div>
        <div className="pf-cv">
          <input ref={fileInput} id={ids.cv} type="file" accept="application/pdf,.pdf" className="pf-file" onChange={chooseFile} />
          <button type="button" className="portal-btn" onClick={() => fileInput.current?.click()}>
            {currentCv || cvFile ? copy.replace : copy.upload}
          </button>
          {cvStatus && <span className={`pf-cv-name${cvRemove ? ' is-muted' : ''}`}>{cvStatus}</span>}
          {(currentCv || cvFile) && !cvRemove && (
            <button
              type="button"
              className="pf-link"
              onClick={() => {
                if (cvFile) {
                  setCvFile(null)
                  if (fileInput.current) fileInput.current.value = ''
                } else setCvRemove(true)
              }}
            >
              {copy.remove}
            </button>
          )}
        </div>
        {fieldErrors.cv && <p className="pf-error">{fieldErrors.cv}</p>}
      </div>

      <div className="pf-actions">
        <button type="submit" className="portal-btn portal-btn-primary" disabled={saving}>
          {saving ? copy.saving : copy.save}
        </button>
        <button type="button" className="portal-btn" onClick={onCancel} disabled={saving}>
          {copy.cancel}
        </button>
      </div>
    </form>
  )
}

export default function StudentProfileCard({ user, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const [cvError, setCvError] = useState('')
  const d = user.details ?? {}
  const missing = missingRequired(fromDetails(user))

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 2500)
    return () => clearTimeout(t)
  }, [notice])

  async function openCv() {
    try {
      setCvError('')
      const url = await cvViewUrl(d.cv_path)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      setCvError(err.message)
    }
  }

  const rows = [
    ['Name', user.fullName],
    [labels.university, d.university],
    [labels.subject, d.subject_name],
    [labels.graduationYear, d.graduation_year],
    [labels.bio, d.bio, true],
    [labels.linkedinUrl, d.linkedin_url, true],
  ]

  return (
    <section className="portal-card" aria-labelledby="profile-title">
      <div className="pf-head">
        <h2 id="profile-title">{copy.title}</h2>
        {!editing && (
          <button type="button" className={`portal-btn${missing.length ? ' portal-btn-primary' : ''}`} onClick={() => setEditing(true)}>
            {missing.length ? copy.complete : copy.edit}
          </button>
        )}
      </div>

      {editing ? (
        <ProfileForm
          user={user}
          onCancel={() => setEditing(false)}
          onSaved={(patch) => {
            onSaved(patch)
            setEditing(false)
            setNotice(copy.saved)
          }}
        />
      ) : (
        <>
          <p className={`pf-note${missing.length ? ' is-warning' : ''}`}>{missing.length ? copy.incomplete : copy.employers}</p>
          {notice && <p className="pf-saved" role="status">{notice}</p>}
          <dl className="portal-details">
            {rows.map(([label, value, optional]) => {
              const has = value !== null && value !== undefined && value !== ''
              return (
                <div key={label}>
                  <dt>
                    {label}
                    {optional && !has && <span className="pf-tag">{copy.recommended}</span>}
                  </dt>
                  <dd className={has ? undefined : 'is-empty'}>
                    {has ? (
                      label === labels.linkedinUrl ? (
                        <a href={value} target="_blank" rel="noreferrer">{value.replace(/^https?:\/\/(www\.)?/, '')}</a>
                      ) : (
                        value
                      )
                    ) : (
                      copy.empty
                    )}
                  </dd>
                </div>
              )
            })}
            <div>
              <dt>
                {labels.cv}
                {!d.cv_path && <span className="pf-tag">{copy.recommended}</span>}
              </dt>
              <dd className={d.cv_path ? undefined : 'is-empty'}>
                {d.cv_path ? (
                  <button type="button" className="pf-link" onClick={openCv}>
                    {cvFileName(d.cv_path)} · {copy.view}
                  </button>
                ) : (
                  copy.empty
                )}
              </dd>
            </div>
          </dl>
          {cvError && <p className="pf-error">{cvError}</p>}
        </>
      )}
    </section>
  )
}
