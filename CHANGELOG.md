# Changelog

## 1 October 2026: dashboard and course branches joined

The onboarding and dashboard work (`omoship_tile_design`) is merged into `omoship_integration`, and the two reconciled:

- **One header.** `PortalBar` is the signed-in top bar everywhere: students get the round account menu, employers and admins the email and Sign out. `PortalHeader` now delegates to it, so the dashboard, onboarding, portal and course pages match.
- **The map tile is the dashboard tile.** `/omoships` renders `OmoshipTile` for every course in the registry, with its status pill from the enrolment and submission rows. The stylised route card and its progress ring are gone from live courses; coming-soon teasers are unchanged.
- **Profile page** at `/profile`, reached from "Profile" in the account menu. The editor now writes the onboarding columns (`subject_name`, `first_name` alongside `full_name`) and uses the shared LinkedIn normaliser, and keeps the CV upload, which onboarding does not collect. `getCurrentUser` reads `bio` again.
- The `/portal` text corruption from the tile branch is fixed.
- **Still outstanding:** migration 002 (onboarding columns and `complete_student_onboarding`) is not in `supabase/migrations/`; sign-in fails for every role until it has been applied. The onboarding search data holds ten sample rows each; `src/data/universities.js` and `degree-subjects.js` hold the full lists the profile page uses.

---

## 1 October 2026: portal tile, top bar, profile editing and course polish

### Portal

- **OMOship tile** (`src/components/OmoshipTile.jsx`): the student view's course list is now one tile per course, a window onto the course's own UK map with title, sector, hours, status and the way in. The hub pulses idle; on hover the trunk routes draw on and a parcel rides them (ports of react-bits GlareHover; the TiltedCard tilt was tried and removed).
- **Top bar everywhere signed in** (`src/components/PortalBar.jsx`): the portal header is a shared component and now stays on every course page. The course ribbon hangs from its bottom rule, and the course's sticky and full-screen parts (intro stage, build header, interlude) sit below it.
- **Profile editing is live** (`src/components/StudentProfileCard.jsx`, `src/lib/profile.js`). Name, university, course and graduation year are required; bio, LinkedIn and CV are optional and marked Recommended, with a note that verified employers can see the profile. University and course are selects preloaded with UK universities (`src/data/universities.js`) and common degree subjects (`src/data/degree-subjects.js`), each with an Other option that opens a text box. The CV is a PDF up to 5 MB uploaded to the private `cvs` bucket at `<user_id>/<filename>`; only that path is stored in `student_profiles.cv_path`, one file per student (the previous file is deleted on replace), and it opens through a 60-second signed URL. No schema change: migration 001's tables, policies and bucket already cover it.
- `RequireAuth` now passes `updateUser` through the outlet context so a saved profile shows without a reload.

### Course

- Removed the "Back" links from the intro, pathfinding and build pages, and the two replay links on the overview; the sections ribbon is the way around. The ribbon is hidden on the overview until the student enrols.
- Intro question options and pathfinding sort statements are shuffled per student (`src/courses/shared/lib/shuffle.ts`, seeded by student id plus question or slide id, so the order is stable across reloads).
- The overview's description and "What you will do" now describe the course as built, in plain terms: the parcel's journey and the five algorithms, then the Kestrel Parcels brief, the code project, the scored test days, and the GitHub plus two-minute Drive video submission.
- **CV preview** on the overview (`overview/CvPreview.tsx`, copy in `overview/cv.ts`): "See this on your CV" opens two ready-to-paste CV entries, one for software roles and one for data roles, each with a copy button.

---
## 1 October 2026: Student onboarding and the OMOships dashboard

