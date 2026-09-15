import { useEffect, useRef } from 'react'

/* One box per digit. Digits fill left to right: focusing any box jumps to the next empty one,
   Backspace removes the last digit, and pasting (or the browser's one-time-code autofill) fills them all. */
export default function CodeInput({ length = 6, value, onChange, invalid = false, disabled = false, autoFocus = false }) {
  const boxes = useRef([])
  // The newest value, updated straight away on input so focus lands on the right box before the re-render
  const latest = useRef(value)

  useEffect(() => {
    latest.current = value
  })

  const focusBox = (index) => boxes.current[Math.min(index, length - 1)]?.focus()

  function update(next) {
    latest.current = next
    onChange(next)
    focusBox(next.length)
  }

  const fillFrom = (index, digits) => update((latest.current.slice(0, index) + digits).slice(0, length))

  return (
    <div className="auth-code" role="group" aria-label="Verification code" data-invalid={invalid || undefined}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el
          }}
          value={value[i] ?? ''}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onFocus={(e) => {
            const next = Math.min(latest.current.length, length - 1)
            if (i !== next) focusBox(next)
            else e.target.select()
          }}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            if (digits) fillFrom(i, digits)
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Backspace') return
            e.preventDefault()
            if (latest.current) update(latest.current.slice(0, -1))
          }}
          onPaste={(e) => {
            const digits = e.clipboardData.getData('text').replace(/\D/g, '')
            if (!digits) return
            e.preventDefault()
            fillFrom(0, digits)
          }}
        />
      ))}
    </div>
  )
}
