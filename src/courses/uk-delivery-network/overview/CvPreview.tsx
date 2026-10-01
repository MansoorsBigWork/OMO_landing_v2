import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../shared/components/Button";
import { capture } from "../../shared/lib/analytics";
import { cvCopy, cvPlainText, cvTemplates, type CvTemplate } from "./cv";

/* "See this on your CV": a dialog with two tabs, software engineering and
   data, each a finished CV entry the student can copy. Escape closes, focus
   returns to the button that opened it. */

export default function CvPreview() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<CvTemplate["id"]>("software");
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copiedTimer = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const template = cvTemplates.find((t) => t.id === active) ?? cvTemplates[0];

  const copy = () => {
    void navigator.clipboard?.writeText(cvPlainText(template));
    capture("cv_template_copied", { version: template.id });
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        className="cv-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          capture("cv_template_opened");
          setOpen(true);
        }}
      >
        {cvCopy.trigger}
      </Button>

      {open && (
        <>
          <div className="cv-backdrop" onClick={close} aria-hidden="true" />
          <div ref={dialogRef} className="cv-dialog" role="dialog" aria-modal="true" aria-labelledby="cv-title">
            <header className="cv-head">
              <div>
                <h2 id="cv-title">{cvCopy.title}</h2>
                <p className="cv-lead">{cvCopy.lead}</p>
              </div>
              <button type="button" className="cv-close" onClick={close} aria-label={cvCopy.close}>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="cv-tabs" role="tablist" aria-label={cvCopy.tablist}>
              {cvTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`cv-tab-${t.id}`}
                  aria-selected={t.id === active}
                  aria-controls="cv-panel"
                  tabIndex={t.id === active ? 0 : -1}
                  className={`cv-tab${t.id === active ? " is-active" : ""}`}
                  onClick={() => {
                    setActive(t.id);
                    setCopied(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    const i = cvTemplates.findIndex((x) => x.id === active);
                    const next = cvTemplates[(i + (e.key === "ArrowRight" ? 1 : cvTemplates.length - 1)) % cvTemplates.length];
                    setActive(next.id);
                    setCopied(false);
                    document.getElementById(`cv-tab-${next.id}`)?.focus();
                  }}
                >
                  {t.tab}
                </button>
              ))}
            </div>

            <div id="cv-panel" role="tabpanel" aria-labelledby={`cv-tab-${template.id}`} className="cv-entry">
              <p className="cv-entry-heading">{template.heading}</p>
              <p className="cv-entry-sub">{template.subheading}</p>
              <ul>
                {template.bullets.map((b) => (
                  <li key={b.slice(0, 40)}>{b}</li>
                ))}
              </ul>
            </div>

            <footer className="cv-foot">
              <button type="button" className={`cv-copy${copied ? " is-copied" : ""}`} onClick={copy}>
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {cvCopy.copied}
                  </>
                ) : (
                  cvCopy.copy
                )}
              </button>
              <p className="visually-hidden" aria-live="polite">
                {copied ? cvCopy.copied : ""}
              </p>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
