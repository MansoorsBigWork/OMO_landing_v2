import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router'
import Home from './pages/Home.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import { COURSE_BASE } from './courses/index.ts'

// Loaded on demand so the public pages don't download the Supabase client
const RequireAuth = lazy(() => import('./components/RequireAuth.jsx'))
const Portal = lazy(() => import('./pages/Portal.jsx'))
const CourseShell = lazy(() => import('./courses/CourseShell.tsx'))
const Login = lazy(() => import('./pages/auth/Login.jsx'))
const SignUp = lazy(() => import('./pages/auth/SignUp.jsx'))
const Verify = lazy(() => import('./pages/auth/Verify.jsx'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'))

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
          <Route path={`${COURSE_BASE}/:slug/*`} element={<CourseShell />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
