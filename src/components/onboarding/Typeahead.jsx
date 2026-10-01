import { useId, useMemo, useState } from 'react'

const MAX_SUGGESTIONS = 8

/* Type-to-search input (ARIA combobox). `options` are { code, name }; picking one sets both,
   typing anything else keeps the typed name with no code, so unlisted answers are still allowed. */
export default function Typeahead({ label, hint, options, value, onChange, loading }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const query = value.name.trim().toLowerCase()
  const suggestions = useMemo(() => {
    if (!query || !options) return []
    return options.filter((option) => option.name.toLowerCase().includes(query)).slice(0, MAX_SUGGESTIONS)
  }, [options, query])

  const expanded = open && suggestions.length > 0

  function type(name) {
    // An exact match counts as picking it, so the code isn't lost for someone who typed the full name
    const exact = options?.find((option) => option.name.toLowerCase() === name.trim().toLowerCase())
    onChange({ name, code: exact?.code ?? null })
    setOpen(true)
    setActive(-1)
  }

  function pick(option) {
    onChange({ name: option.name, code: option.code })
    setOpen(false)
    setActive(-1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActive((index) => (suggestions.length ? (index + 1) % suggestions.length : -1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => (suggestions.length ? (index <= 0 ? suggestions.length - 1 : index - 1) : -1))
    } else if (event.key === 'Enter' && expanded && active >= 0) {
      event.preventDefault()
      pick(suggestions[active])
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault()
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="ob-field ob-typeahead">
      <label htmlFor={id}>{label}</label>
      <div className="ob-combo">
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
          aria-describedby={`${id}-hint`}
          value={value.name}
          onChange={(event) => type(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        <ul className="ob-suggestions ph-no-capture" id={`${id}-list`} role="listbox" aria-label={label} hidden={!expanded}>
          {suggestions.map((option, index) => (
            <li
              key={option.code}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'is-active' : undefined}
              // mousedown fires before the input's blur closes the list
              onMouseDown={(event) => {
                event.preventDefault()
                pick(option)
              }}
            >
              {option.name}
            </li>
          ))}
        </ul>
      </div>
      <p className="ob-hint" id={`${id}-hint`}>
        {loading ? 'Loading the list…' : hint}
      </p>
    </div>
  )
}
