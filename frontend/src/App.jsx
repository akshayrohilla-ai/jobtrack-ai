import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import SeekerMode from './pages/SeekerMode'
import RecruiterMode from './pages/RecruiterMode'
import AdminDashboard from './pages/AdminDashboard'
import LandingPage from './pages/LandingPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import RefundPolicy from './pages/RefundPolicy'
import Contact from './pages/Contact'
import ResetPassword from './pages/ResetPassword'
import AuthModal from './components/AuthModal'
import PaymentModal from './components/PaymentModal'
import { supabase, signOut } from './lib/supabase'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

const ADMIN_USER_ID = '56adc198-81e7-4036-aacd-d0ee22de16cc'

export default function App() {
  const [mode, setMode]             = useState('seeker')
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('jobtrack_theme') === 'dark')
  const [user, setUser]             = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [creditBalance, setCreditBalance] = useState(null)

  const path = window.location.pathname
  const isAdminRoute = path === '/admin'
  const isLegalRoute = ['/privacy', '/terms', '/refund', '/contact', '/reset-password'].includes(path)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('jobtrack_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('jobtrack_theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) setCreditBalance(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => setShowPaymentModal(true)
    window.addEventListener('jobtrack:out-of-credits', handler)
    return () => window.removeEventListener('jobtrack:out-of-credits', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    const API_URL = import.meta.env.VITE_API_URL
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      try {
        const res = await fetch(`${API_URL}/api/evaluate/balance`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setCreditBalance(data.balance)
        }
      } catch { }
    })
  }, [user])

  async function handleSignOut() {
    await signOut()
    setUser(null)
    setCreditBalance(null)
  }

  const isAdmin = user?.id === ADMIN_USER_ID

  // Legal pages — always accessible, no auth needed
  if (isLegalRoute) {
    return (
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    )
  }

  // Show landing page for non-authenticated users (not admin route)
  if (!authLoading && !user && !isAdminRoute) {
    return (
      <AuthContext.Provider value={{ user, creditBalance, setCreditBalance, setShowAuthModal }}>
        <LandingPage onGetStarted={() => setShowAuthModal(true)} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, creditBalance, setCreditBalance, setShowAuthModal }}>
      <div className="min-h-screen" style={{ background: darkMode ? '#060F1A' : '#F0F4FA' }}>

        {/* Header */}
        <header style={{ background: 'var(--navy-900)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="sticky top-0 z-20">
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}
            className="h-14 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.pathname !== '/' && (window.location.href = '/')}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--blue-accent)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-semibold text-white text-sm tracking-tight">
                JobTrack <span style={{ color: 'var(--blue-light)' }}>AI</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode toggle — hidden on admin route */}
              {!isAdminRoute && (
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {/* Job seeker — always available */}
                  <button onClick={() => setMode('seeker')}
                    className="mode-toggle-btn px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={mode === 'seeker'
                      ? { background: 'var(--blue-accent)', color: 'white', boxShadow: '0 1px 4px rgba(27,111,235,0.4)' }
                      : { color: 'rgba(255,255,255,0.6)' }
                    }>
                    Job seeker
                  </button>
                  {/* Recruiter — admin only, coming soon for others */}
                  {isAdmin ? (
                    <button onClick={() => setMode('recruiter')}
                      className="mode-toggle-btn px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                      style={mode === 'recruiter'
                        ? { background: 'var(--blue-accent)', color: 'white', boxShadow: '0 1px 4px rgba(27,111,235,0.4)' }
                        : { color: 'rgba(255,255,255,0.6)' }
                      }>
                      Recruiter
                    </button>
                  ) : (
                    <div className="relative group">
                      <button disabled
                        className="px-4 py-1.5 rounded-md text-xs font-medium cursor-not-allowed"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Recruiter
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10 }}>
                          Soon
                        </span>
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                        style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', zIndex: 100 }}>
                        Coming soon — we're working on it!
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin badge — only visible to admin */}
              {isAdmin && !isAdminRoute && (
                <a href="/admin"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                  Admin
                </a>
              )}

              {/* Credit balance */}
              {user && creditBalance !== null && !isAdminRoute && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: creditBalance <= 1 ? 'rgba(220,53,69,0.15)' : 'rgba(255,255,255,0.08)',
                      color: creditBalance <= 1 ? '#ff6b7a' : 'rgba(255,255,255,0.7)',
                      border: creditBalance <= 1 ? '1px solid rgba(220,53,69,0.3)' : '1px solid transparent'
                    }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {creditBalance} {creditBalance === 1 ? 'credit' : 'credits'}
                  </div>
                  <button onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(27,111,235,0.2)', color: 'var(--blue-light)', border: '1px solid rgba(27,111,235,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,111,235,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(27,111,235,0.2)'}>
                    + Buy
                  </button>
                </div>
              )}

              {/* Auth */}
              {authLoading ? null : user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {user.email?.split('@')[0]}
                  </span>
                  <button onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                    Sign out
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'var(--blue-accent)', color: 'white' }}>
                  Sign in
                </button>
              )}

              {/* Dark mode */}
              <button onClick={() => setDarkMode(d => !d)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                {darkMode ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <main>
          {isAdminRoute
            ? <AdminDashboard />
            : !user && !authLoading
            ? null
            : mode === 'seeker' ? <SeekerMode /> : <RecruiterMode />
          }
        </main>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        {showPaymentModal && (
          <PaymentModal
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => setShowPaymentModal(false)}
          />
        )}
      </div>
    </AuthContext.Provider>
  )
}
