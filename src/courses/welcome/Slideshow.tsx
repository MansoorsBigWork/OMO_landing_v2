import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../shared/components/Button";
import type { Omoship } from "../types";
import { resolvePlaceholders, slides, welcomeCopy } from "./copy";
import { capture } from "../shared/lib/analytics";
import SlideVisual from "./Visuals";
import BlurWords from "../shared/motion/BlurWords";
import Backdrop from "./Backdrop";

/* The welcome slideshow. Carousel structure restyled from the 21st.dev
   Onboarding Dialog starting point (grid-stacked slides, dot buttons) to
   the OMO tokens and Brief 3's behaviour: 320ms slide and fade (cross-
   fade under reduced motion), arrow keys, Escape to skip, swipe, focus
   held on the primary button, and a polite live region per change. */

interface SlideshowProps {
  omoship: Omoship;
  onExit: (kind: "completed" | "skipped", fromSlide: number) => void;
}

const TRANSITION_MS = 320;

export default function Slideshow({ omoship, onExit }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<{ index: number; dir: 1 | -1 } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const primaryRef = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const last = slides.length - 1;

  const goTo = useCallback(
    (next: number, focusPrimary: boolean) => {
      setIndex((current) => {
        const clamped = Math.max(0, Math.min(last, next));
        if (clamped === current) return current;
        const dir: 1 | -1 = clamped > current ? 1 : -1;
        setLeaving({ index: current, dir });
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = window.setTimeout(() => setLeaving(null), TRANSITION_MS);
        const slide = slides[clamped];
        setAnnouncement(
          welcomeCopy.ui.liveRegion
            .replace("{n}", String(clamped + 1))
            .replace("{total}", String(slides.length))
            .replace("{title}", resolvePlaceholders(slide.title, omoship)),
        );
        capture("welcome_viewed", { slide: clamped });
        if (focusPrimary) requestAnimationFrame(() => primaryRef.current?.focus());
        return clamped;
      });
    },
    [last, omoship],
  );

  useEffect(() => {
    capture("welcome_viewed", { slide: 0 });
    return () => window.clearTimeout(leaveTimer.current);
  }, []);

  const skip = useCallback(() => {
    onExit("skipped", index);
  }, [onExit, index]);

  const advance = useCallback(() => {
    if (index === last) onExit("completed", index);
    else goTo(index + 1, true);
  }, [index, last, onExit, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1, true);
      else if (e.key === "ArrowLeft") goTo(index - 1, true);
      else if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo, skip]);

  const slide = slides[index];

  const renderSlide = (i: number, state: "current" | "leaving", dir: 1 | -1) => {
    const s = slides[i];
    return (
      <article
        key={`${i}-${state}`}
        className={`welcome-slide ${state === "current" ? (leaving ? `slide-enter dir-${dir}` : "is-settled") : `slide-exit dir-${dir}`}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${slides.length}`}
        aria-hidden={state === "leaving" || undefined}
      >
        <p className="welcome-eyebrow slide-child" style={{ animationDelay: "60ms" }}>
          {s.eyebrow}
        </p>
        <h1 className="welcome-title">
          <BlurWords text={resolvePlaceholders(s.title, omoship)} />
        </h1>
        <p className="welcome-body slide-child" style={{ animationDelay: "240ms" }}>
          {resolvePlaceholders(s.body, omoship)}
        </p>
        <div className="welcome-visual slide-child" style={{ animationDelay: "360ms" }}>
          <SlideVisual visual={s.visual} omoship={omoship} />
        </div>
      </article>
    );
  };

  return (
    <div
      className="welcome-page"
      role="region"
      aria-roledescription="carousel"
      aria-label={welcomeCopy.ui.carouselLabel}
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          goTo(index + (dx < 0 ? 1 : -1), false);
        }
      }}
    >
      <Backdrop />
      <div className="welcome-stage">
        {leaving && renderSlide(leaving.index, "leaving", leaving.dir)}
        {renderSlide(index, "current", leaving?.dir ?? 1)}
      </div>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <div className="welcome-bar">
        <Button variant="text" onClick={skip}>
          {welcomeCopy.ui.skip}
        </Button>
        <div className="welcome-dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`welcome-dot${i === index ? " is-current" : ""}`}
              aria-label={welcomeCopy.ui.dotLabel
                .replace("{n}", String(i + 1))
                .replace("{title}", resolvePlaceholders(s.title, omoship))}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i, false)}
            />
          ))}
        </div>
        <Button ref={primaryRef} onClick={advance}>
          {index === last ? welcomeCopy.ui.start : welcomeCopy.ui.next}
        </Button>
      </div>
    </div>
  );
}
