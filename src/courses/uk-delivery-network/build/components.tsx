import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import { buildCopy } from "./data";
import { capture } from "../../shared/lib/analytics";

/* Small dark-page components. The code block reuses the VS Code editor
   treatment from the pathfinding panel; the copy confirmation tick is
   the one deliberate animation on the page. */

export function CodeBlock({
  code,
  label,
  event,
  copyable = true,
}: {
  code: string;
  label?: string;
  event?: string;
  /* Output shown for reading, not a command to run, renders without Copy */
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!copyable) {
    return (
      <div className="bp-code">
        {label && <span className="bp-code-label">{label}</span>}
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  return (
    <div className="bp-code">
      {label && <span className="bp-code-label">{label}</span>}
      <button
        type="button"
        className="bp-copy"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          if (event) capture(event);
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {buildCopy.copied}
          </>
        ) : (
          buildCopy.copy
        )}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Callout({ variant, title, children }: PropsWithChildren<{ variant: "rules" | "ai" | "assessment"; title: string }>) {
  return (
    <aside className={`bp-callout is-${variant}`}>
      <h4>{title}</h4>
      {children}
    </aside>
  );
}

export function StatusChip({ label }: { label: string }) {
  return <span className="bp-chip">{label}</span>;
}

interface ChecklistItemProps {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export function ChecklistItem({ id, checked, onToggle, children }: ChecklistItemProps) {
  return (
    <li className="bp-check-item">
      <label>
        <input type="checkbox" checked={checked} onChange={() => onToggle(id)} />
        <span className="bp-check-box" aria-hidden="true">
          {checked && (
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </span>
        <span className="bp-check-body">{children}</span>
      </label>
    </li>
  );
}
