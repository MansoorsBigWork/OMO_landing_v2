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
- `/onboarding` — first-login questions for students ([src/pages/Onboarding.jsx](src/pages/Onboarding.jsx)); students go here until they finish it
- `/omoships` — the student dashboard ([src/pages/OMOships.jsx](src/pages/OMOships.jsx))
- `/portal` — signed-in area for employers and admins ([src/pages/Portal.jsx](src/pages/Portal.jsx)), behind [src/components/RequireAuth.jsx](src/components/RequireAuth.jsx); students are redirected to `/omoships`
- `/portal/omoships/<slug>/*` — an OMOship course ([src/courses/](src/courses/), see its [README](src/courses/README.md))

## Database

Migration 001 (roles, profiles, the `cvs` bucket) is live and was applied by hand. [supabase/migrations/003_omoships.sql](supabase/migrations/003_omoships.sql) adds organisations, OMOships, enrolments, progress, submissions and the `submissions` bucket; paste it once into Supabase → SQL Editor before deploying a version that needs it. The schema is described in OMO's database brief (25 September 2026). Migration 002 (onboarding columns and `complete_student_onboarding`) is needed for `/onboarding` and the dashboard greeting.

## Onboarding reference data

The university and subject search on `/onboarding` reads two static files, loaded only on that page:

- [src/data/uk-providers.json](src/data/uk-providers.json) — `{ ukprn, name }`, from the official UK register of higher education providers
- [src/data/hecos.json](src/data/hecos.json) — `{ code, name }`, from HESA's HECoS vocabulary

Both currently hold **10 sample entries** so the search works during development. Regenerate them from the official CSVs before launch:

```sh
node scripts/build-reference-data.mjs providers path/to/providers.csv
node scripts/build-reference-data.mjs hecos path/to/hecos.csv
```

The script finds the code and name columns by header (`UKPRN` / `Provider name`, `Code` / `Label`). If a CSV names them differently, pass `--code "<header>" --name "<header>"`. Rows without a valid code (8 digits starting with 1 for UKPRNs, 6 digits for HECoS) are skipped and counted.

## Deploying

[netlify.toml](netlify.toml) builds with `npm run build`, publishes `dist/`, and rewrites every path to `index.html` so routes like `/privacypolicies` load on a direct visit. On any other host, set up the equivalent single-page-app fallback.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment variables too (Netlify → Site configuration → Environment variables); they're read at build time.
