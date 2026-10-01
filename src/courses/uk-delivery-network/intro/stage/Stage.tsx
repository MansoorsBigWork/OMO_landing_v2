import { useEffect, useRef, useState } from "react";
import type { PlayheadController } from "./usePlayhead";
import { sceneAt } from "./composition";
import MapStage, { STAGE_W, STAGE_H } from "./MapStage";

/* The sticky stage panel. The 960 by 1200 composition is scaled to fit
   its half of the page and re-rendered from T; the playhead controller
   owns T and scroll never touches it directly. */

interface StageProps {
  controller: PlayheadController;
  label: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function Stage({ controller, label }: StageProps) {
  const [T, setT] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const lastSceneRef = useRef("K0");

  useEffect(() => {
    return controller.subscribe((playhead, target) => {
      if (reducedRef.current) {
        /* Reduced motion: render the target's static state and fade
           between states instead of animating (Brief 2, 3.6). */
        const scene = sceneAt(target);
        if (scene !== lastSceneRef.current) {
          lastSceneRef.current = scene;
          panelRef.current?.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], {
            duration: 300,
            easing: "ease-in-out",
          });
        }
        if (playhead !== target) controller.jumpTo(target);
        setT(target);
        return;
      }
      setT(playhead);
    });
  }, [controller]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const scale = Math.min(w / STAGE_W, h / STAGE_H);
      setFit({ scale, x: (w - STAGE_W * scale) / 2, y: (h - STAGE_H * scale) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={panelRef} className="map-stage-panel" role="img" aria-label={label}>
      <div
        className="map-stage-fit"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`,
        }}
      >
        <MapStage T={T} />
      </div>
    </div>
  );
}
