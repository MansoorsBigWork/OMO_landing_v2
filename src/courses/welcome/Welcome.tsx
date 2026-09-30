import { useCallback } from "react";
import { useRouteTransition } from "../shared/components/RouteTransition";
import Slideshow from "./Slideshow";
import type { Omoship } from "../types";
import { capture } from "../shared/lib/analytics";
import { recordWelcomeSeen } from "../shared/lib/progressStore";
import "./welcome.css";

/* Shown once after enrolment: what the student will get out of finishing.
   Deep links render normally even when it has been seen before. */

export default function Welcome({ omoship }: { omoship: Omoship }) {
  const { transitionTo } = useRouteTransition();

  const onExit = useCallback(
    (kind: "completed" | "skipped", fromSlide: number) => {
      /* Fire and forget: the write never blocks navigation. */
      recordWelcomeSeen(omoship.slug);
      if (kind === "completed") capture("welcome_completed");
      else capture("welcome_skipped", { slide: fromSlide });
      transitionTo(`/portal/omoships/${omoship.slug}/intro`);
    },
    [omoship, transitionTo],
  );

  return <Slideshow omoship={omoship} onExit={onExit} />;
}
