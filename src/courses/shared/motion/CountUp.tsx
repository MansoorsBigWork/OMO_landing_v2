import { useEffect, useRef, useState } from "react";

/* Count-up number, ported from react-bits CountUp (reactbits.dev) as a
   dependency-free rAF port. Eases out over 700ms on mount; renders the
   final value immediately under reduced motion. */

export default function CountUp({ to, duration = 700 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);

  return <>{value}</>;
}