- **Onboarding** (`/onboarding`): students who haven't finished it are sent there after sign-in and from every signed-in page, including courses (`RequireAuth` now checks too). Seven one-question screens, saved in one call to `complete_student_onboarding`. Needs migration 002.
- **Dashboard** (`/omoships`): where students land once onboarded. Time-of-day greeting ("Welcome to OMO, {name}" on the first visit, which sets `profiles.welcomed_at`), OMOship tiles (The Last Mile opens `/portal/omoships/uk-delivery-network`), a progress ring from the course's enrolment and submission rows (Not started, In progress, Submitted, Results out), blurred coming-soon tiles, a profile menu and a footer.
- **Portal:** students are redirected from `/portal` to their dashboard, so the student OMOships card moved there as the tile's progress ring. Employers and admins see the portal as before.
- **Analytics:** PostHog masks every input in session recordings; names, emails and onboarding answers are excluded from recordings, and onboarding events carry step numbers only.


## 25 September 2026: The Last Mile OMOship in the portal

The first course, "The Last Mile: Inside the UK Delivery Network", now lives in this app under `/portal/omoships/uk-delivery-network`. It was built as a standalone Vite app (`OMO_delivery_network`) and has been folded in as `src/courses/`. Enrolments, progress and submissions are stored in Supabase.

---

### Before you deploy: required configuration

