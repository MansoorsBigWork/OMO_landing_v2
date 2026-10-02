import { useEffect, useId, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { PortalError, PortalHeader, usePortalUser } from '../components/PortalShell.jsx'
import Typeahead from '../components/onboarding/Typeahead.jsx'
import { completeOnboarding, landingPathFor } from '../lib/auth.js'
import { normaliseLinkedIn } from '../lib/linkedin.js'
import { DEGREE_STAGES, GOALS, SECTORS, STAGES } from '../data/student-options.js'
import '../styles/portal.css'
import '../styles/onboarding.css'

const MAX_PICKS = 3

// Letters in any language (with accents), spaces, hyphens and apostrophes; must contain a letter
const NAME_PATTERN = /^[\p{L}\p{M} '’-]*\p{L}[\p{L}\p{M} '’-]*$/u

function nameError(value, label) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length > 50) return `${label} must be 50 characters or fewer`
  if (!NAME_PATTERN.test(trimmed)) return 'Use letters, spaces, hyphens and apostrophes only'
  return ''
}

function yearOptions(stage) {
  const now = new Date().getFullYear()
  const years = stage === 'graduated' ? [now - 3, now - 2, now - 1, now] : Array.from({ length: 7 }, (_, i) => now + i)
  return years.filter((year) => year >= 2020 && year <= 2040) // the range the database accepts
}

function track(event, properties) {
  // Step numbers only: never names, links or answers
  window.posthog?.capture?.(event, properties)
}

const EMPTY = {
  firstName: '',
  lastName: '',
  stage: '',
  university: { name: '', code: null },
  subject: { name: '', code: null },
  year: null,
  goals: [],
  sectors: [],
  linkedin: '',
}

