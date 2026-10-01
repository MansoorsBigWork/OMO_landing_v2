import { useEffect, useState, type RefObject } from "react";
import type { PlayheadController } from "./usePlayhead";
import { sceneEnd, CUES } from "./composition";

/* Watches the reading sections and sets the playhead TARGET to the
   keyframe of the section crossing the vertical centre of the viewport.
   Scroll only ever touches the target, never the playhead (Brief 2, 3.3). */

export function useSectionTarget(
  controller: PlayheadController,
  containerRef: RefObject<HTMLElement | null>,
): number {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-section-keyframe]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const kf = el.dataset.sectionKeyframe as string;
          if (CUES[kf] !== undefined) {
            controller.setTarget(sceneEnd(kf));
            setCurrentIndex(sections.indexOf(el));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [controller, containerRef]);

  return currentIndex;
}
