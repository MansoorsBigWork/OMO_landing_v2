# OMOship courses

Student-facing course pages, mounted inside the signed-in portal at `/portal/omoships/<slug>`. Each OMOship is a self-contained folder here that the portal loads lazily, so adding a course never grows the bundle for students who do not open it.

## Layout

```
src/courses/
  index.ts                 registry: course data plus a lazy import of its routes, and COURSE_BASE
  types.ts                 the Omoship data shape
  CourseShell.tsx          the mount: loads the student's progress, then renders the course's routes
  shared/                  used by every course
    components/            Button, RouteTransition
    lib/                   progressStore (Supabase), analytics (PostHog)
    motion/                BlurWords, CountUp, Spotlight
    styles/                tokens.css (brand palette), app.css (base, scoped to .course)
  welcome/                 post-enrolment slideshow, shared by all courses
  ai-interlude/            the AI message stage, shared by all courses
  uk-delivery-network/     The Last Mile course
    course.ts              all course copy and metadata
    routes.tsx             the course's route tree and layout (sections sidebar)
    nav/                   course sections sidebar
    overview/              course page with the enrol flow
    intro/                 guided tour: reading column, map stage, questions
    pathfinding/           task 1: simulation, walkthrough, sort phase, search engine
    build/                 the project brief, starter file tree and submission form
scripts/                   generators for map-geo.ts and city-grid.json, physics check
```

## How a course is mounted

[App.jsx](../App.jsx) has one route, `/portal/omoships/:slug/*`, inside `RequireAuth`. [CourseShell.tsx](CourseShell.tsx) looks the slug up in the registry, calls `loadProgress(userId, slug)` so every page can read progress synchronously, wraps the routes in `RouteTransitionProvider`, and renders them under a `.course` root that carries the course's base styles.

Course pages link to each other with the full `/portal/omoships/<slug>/...` path.

## Progress and submissions

[shared/lib/progressStore.ts](shared/lib/progressStore.ts) is the only file that talks to Supabase. It looks the course up in `omoships` by slug, then keeps an in-memory copy of the student's rows:

- `enrolments`: one row per student per OMOship.
- `omoship_progress`: key/value rows (welcome seen, intro answers, task state, completions).
- `submissions`: one row per student per OMOship, holding the repository and video links. Students can replace the links until the deadline or until OMO starts marking. Scores and feedback are never readable from this table in the browser.
- `submission_results`: a view that shows a student their score and feedback once the status is `released`.

Reads are synchronous. Writes update the copy at once and are queued to Supabase in order; enrolment and submission are awaited so the student sees an error if they fail. The deadline is the OMOship's `deadline` column, or 14 days from enrolment when that is null. The tables, policies, the `mark_submission` function for admins and the `submissions` bucket are in [supabase/migrations/003_omoships.sql](../../supabase/migrations/003_omoships.sql).

Analytics events go to `window.posthog` when it exists and are dropped otherwise.

## Adding a course

1. Create `src/courses/<slug>/` with a `course.ts` exporting an `Omoship` and a `routes.tsx` exporting the route tree as default.
2. Reuse `welcome/Welcome` and `ai-interlude/Interlude` by passing the course as the `omoship` prop.
3. Add one entry to `index.ts`. The portal lists it automatically.

## Scripts

```
npm run typecheck
node scripts/generate-map-geo.mjs                          regenerates uk-delivery-network/intro/stage/map-geo.ts
node --experimental-strip-types scripts/rasterise-city.ts  regenerates uk-delivery-network/pathfinding/assets/city-grid.json
node --experimental-strip-types scripts/test-burst.mjs     validates the interlude physics
```

## Copy and brand rules

- British English. No em dashes in copy or comments. No exclamation marks.
- Never "work simulation": say "access the experience of work remotely" or "project-based work experience". Never "recruit": say "onboard".
- Colours resolve to the tokens in `shared/styles/tokens.css` or a tint or shade of them. Amber is the single action colour, at most once per section, and never on the same element as blue. Focus rings are blue.
- Body text is ash on canvas; no pure black or pure white.