- **Supabase:** paste [supabase/migrations/003_omoships.sql](supabase/migrations/003_omoships.sql) into SQL Editor and run it once. It is migration 003 from the database brief: `organisations` (and `employer_profiles.organisation_id`), `omoships`, `submissions`, the private `submissions` bucket, plus `enrolments` and `omoship_progress` for the course, and it seeds the first OMOship row. Until it has run, opening a course shows "We couldn't load your progress".
  - Departures from the brief, so the first course works: `omoships.slug` (the course looks its row up by slug), `omoships.deadline` is nullable (null means 14 days from each student's enrolment), and `submissions.repo_url` alongside `project_path` because this course submits a GitHub repository rather than a file.
  - Scores, feedback and status are not readable or writable from the browser on `submissions` (column grants). Students see results through the `submission_results` view once status is `released`; admins mark with `select mark_submission(id, project_score, video_score, project_feedback, video_feedback, 'released')`.
- **Netlify:** nothing new to set. The Content Security Policy in `netlify.toml` now also allows `https://api.github.com`, which the submission form calls to check a repository exists.

---

### Where the course sits

- **Routes** (`src/App.jsx`): `/portal` and `/portal/omoships/:slug/*` are nested under a new `RequireAuth` route (`src/components/RequireAuth.jsx`), which holds the sign-in check that used to live in `Portal.jsx`. Child routes read the user from the outlet context.
- **Course mount:** `src/courses/CourseShell.tsx` loads the student's progress rows, then renders the course's own route tree. Course chunks are lazy: the landing page bundle is unchanged apart from the small course registry.
- **Portal:** the student view's "OMOships" placeholder is now one tile per registered course (`src/components/OmoshipTile.jsx`): a window onto the course's own UK map (the intro stage's geography, cropped to the Midlands and the North) with the title, sector, time commitment, the student's status (Not started, In progress, Submitted, Results out) and the way in. Idle, the national hub pulses; on hover the tile tilts toward the cursor, a glare crosses the map, the trunk routes draw on and a parcel rides them (dependency-free ports of react-bits TiltedCard and GlareHover). Reduced motion and touch get the finished map with no tilt. `getCurrentUser` now returns the user's `id`.
- **Scrolling:** the global scroll-to-top on navigation skips course paths, because the build page restores its own scroll position and the pathfinding task keeps the slide in the URL.

### What changed in the course code

- Moved from `OMO_delivery_network/src/{omoships,shared}` to `src/courses/`, with the stand-in dashboard (`dashboard/`, `App.tsx`, `main.tsx`), its `package.json`, config and nested git repository removed. Generator scripts moved to `scripts/`.
- Imports switched from `react-router-dom` to `react-router` (the package this app already uses) and every course path gained the `/portal` prefix.
- **Removed test elements:** the floating "Reset course" button, the "Reset course" entry in the sections sidebar (replaced by a "Back to your portal" link), the `?debug=1` playhead panel on the intro page and its playback-rate hook, and the "Week 1" placeholder page (the build page's Back link now goes to the course overview).
- **Progress store** (`src/courses/shared/lib/progressStore.ts`) rewritten from localStorage to Supabase. Same function names, so the pages barely changed: reads come from an in-memory copy loaded once per course; writes are queued per key so they land in order. Enrolment and submission are awaited and show an error on failure. The enrol button used to POST to a `/api/enrolments` endpoint that did not exist.
- **Submissions:** one per student per OMOship. The form waits for the row to save, shows "Your submission was not saved" if it did not, only allows resubmission while the status is `submitted`, and shows the total score and feedback once OMO releases them. Video links must now be Google Drive links, as the platform brief requires; the copy and the placeholder changed to match (YouTube and Loom were accepted before).
- **Deadline:** the OMOship's `deadline` column when set, otherwise 14 days from enrolment, enforced in the database as well as the form.
- **Styles:** the course's base stylesheet is scoped to a `.course` root instead of `body`, and restores browser default margins and bare `h1`/`header` styling inside it, because `landing.css` resets margins globally and styles the landing page's header and headline by element. The landing page's `.omoship` class (the orange word in the hero) is renamed `.omoship-word` so it does not collide with the course overview.

### Tooling

- `typescript`, `@types/react` and `@types/react-dom` added as dev dependencies with a root `tsconfig.json`; `npm run typecheck` passes. The Netlify build is still `vite build` and does not gate on types.
- `d3-geo`, `d3-shape` and `topojson-client` added as dev dependencies for the map and city generators in `scripts/`.
- `.gitignore` now also ignores `.DS_Store`, `tsconfig.tsbuildinfo` and the generator's cached `scripts/.countries-50m.json`.

### Still to do

1. An admin screen for marking: for now, staff call `mark_submission(...)` in Supabase's SQL Editor.
2. A waitlist: `course.status` other than `open` disables the enrol button with the waitlist label, but nothing records interest.
3. The submission form's video link is pattern-checked in the browser and by a database constraint only; nothing verifies the link opens.

---

## 15 September 2026: React rebuild, privacy policy and sign-in portal

The site was a single hand-written `index.html`. It is now a React 19 single-page app built with Vite. It has four parts: the landing page, a privacy policy, a sign-in portal backed by Supabase, and PostHog analytics with session replay. Security headers are set for the live site on Netlify.

---

### Before you deploy: required configuration

The site does not work fully until these are set. They live outside the code.

**Netlify**
- The build is now defined in `netlify.toml`: `npm run build`, publish `dist/`, Node 22. Netlify no longer serves `index.html` straight from the repo.
- Add these environment variables under Site configuration → Environment variables. Values come from Supabase → Project Settings → API.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`, the publishable (or legacy "anon") key. Never use the secret / `service_role` key.
- Without these variables the public pages still work, but every sign-in screen shows "Sign-in isn't set up yet".

**Supabase (Authentication settings)**
- **Confirm email** is on, so new accounts must enter an emailed code before they can sign in.
- **Email OTP Length** is **6**. The code screen has exactly 6 boxes, and a longer code cannot be entered.
- The **Confirm signup** and **Reset password** email templates show the code with `{{ .Token }}` and contain **no links** (`{{ .ConfirmationURL }}`). The expiry wording in each email matches the **Email OTP Expiration** setting.
- **Minimum password length** is 8, matching the sign-up form.
- **URL Configuration:** the Site URL is `https://onemillionopportunities.com`. The Redirect URLs include `https://onemillionopportunities.com/reset-password` and `http://localhost:5173/reset-password`.

**PostHog**
- The project is on the **US** cloud (`us.i.posthog.com`), and the privacy policy says so.
- Session replay must be switched on in the PostHog project settings for recordings to appear.

---

### Platform and build

- **Stack:**
  - React `^19.3.0` and React DOM `^19.3.0`
  - React Router `^7.18.3`
  - Vite `^8.3.0` with `@vitejs/plugin-react` `^6.1.1`
  - `@supabase/supabase-js` `^2.116.0`
- **Routes** (`src/App.jsx`):
  - `/`: landing page (`src/pages/Home.jsx`)
  - `/privacypolicies`: privacy policy (`src/pages/PrivacyPolicy.jsx`)
  - `/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password`: sign-in screens (`src/pages/auth/`)
  - `/portal`: signed-in area (`src/pages/Portal.jsx`)
  - any other path redirects to `/`
- **Code splitting:** the portal and sign-in pages load only when visited. The Supabase client, about 56 KB gzipped, ships only in the sign-in bundle, so the landing page doesn't download it. This was checked by building with placeholder keys: the Supabase code landed in the `auth` chunk, and the landing chunk was unchanged.
- **Direct links:** `netlify.toml` rewrites every path to `index.html`, so links such as `/privacypolicies` or `/login` load on a direct visit or refresh.
- **Scrolling:**
  - In-page links (`/#how`, `/#contact`) scroll smoothly to their section, including when clicked from another page.
  - Opening a new page starts at the top.
  - Back/forward keeps the browser's own scroll position.
- **Images:** `assets/omo-logo.png` and `assets/simon-squibb.png` moved to `src/assets/`, so builds fingerprint them for caching.
- **Git and setup files:**
  - `.gitignore` now excludes `node_modules/`, `dist/` and `*.local`, so `.env.local` is never committed.
  - `.env.example` added as a template.
  - `README.md` rewritten with setup, build, routes and deploy notes. It was also converted from UTF-16 to UTF-8 so GitHub displays it.

---

### Landing page

**Port to React**
- The original `index.html` became `src/pages/Home.jsx` with the same design and copy. Styles moved to `src/styles/landing.css`.
- The scroll effects are now React hooks, and all of them respect the "reduce motion" setting:
  - the orange sweep across the four "How it works" cards
  - the 01 → 02 → 03 funnel sweep
  - the cards that slide up over each other
- **Header** (`src/components/Header.jsx`):
  - It is shared with the privacy page: a fixed, translucent bar that gains a shadow once you scroll.
  - Its section links now work from any page.
- **Footer** (`src/components/SiteFooter.jsx`): shared, with a new **Privacy Policy** link. The links wrap on narrow screens.

**Buttons and navigation**
- The orange nav button now reads **Log in** and goes to `/login`. It was "Get an OMOship" and opened the Tally form.
- The hero **Get an OMOship** button and the **Get an OMOship →** button in the "Get experience today" section now go to `/portal`. Signed-out visitors are sent on to `/login`.
- The Tally embed script is removed from the site. The Tally form is still described in the privacy policy, by decision.
- Section labels lost their `//` prefix: now HOW IT WORKS, FOR BUSINESSES, DIFFERENTIATOR, GET STARTED.

**Layout fixes** (checked at 1440px, 1024px and 390px wide)
- **Phone and tablet header:** below 960px the section links are hidden and only the logo and Log in button show. Before, the links ran off the right edge and the sign-up button couldn't be seen.
- **Sideways scrolling on phones:** the page was 15px wider than a phone screen because the glow around the full-width hero button reached past the edge. It's now clipped, and the width matches the screen exactly.
- **White gaps between sections:** as each coloured section slid up over the one before, bare white showed through, up to about 100px on phones. Each section's colour now continues underneath the next, so the rounded corners always sit on colour.
- **Comparison table:** its last row ("Built to connect learning, assessment, and hiring in one loop") was always hidden under the dark contact section. It now has room to show.
- **Hero scribble:** "real xp" no longer splits across lines leaving "xp" alone, and on phones it no longer pokes past the left edge.

**Removed**
- An unused student/business "audience toggle" script. Nothing on the page ever triggered it.
- A leftover editor style block at the end of the old file that matched nothing on the page.
- About 150 lines of styles for elements that no longer exist.
- Inline colour overrides, folded into the stylesheet with the same colours.

---

### Privacy policy (`/privacypolicies`)

**Page**
- A new page built from the supplied policy text, in the site's design.
- Numbered sections, with a contents list in a sidebar that stays on screen on desktop, and a single column on phones.
- It shares the site header and footer.

**Content as published**
- Company number **17287603**, registered office **14 Newark Avenue, Manchester, England, M14 4HE**, contact **buildingomo@gmail.com**.
- **Last updated: 15 September 2026.**
- The intro no longer says "some as young as 16"; the age requirement stays in section 2.
- Sections 4 (legal basis) and 6 (service providers) are written as paragraphs and lists instead of tables.
- The Cookies section and all mentions of a cookie banner are removed for now, so the Changes and Contact sections are now numbered 10 and 11.

**Service providers (section 6)**
- **Supabase:** database, authentication, file storage and account emails, all in **Ireland (EU)**.
- **Tally:** the website sign-up form, in the **EU**. Section 3.1 describes the sign-up form data, and section 4 has a "Handling your sign-up form" legal-basis entry. *That entry was drafted for this release, so the owner should confirm it.*
- **PostHog:** analytics and session replay, in the **US, with UK-approved safeguards**. It was previously listed as EU.

**Analytics and session replay (sections 3.2, 4 and 9)**
- PostHog is described as using **no cookies and storing nothing on the device**. The visit identifier "resets each time you open the site".
- The legal basis for analytics and session replay changed from **consent** to **legitimate interests**, because the site no longer asks visitors for consent. *This is a legal judgement for the owner to confirm.*
- New text explains that browsers sending **Do Not Track** aren't recorded, and that people can object by email (section 9).
- The right to withdraw consent no longer mentions session replay.

---

### Accounts and portal

**Design:** matches the supplied wireframes, in `src/components/auth/AuthLayout.jsx` and `src/styles/auth.css`.
- Split screen: a blue gradient panel with the white OMO logo on the left, the step on a warm panel on the right.
- Archivo Black headings, uppercase field labels and orange buttons. Archivo was added to the Google Fonts link.
- On phones and small tablets the blue panel becomes a band across the top.
- A line at the bottom of every screen links to the privacy policy. The Terms of Service link from the wireframes is left out until that page exists.

**Sign in (`/login`)**
- Email and password, with a show/hide password button. Edge's own duplicate eye icon is hidden.
- Errors show under each field. Wrong details show "Incorrect email or password."
- If the account exists but was never confirmed, a fresh code is sent and the person is taken to the code screen.

**Sign up (`/signup`)**
- Full name, email, password and re-type password. The password needs at least 8 characters, and the two must match.
- **Every new account is a student.** There is no account-type choice; employer and admin roles are assigned in Supabase.
- Any email address is accepted, not only university ones.
- An already-registered email shows "An account with this email already exists. Sign in instead."
- If Supabase has "Confirm email" switched off, sign-up goes straight to the portal.

**Code screen (`/verify`)**
- 6 digit boxes. Pasting a code or the phone's auto-fill fills them all, Backspace steps back, and the page opens ready to type.
- **Resend** is disabled for 60 seconds with a countdown, because Supabase allows one email per address about every 60 seconds.
- A wrong or expired code shows "That code is incorrect or has expired."
- The password-reset version reads "Enter the reset code we sent to your email" and "If there's an account for [email], we've sent it a code". Supabase doesn't reveal whether an account exists, so the page can't either. It adds a **"Can't see it? Check your spam or junk folder."** tag.
- Visiting the code screen directly, with no email, sends the person back to sign-up or forgot-password.

**Success screen:** "Success! Logging you in right away…", with an animated tick (still when reduce-motion is on). It then moves to the portal after about 1.6 seconds.

**Password reset**
- `/forgot-password` → emailed code → `/reset-password` ("Choose a new password", with confirmation) → success → portal.
- **Reset links work too**, if a template ever contains one:
  - They are sent to `/reset-password`.
  - A link that lands on another page with a password-reset login in its address is forwarded to `/reset-password`.
  - An expired or used link shows **"This link has expired"** with a **Send a new code** button.
- Opening `/reset-password` with no code and no link goes to `/forgot-password`.

**Portal (`/portal`)**
- **Signed-out visitors** are sent to `/login`.
- **Header:** the header shows the logo, the person's email and **Sign out**.
- **Greeting:** "Welcome, [first name]", with a role label (Student, Employer or Admin portal) and a one-line introduction.
- **Profile details come from Supabase.** Anything missing shows as "Not added yet".
  - Students: university, course, graduation year, bio, LinkedIn and CV (shown as "Uploaded").
  - Employers: company name, website and job title.
- **Unverified employers** see a notice: "Your account is pending verification… Until then, student profiles stay hidden."
- **Placeholders:** OMOships (students), browsing students (employers), and employer verification and accounts (admins). The **Edit** buttons are disabled, marked "coming soon".
- **Sessions:** if the session ends elsewhere, for example signing out in another tab, the portal returns to `/login`. If the profile can't load, it shows an error with a Sign out button.

**Behind the scenes**
- **`src/lib/auth.js`:** every sign-in action lives here, and Supabase error codes are turned into plain messages:
  - invalid credentials, unconfirmed email and expired code
  - existing account and same password
  - email and request rate limits
  - network failures
- **Error logging:** during local development only, Supabase's exact error is also logged to the browser console with an `[auth]` prefix.
- **`src/lib/validation.js`:** email format, minimum password length and matching passwords.
- **`src/components/auth/`:** `Field` (a labelled input with error and show/hide), `CodeInput`, `SuccessState` and `AuthLayout`.

---

### Supabase integration

- **Client:** `src/lib/supabase.js` reads the two environment variables. It is `null` when they are missing, so the public site never breaks.
- **What the code relies on in the database:**
  - `profiles`: `role` (`user_role` enum: student, employer, admin), `full_name`, `email`
  - `student_profiles` and `employer_profiles`, including `employer_profiles.is_verified`
  - The `handle_new_user` trigger creates the profile rows. It only accepts `employer` from sign-up data; anything else, including `admin`, becomes a student. The website sends no role.
- **Code checking:** sign-up codes are checked with Supabase's `verifyOtp` using type `email`, and reset codes with type `recovery`. Supabase's source was checked to confirm type `email` accepts sign-up codes.
- **Fixed during setup:** codes kept failing because the project was sending codes longer than 6 digits, and the 6-box screen quietly dropped the extra digits. The fix is Email OTP Length = 6 (see configuration above).

---

### Analytics: PostHog

- **Loading:** `public/posthog.js` is loaded on every page from `index.html`. It lives in its own file so the Content Security Policy needs no scripts embedded in the page.
- **Configuration:**
  - US cloud (`https://us.i.posthog.com`)
  - `defaults: '2026-05-30'`, which records a page view on every route change
  - `person_profiles: 'identified_only'`
  - **`persistence: 'memory'`**: no cookies and no browser storage. In testing, cookies and PostHog local-storage keys were both empty.
  - **`respect_dnt: true`**: browsers sending Do Not Track aren't recorded.
- **Session replay:** PostHog's recorder loads under the security policy. Typed text in inputs, including passwords and codes, is hidden by PostHog's default settings.
- **Trade-off:** because nothing is stored, every page load counts as a new visitor, and a recording stops when the page reloads. Moving around within the site keeps the same session.

---

### Security

**Headers set in `netlify.toml` for every page**
- **Content-Security-Policy:**
  - Code can only run from the site itself and PostHog's asset server.
  - Network connections are allowed only to the site, Supabase (`*.supabase.co`) and PostHog.
  - Styles come from the site and Google Fonts; font files from `fonts.gstatic.com`.
  - Images from the site only.
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`.
- **X-Frame-Options: DENY:** no other site can embed the pages.
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy:** camera, microphone, location and payments are disabled.
- **Strict-Transport-Security: max-age=31536000:** browsers must use HTTPS.
- **Cross-Origin-Opener-Policy: same-origin**
- **Adding a new outside service** (for example Cloudflare Turnstile) means adding its domain to the policy, or the browser will block it. There's a comment in `netlify.toml` saying this.

**Checks run for this release**
- **Security policy:** the production build was served locally with the exact policy from `netlify.toml` and loaded in headless Edge.
  - PostHog loaded, including the session replay recorder, surveys and web-vitals scripts.
  - Google Fonts loaded.
  - A sign-in attempt reached Supabase (a made-up account got "Incorrect email or password").
  - The portal redirected correctly.
  - The browser blocked nothing.
- **Secrets:** all committed files and the full git history were scanned for keys. The only keys present are public by design: the PostHog project key (`phc_…`) and the Supabase publishable key, which is supplied at build time and never committed. The repository is **public**.
- **Packages:** `npm audit --omit=dev` found **0 vulnerabilities**.
- **Database, as an anonymous visitor:**
  - Reading `profiles`, `student_profiles` and `employer_profiles` was **refused**.
  - Listing the private `cvs` bucket returned nothing.
- **Access rules (reviewed):**
  - Users read and update only their own rows.
  - Only verified employers can read student profiles.
  - Only admins can change a role or `is_verified`.
  - The helper functions are security-definer with a fixed `search_path`.
  - CV files are private, and students can only manage their own folder.
- **Other:**
  - Password reset never reveals whether an account exists.
  - React escapes all displayed text, and the code never inserts raw HTML.

---

### Known issues and follow-ups

1. **Session replay records personal details shown on screen**: names and emails in the portal, and the email address on the code and reset screens. Typed input is hidden, but visible text isn't. Mark these parts to be blanked in recordings.
2. **Login tokens in email links:** if an email template ever contains a link, clicking it opens the site with login tokens in the web address, and PostHog records the full address. Keep templates code-only, or strip tokens from the address before PostHog loads.
3. **Bot protection** (Cloudflare Turnstile) on sign-up, sign-in and reset is planned. Its domain will need adding to the security policy.
4. **Employer sign-up behind the scenes:** `handle_new_user` still accepts `role: employer` when someone calls the Supabase API directly. Such accounts start unverified and can't see students. Change the trigger if self-service employer accounts should be impossible.
5. **Two-factor authentication:** turn it on for portal admins, and on the GitHub, Netlify, Supabase, PostHog and domain registrar accounts. The privacy policy promises it for production systems.
6. **Account deletion** from a settings page is promised in the privacy policy but not built yet.
7. **CV bucket:** set a file type and size limit (PDF, 5 MB).
8. **Sign-up reveals whether an email is registered** ("An account with this email already exists"). This trades security for helpfulness.
9. **`profiles.email`** doesn't update when someone changes their login email; this needs a small trigger if email changes are added.
10. **`/favicon.png`** is referenced but not in the repository, so it shows a broken icon (this pre-dates this release).
11. **The Tally form** is still described in the privacy policy, but no button on the site opens it any more.
12. **Visitor numbers** in PostHog are higher than real because tracking is cookieless (see Analytics).

---

### Testing notes

- **Build:** `npm run build` passes.
- **Landing page:** checked in headless Edge at 1440px, 1024px and 390px. No sideways overflow at any width.
- **Sign-in screens:** every screen, error state and redirect was clicked through with a stand-in backend before Supabase was connected. The expired-link, forwarded-link and no-link reset cases were tested after the switch to Supabase.
- **Real emails:** sign-up and reset with genuine emailed codes depend on the Supabase settings above and aren't covered by these automated checks. Test them on the deploy preview before merging.
