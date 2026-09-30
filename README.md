# OMO landing site

The onemillionopportunities.com landing page, privacy policy, sign-in portal and OMOship courses, built with React 19 and Vite, with Supabase for accounts and course progress.

## Develop

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key (Supabase → Project Settings → API).
3. `npm run dev`

Without the Supabase values the public pages still work; sign-in shows a "not set up yet" message.

`npm run typecheck` runs TypeScript over the whole app (the course code is TypeScript; the rest is JavaScript and is not checked).

## Build

```sh
npm run build    # outputs to dist/
npm run preview  # serves the built site locally
```

## Routes

- `/` — landing page ([src/pages/Home.jsx](src/pages/Home.jsx))
- `/privacypolicies` — privacy policy ([src/pages/PrivacyPolicy.jsx](src/pages/PrivacyPolicy.jsx))
- `/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password` — sign-in screens ([src/pages/auth/](src/pages/auth/)), backed by Supabase Auth via [src/lib/auth.js](src/lib/auth.js)
- `/portal` — signed-in area ([src/pages/Portal.jsx](src/pages/Portal.jsx)), behind [src/components/RequireAuth.jsx](src/components/RequireAuth.jsx)
- `/portal/omoships/<slug>/*` — an OMOship course ([src/courses/](src/courses/), see its [README](src/courses/README.md))

## Database

Migration 001 (roles, profiles, the `cvs` bucket) is live and was applied by hand. [supabase/migrations/003_omoships.sql](supabase/migrations/003_omoships.sql) adds organisations, OMOships, enrolments, progress, submissions and the `submissions` bucket; paste it once into Supabase → SQL Editor before deploying a version that needs it. The schema is described in OMO's database brief (25 September 2026).

## Deploying

[netlify.toml](netlify.toml) builds with `npm run build`, publishes `dist/`, and rewrites every path to `index.html` so routes like `/privacypolicies` load on a direct visit. On any other host, set up the equivalent single-page-app fallback.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment variables too (Netlify → Site configuration → Environment variables); they're read at build time.
