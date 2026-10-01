import { useEffect, useId, useRef, useState } from 'react'

// Sections that don't have pages yet: shown so students can see what's coming, but not clickable
const SECTIONS = [
  { label: 'Information', icon: 'M12 11v6M12 7.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { label: 'Achievements', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3' },
  { label: 'Results', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]
const LOG_OUT_ICON = 'M15 12H3M7 8l-4 4 4 4M11 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8'

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

function initialsOf(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
}

/* Round avatar in the header that opens the account menu (menu-button pattern: arrows, Home/End, Escape). */
export default function ProfileMenu({ name, email, onSignOut }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const itemsRef = useRef([])
  const initials = initialsOf(name)

  // Close on a click or tap anywhere else
  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  // Focus the first enabled item when the menu opens
  useEffect(() => {
    if (open) itemsRef.current.find((item) => item && !item.disabled)?.focus()
  }, [open])

  function closeAndReturnFocus() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleMenuKeyDown(event) {
    const items = itemsRef.current.filter((item) => item && !item.disabled)
    const index = items.indexOf(document.activeElement)
    const moveTo = (next) => {
      event.preventDefault()
      items[(next + items.length) % items.length]?.focus()
    }
    if (event.key === 'ArrowDown') moveTo(index + 1)
    else if (event.key === 'ArrowUp') moveTo(index - 1)
    else if (event.key === 'Home') moveTo(0)
    else if (event.key === 'End') moveTo(items.length - 1)
    else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndReturnFocus()
    } else if (event.key === 'Tab') setOpen(false)
  }

  return (
    <div className="pm" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="pm-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label="Your account"
        onClick={() => setOpen((shown) => !shown)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        {initials ? <span className="ph-no-capture">{initials}</span> : <Icon d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />}
      </button>

      {open && (
        <div className="pm-menu" id={`${id}-menu`} role="menu" aria-label="Your account" onKeyDown={handleMenuKeyDown}>
          <div className="pm-who ph-no-capture">
            <span className="pm-avatar pm-avatar-lg" aria-hidden="true">{initials || '?'}</span>
            <div>
              <p className="pm-name">{name || 'Your account'}</p>
              {email && <p className="pm-email">{email}</p>}
            </div>
          </div>

          {SECTIONS.map(({ label, icon }, index) => (
            <button
              key={label}
              ref={(el) => (itemsRef.current[index] = el)}
              type="button"
              role="menuitem"
              className="pm-item"
              aria-disabled="true"
              tabIndex={-1}
            >
              <Icon d={icon} />
              <span>{label}</span>
              <span className="pm-soon">Soon</span>
            </button>
          ))}

          <div className="pm-divider" role="separator" />
          <button
            ref={(el) => (itemsRef.current[SECTIONS.length] = el)}
            type="button"
            role="menuitem"
            className="pm-item pm-item-danger"
            tabIndex={-1}
            onClick={onSignOut}
          >
            <Icon d={LOG_OUT_ICON} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  )
}
