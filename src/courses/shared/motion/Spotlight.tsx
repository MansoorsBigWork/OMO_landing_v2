import { useRef, type PropsWithChildren } from "react";

/* Pointer-tracking surface highlight, ported from react-bits
   SpotlightCard (reactbits.dev) and restyled to the OMO tokens: a soft
   Electric Blue wash that follows the cursor across a card. Hover only,
   so it costs nothing on touch devices or under reduced motion. */

interface SpotlightProps extends PropsWithChildren {
  className?: string;
}

export default function Spotlight({ className, children }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`spotlight${className ? ` ${className}` : ""}`}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      }}
    >
      {children}
    </div>
  );
}
