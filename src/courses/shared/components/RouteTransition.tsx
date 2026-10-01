import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router";

/* Route transition ported from react-bits PixelTransition (reactbits.dev)
   as a dependency-free CSS port: a grid of canvas-shade cells covers the
   screen with a random stagger, the route swaps underneath, and the grid
   falls away. Under reduced motion it is a plain 200ms fade. */

const COLS = 12;
const ROWS = 8;
const STAGGER_MS = 300;
const CELL_MS = 180;
const HOLD_MS = 120;

interface RouteTransitionApi {
  transitionTo: (path: string) => void;
}

const TransitionContext = createContext<RouteTransitionApi>({ transitionTo: () => {} });

export function useRouteTransition(): RouteTransitionApi {
  return useContext(TransitionContext);
}

interface Cell {
  delay: number;
  tint: boolean;
}

export function RouteTransitionProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "prep" | "cover" | "reveal">("idle");
  const busy = useRef(false);

  const cells = useMemo<Cell[]>(
    () =>
      Array.from({ length: COLS * ROWS }, () => ({
        delay: Math.random() * STAGGER_MS,
        tint: Math.random() < 0.14,
      })),
    [],
  );

  const transitionTo = useCallback(
    (path: string) => {
      if (busy.current) return;
      busy.current = true;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coverMs = reduced ? 200 : STAGGER_MS + CELL_MS;
      /* Mount the grid in its resting state first so the cover class
         change actually transitions. */
      setPhase("prep");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setPhase("cover");
          window.setTimeout(() => {
            navigate(path);
            window.setTimeout(() => {
              setPhase("reveal");
              window.setTimeout(() => {
                setPhase("idle");
                busy.current = false;
              }, coverMs + 40);
            }, HOLD_MS);
          }, coverMs + 40);
        }),
      );
    },
    [navigate],
  );

  const api = useMemo(() => ({ transitionTo }), [transitionTo]);

  return (
    <TransitionContext.Provider value={api}>
      {children}
      {phase !== "idle" && (
        <div className={`route-transition is-${phase}`} aria-hidden="true">
          {cells.map((cell, i) => (
            <span
              key={i}
              className={cell.tint ? "rt-cell is-tint" : "rt-cell"}
              style={{ transitionDelay: `${cell.delay}ms` }}
            />
          ))}
        </div>
      )}
    </TransitionContext.Provider>
  );
}
