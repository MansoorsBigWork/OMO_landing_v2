import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router'
import Home from './pages/Home.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'

// Loaded on demand so the public pages don't download the Supabase client
const Portal = lazy(() => import('./pages/Portal.jsx'))
const OMOships = lazy(() => import('./pages/OMOships.jsx'))
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'))
const Login = lazy(() => import('./pages/auth/Login.jsx'))
const SignUp = lazy(() => import('./pages/auth/SignUp.jsx'))
const Verify = lazy(() => import('./pages/auth/Verify.jsx'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'))

/* Scroll to the #hash target after a navigation, or to the top of a newly opened page.
   Back/forward without a hash is left to the browser's own scroll restoration. */
function useScrollOnNavigate() {
  const { hash, key } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [hash, key, navigationType])
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
        <Route path="/portal" element={<Portal />} />
        <Route path="/omoships" element={<OMOships />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