function TextField({ label, error, ...inputProps }) {
  const id = useId()
  return (
    <div className="ob-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && <p className="ob-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

function Choices({ type, name, options, isChecked, isDisabled, onToggle, labelledBy, describedBy }) {
  return (
    <fieldset className="ob-choices" aria-labelledby={labelledBy} aria-describedby={describedBy}>
      {options.map(([value, label]) => (
        <label key={value} className="ob-choice">
          <input
            type={type}
            name={name}
            value={value}
            checked={isChecked(value)}
            disabled={isDisabled?.(value)}
            onChange={() => onToggle(value)}
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, loadError, handleSignOut } = usePortalUser()
  const [answers, setAnswers] = useState(EMPTY)
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [linkedinTouched, setLinkedinTouched] = useState(false)
  const [reference, setReference] = useState({ providers: null, subjects: null })
  const headingRef = useRef(null)
  const headingId = useId()
  const noteId = useId()

  const isDegree = DEGREE_STAGES.includes(answers.stage)
  const steps = ['name', 'stage', ...(answers.stage && !isDegree ? [] : ['study']), 'year', 'goals', 'sectors', 'linkedin']
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  useEffect(() => {
    document.title = 'Get set up — OMO'
  }, [])

  // The search lists ship with the app but only load here
  useEffect(() => {
    let current = true
    Promise.all([import('../data/uk-providers.json'), import('../data/hecos.json')]).then(([providers, subjects]) => {
      if (!current) return
      setReference({
        providers: providers.default.map(({ ukprn, name }) => ({ code: ukprn, name })),
        subjects: subjects.default,
      })
    })
    return () => {
      current = false
    }
  }, [])

  // Each new screen: move focus to its question and record the step number
  const ready = user !== undefined
  useEffect(() => {
    if (!ready) return
    headingRef.current?.focus()
    track('onboarding_step_viewed', { step: stepIndex + 1 })
  }, [stepIndex, ready])

  function update(changes) {
    setAnswers((previous) => ({ ...previous, ...changes }))
    setSaveError('')
  }

  function toggle(key, value) {
    const picked = answers[key]
    if (picked.includes(value)) update({ [key]: picked.filter((v) => v !== value) })
    else if (key === 'sectors' && value === 'not_sure') update({ sectors: ['not_sure'] })
    else if (picked.length < MAX_PICKS) update({ [key]: [...picked, value] })
  }

  const firstNameError = nameError(answers.firstName, 'First name')
  const lastNameError = nameError(answers.lastName, 'Last name')
  const years = yearOptions(answers.stage)
  const linkedin = normaliseLinkedIn(answers.linkedin)

  const valid = {
    name: answers.firstName.trim() && answers.lastName.trim() && !firstNameError && !lastNameError,
    stage: Boolean(answers.stage),
    study: [answers.university.name, answers.subject.name].every((v) => v.trim().length >= 2 && v.trim().length <= 150),
    year: years.includes(answers.year),
    goals: answers.goals.length >= 1 && answers.goals.length <= MAX_PICKS,
    sectors: answers.sectors.length <= MAX_PICKS,
    linkedin: !linkedin.error,
  }[step]

  async function save(linkedinUrl) {
    setSaving(true)
    setSaveError('')
    try {
      await completeOnboarding({
        p_first_name: answers.firstName.trim(),
        p_last_name: answers.lastName.trim(),
        p_education_stage: answers.stage,
        p_university: isDegree ? answers.university.name.trim() : null,
        p_university_ukprn: isDegree ? answers.university.code : null,
        p_subject_name: isDegree ? answers.subject.name.trim() : null,
        p_subject_code: isDegree ? answers.subject.code : null,
        p_graduation_year: answers.year,
        p_goals: answers.goals,
        p_sectors: answers.sectors.length ? answers.sectors : null,
        p_linkedin_url: linkedinUrl,
      })
      track('onboarding_completed')
      navigate('/omoships', { replace: true })
    } catch (error) {
      setSaveError(error.message)
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!valid || saving) return
    if (isLast) save(linkedin.value)
    else setStepIndex((index) => index + 1)
  }

  function skip() {
    if (step === 'sectors') {
      update({ sectors: [] })
      setStepIndex((index) => index + 1)
    } else {
      update({ linkedin: '' })
      save(null)
    }
  }

  if (loadError && !import.meta.env.DEV) return <PortalError message={loadError} onSignOut={handleSignOut} />
  if (user === undefined && !loadError) return <div className="portal" aria-busy="true" />
  // Local dev only: preview the flow without signing in. Production still requires login.
  if (user === null && !import.meta.env.DEV) return <Navigate to="/login" replace />
  if (user && (user.role !== 'student' || user.onboardingCompleted)) return <Navigate to={landingPathFor(user)} replace />

  const questions = {
    name: 'What’s your name?',
    stage: 'Where are you right now?',
    study: 'Where do you study, and what?',
    year: answers.stage === 'graduated' ? 'When did you graduate?' : 'When do you finish?',
    goals: 'What are you looking for?',
    sectors: 'Which sectors interest you?',
    linkedin: 'Add your LinkedIn',
  }
  const notes = {
    goals: answers.goals.length >= MAX_PICKS ? 'You can pick up to 3' : 'Pick up to 3',
    sectors: answers.sectors.length >= MAX_PICKS ? 'You can pick up to 3' : 'Optional. Pick up to 3',
    linkedin: 'Optional. Paste the link to your profile.',
  }

  return (
    <div className="portal">
      <PortalHeader email={user?.email ?? 'Preview'} onSignOut={handleSignOut} />

      <main className="ob-main">
        <form className="ob-card" onSubmit={handleSubmit} noValidate>
          <div className="ob-progress">
            <p>Step {stepIndex + 1} of {steps.length}</p>
            <div
              className="ob-progress-bar"
              role="progressbar"
              aria-label="Onboarding progress"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={stepIndex + 1}
            >
              <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <h1 id={headingId} ref={headingRef} tabIndex={-1}>{questions[step]}</h1>
          {notes[step] && <p className="ob-note" id={noteId} aria-live="polite">{notes[step]}</p>}

          {/* answers stay out of session recordings */}
          <div className="ob-body ph-no-capture">
            {step === 'name' && (
              <>
                <TextField
                  label="First name"
                  autoComplete="given-name"
                  maxLength={60}
                  value={answers.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  error={firstNameError}
                />
                <TextField
                  label="Last name"
                  autoComplete="family-name"
                  maxLength={60}
                  value={answers.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  error={lastNameError}
                />
              </>
            )}

            {step === 'stage' && (
              <Choices
                type="radio"
                name="stage"
                options={STAGES}
                labelledBy={headingId}
                isChecked={(value) => answers.stage === value}
                onToggle={(value) => update({ stage: value })}
              />
            )}

            {step === 'study' && (
              <>
                <Typeahead
                  label="University"
                  hint="Start typing, then pick from the list. Not listed? Just type it in full."
                  options={reference.providers}
                  loading={!reference.providers}
                  value={answers.university}
                  onChange={(university) => update({ university })}
                />
                <Typeahead
                  label="Subject"
                  hint="Start typing, then pick from the list. Not listed? Just type it in full."
                  options={reference.subjects}
                  loading={!reference.subjects}
                  value={answers.subject}
                  onChange={(subject) => update({ subject })}
                />
              </>
            )}

            {step === 'year' && (
              <Choices
                type="radio"
                name="year"
                options={years.map((year) => [year, String(year)])}
                labelledBy={headingId}
                isChecked={(value) => answers.year === value}
                onToggle={(value) => update({ year: value })}
              />
            )}

            {step === 'goals' && (
              <Choices
                type="checkbox"
                name="goals"
                options={GOALS}
                labelledBy={headingId}
                describedBy={noteId}
                isChecked={(value) => answers.goals.includes(value)}
                isDisabled={(value) => answers.goals.length >= MAX_PICKS && !answers.goals.includes(value)}
                onToggle={(value) => toggle('goals', value)}
              />
            )}

            {step === 'sectors' && (
              <Choices
                type="checkbox"
                name="sectors"
                options={SECTORS}
                labelledBy={headingId}
                describedBy={noteId}
                isChecked={(value) => answers.sectors.includes(value)}
                isDisabled={(value) =>
                  !answers.sectors.includes(value) &&
                  (answers.sectors.includes('not_sure') || answers.sectors.length >= MAX_PICKS)
                }
                onToggle={(value) => toggle('sectors', value)}
              />
            )}

            {step === 'linkedin' && (
              <TextField
                label="LinkedIn profile (optional)"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="linkedin.com/in/yourname"
                value={answers.linkedin}
                onChange={(e) => update({ linkedin: e.target.value })}
                onBlur={() => setLinkedinTouched(true)}
                error={linkedinTouched ? linkedin.error : ''}
              />
            )}
          </div>

          {saveError && <p className="ob-save-error" role="alert">{saveError}</p>}

          <div className="ob-actions">
            {stepIndex > 0 && (
              <button type="button" className="ob-btn ob-btn-secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={saving}>
                Back
              </button>
            )}
            {(step === 'sectors' || step === 'linkedin') && (
              <button type="button" className="ob-btn ob-btn-ghost" onClick={skip} disabled={saving}>
                Skip
              </button>
            )}
            <button type="submit" className="ob-btn ob-btn-primary" disabled={!valid || saving}>
              {isLast ? (saving ? 'Saving...' : 'Finish') : 'Continue'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
