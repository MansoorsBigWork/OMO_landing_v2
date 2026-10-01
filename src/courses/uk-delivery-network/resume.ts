import { slides } from "./pathfinding/data";
import { ukDeliveryNetwork as course } from "./course";
import {
  hasCompletedIntro,
  hasCompletedTask,
  hasSeenInterlude,
  hasSeenWelcome,
  isEnrolled,
  readTaskState,
} from "../shared/lib/progressStore";

/* Where "Continue" takes a student: the furthest stage they have reached,
   in the order the course runs. Read from the progress store, so it must
   be called after loadProgress (every course page already is). */

const BASE = `/portal/omoships/${course.slug}`;
const PATHFINDING = "week-1-pathfinding";

export function resumePath(): string {
  const slug = course.slug;
  if (!isEnrolled(slug)) return BASE;
  if (!hasSeenWelcome(slug)) return `${BASE}/welcome`;
  if (!hasCompletedIntro(slug)) return `${BASE}/intro`;
  if (!hasCompletedTask(slug, PATHFINDING)) {
    /* The first slide whose statements are not all locked is the one they were on */
    const state = readTaskState(slug, PATHFINDING);
    const index = slides.findIndex((s) => (state[s.id]?.locked?.length ?? 0) < s.statements.length);
    return index > 0 ? `${BASE}/week-1/pathfinding?slide=${slides[index].id}` : `${BASE}/week-1/pathfinding`;
  }
  if (!hasSeenInterlude(slug)) return `${BASE}/week-1/interlude`;
  return `${BASE}/week-1/build`;
}
