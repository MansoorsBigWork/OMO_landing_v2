import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router'
import Home from './pages/Home.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import { COURSE_BASE } from './courses/index.ts'

/* Pages are loaded on demand so the public pages don't download the Supabase client.
   If a page's files can't be fetched (the site was redeployed, or the dev server restarted,
   while this tab was open), the tab reloads once to pick up the new build instead of hanging. */
const RELOADED_KEY = 'omo:reloaded-for-stale-build'
function page(importer) {
  return lazy(() =>
    importer()
      .then((module) => {
        // A page loaded, so the build is current: allow one recovery reload later if needed
        try {
          sessionStorage.removeItem(RELOADED_KEY)
        } catch {
          /* storage unavailable */
        }
        return module
      })
      .catch((error) => {
      let reloaded = false
      try {
        reloaded = sessionStorage.getItem(RELOADED_KEY) === '1'
        if (!reloaded) sessionStorage.setItem(RELOADED_KEY, '1')
      } catch {
        /* storage unavailable: fall through and surface the error */
      }
        if (!reloaded) {
          window.location.reload()
          return new Promise(() => {}) // never settles; the reload takes over
        }
        throw error
      }),
  )
}
const RequireAuth = page(() => import('./components/RequireAuth.jsx'))
const Portal = page(() => import('./pages/Portal.jsx'))
const EmployerOverview = page(() => import('./pages/employer/EmployerOverview.jsx'))
const EmployerAnalytics = page(() => import('./pages/employer/EmployerAnalytics.jsx'))
const EmployerCandidate = page(() => import('./pages/employer/EmployerCandidate.jsx'))
const EmployerCompany = page(() => import('./pages/employer/EmployerCompany.jsx'))
const Profile = page(() => import('./pages/Profile.jsx'))
const CourseShell = page(() => import('./courses/CourseShell.tsx'))
const OMOships = page(() => import('./pages/OMOships.jsx'))
const Onboarding = page(() => import('./pages/Onboarding.jsx'))
const Login = page(() => import('./pages/auth/Login.jsx'))
const SignUp = page(() => import('./pages/auth/SignUp.jsx'))
const Verify = page(() => import('./pages/auth/Verify.jsx'))
const ForgotPassword = page(() => import('./pages/auth/ForgotPassword.jsx'))
const ResetPassword = page(() => import('./pages/auth/ResetPassword.jsx'))

/* Scroll to the #hash target after a navigation, or to the top of a newly opened page.
   Back/forward without a hash is left to the browser's own scroll restoration.
   Course pages manage their own scrolling (saved positions, slide changes in the URL), so they're left alone. */
function useScrollOnNavigate() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (pathname.startsWith(COURSE_BASE)) return
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash, key, navigationType])
}

/* A reset-password email link lands on Supabase's Site URL if /reset-password isn't in its redirect list.
   Forward it to /reset-password with the hash (which carries the sign-in) intact. */
function useForwardResetLinks() {
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (pathname !== '/reset-password' && new URLSearchParams(hash.slice(1)).get('type') === 'recovery') {
      navigate({ pathname: '/reset-password', hash }, { replace: true })
    }
  }, [pathname, hash, navigate])
}

export default function App() {
  useScrollOnNavigate()
  useForwardResetLinks()

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacypolicies" element={<PrivacyPolicy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Signed-in area: the portal and every OMOship course */}
        <Route element={<RequireAuth />}>
          <Route path="/portal" element={<Portal />} />
          {/* Employers: /portal lists their OMOships; each has a dashboard */}
          <Route path="/portal/dashboard/:slug" element={<EmployerOverview />} />
          <Route path="/portal/dashboard/:slug/analytics" element={<EmployerAnalytics />} />
          <Route path="/portal/dashboard/:slug/candidates/:id" element={<EmployerCandidate />} />
          <Route path="/portal/company" element={<EmployerCompany />} />
          <Route path="/profile" element={<Profile />} />
          <Route path={`${COURSE_BASE}/:slug/*`} element={<CourseShell />} />
        </Route>
        {/* The student dashboard and onboarding check sign-in themselves (with a local preview in dev) */}
        <Route path="/omoships" element={<OMOships />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
