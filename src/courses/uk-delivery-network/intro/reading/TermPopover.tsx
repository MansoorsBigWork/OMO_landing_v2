import { useEffect, useId, useRef, useState } from "react";
import { glossary } from "../data";

/* An inline glossary term: dotted blue underline, definition in a
   popover on hover, focus or click. The definition is always in the
   accessibility tree via aria-describedby. */

interface TermPopoverProps {
  slug: string;
  display?: string;
}

export default function TermPopover({ slug, display }: TermPopoverProps) {
  const entry = glossary[slug];
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  /* Keep the bubble inside the viewport: before it shows, measure how
     far its centred position would overflow and shift it by that much.
     The mobile bottom sheet ignores the shift. */
  const place = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const centre = rect.left + rect.width / 2;
    const pad = 16;
    const half = Math.min(288, window.innerWidth - pad * 2) / 2;
    let shift = 0;
    if (centre - half < pad) shift = pad - (centre - half);
    else if (centre + half > window.innerWidth - pad) shift = window.innerWidth - pad - (centre + half);
    wrap.style.setProperty("--pop-shift", `${Math.round(shift)}px`);
  };

  if (!entry) return <>{display ?? slug}</>;

  return (
    <span className={`term${open ? " is-open" : ""}`} ref={wrapRef} onMouseEnter={place} onFocus={place}>
      <button
        type="button"
        className="term-button"
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => {
          place();
          setOpen((v) => !v);
        }}
      >
        {display ?? entry.inline}
      </button>
      <span role="tooltip" id={id} className="term-pop">
        <strong>{entry.front}</strong> {entry.back}
      </span>
    </span>
  );
}
