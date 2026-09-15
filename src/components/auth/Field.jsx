import { useId, useState } from 'react'

function EyeIcon({ crossed }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  )
}

/* Labelled input with an inline error. Password fields get a show/hide toggle;
   `aside` renders next to the label (e.g. a "Forgot?" link). */
export default function Field({ label, type = 'text', error, aside, ...inputProps }) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className={`auth-input-wrap${isPassword ? ' has-reveal' : ''}`}>
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-reveal"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
          >
            <EyeIcon crossed={revealed} />
          </button>
        )}
      </div>
      {error && <p className="auth-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
