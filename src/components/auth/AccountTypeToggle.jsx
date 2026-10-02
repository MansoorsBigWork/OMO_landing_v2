import { useSearchParams } from 'react-router'

const TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'employer', label: 'Employer' },
]

/* The Student / Employer switch at the top of sign-in and sign-up. The choice lives in
   the URL (?as=employer) so it survives moving between the two pages. */
export function useAccountType() {
  const [params, setParams] = useSearchParams()
  const type = params.get('as') === 'employer' ? 'employer' : 'student'
  const setType = (next) => setParams(next === 'employer' ? { as: 'employer' } : {}, { replace: true })
  return [type, setType]
}

// Appends ?as=employer to a link when the employer side is chosen
export function withAccountType(path, type) {
  return type === 'employer' ? `${path}?as=employer` : path
}

export default function AccountTypeToggle({ value, onChange }) {
  return (
    <div className="auth-toggle" role="radiogroup" aria-label="Account type" data-value={value}>
      {TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          role="radio"
          aria-checked={value === type.value}
          tabIndex={value === type.value ? 0 : -1}
          onClick={() => onChange(type.value)}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
            event.preventDefault()
            const other = TYPES.find((t) => t.value !== value)
            onChange(other.value)
            event.currentTarget.parentElement.querySelector(`[data-type="${other.value}"]`)?.focus()
          }}
          data-type={type.value}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}
