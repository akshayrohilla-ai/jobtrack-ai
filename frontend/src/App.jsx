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
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showHelp, setShowHelp]     = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsMobile, setSettingsMobile] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState(null)

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
    localStorage.removeItem('jobtrack_display_name')
  }

  function openAccountSettings() {
    setSettingsName(user?.user_metadata?.full_name || localStorage.getItem('jobtrack_display_name') || '')
    setSettingsMobile(user?.user_metadata?.mobile || '')
    setSettingsMsg(null)
    setShowAccountSettings(true)
  }

  async function saveAccountSettings(e) {
    e.preventDefault()
    setSettingsSaving(true); setSettingsMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: settingsName.trim(), mobile: settingsMobile.trim() }
      })
      if (error) throw error
      if (settingsName.trim()) localStorage.setItem('jobtrack_display_name', settingsName.trim())
      setSettingsMsg({ type: 'success', text: 'Saved successfully!' })
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message })
    } finally { setSettingsSaving(false) }
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
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1B6FEB 0%, #0EA5E9 100%)', boxShadow: '0 2px 8px rgba(27,111,235,0.4)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4.5h10M3 8h7M3 11.5h4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="12.5" cy="11.5" r="2" stroke="white" strokeWidth="1.4"/>
                  <path d="M14 13l1.5 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-white text-sm tracking-tight">
                  JobTrack<span style={{ color: '#60AFFF' }}>AI</span>
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', letterSpacing: '0.05em' }}>YOUR AI CAREER COPILOT</span>
              </div>
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

              {/* Help */}
              {user && (
                <div className="relative">
                  <button onClick={() => setShowHelp(v => !v)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    ?
                  </button>
                  {showHelp && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl p-4 z-50"
                      style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                      <p className="text-xs font-semibold text-white mb-1">Need help?</p>
                      <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        Having trouble or have a question? We're here to help.
                      </p>
                      <a href="mailto:support@jobtrackai.co.in"
                        className="text-xs font-medium"
                        style={{ color: '#60AFFF' }}
                        onClick={() => setShowHelp(false)}>
                        support@jobtrackai.co.in →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Auth */}
              {authLoading ? null : user ? (
                <div className="flex items-center gap-2">
                  <button onClick={openAccountSettings}
                    className="text-xs hidden sm:block transition-all px-2 py-1 rounded-lg"
                    style={{ color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    {user.user_metadata?.full_name || localStorage.getItem('jobtrack_display_name') || user.email?.split('@')[0]}
                  </button>
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

        {/* Account Settings Modal */}
        {showAccountSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowAccountSettings(false) }}>
            <div className="w-full max-w-sm mx-4 rounded-2xl p-6"
              style={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-base">Account Settings</h2>
                <button onClick={() => setShowAccountSettings(false)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}>✕</button>
              </div>
              <form onSubmit={saveAccountSettings} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Full name</label>
                  <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)}
                    placeholder="Your full name" required
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', caretColor: 'white' }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Mobile number <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span></label>
                  <input type="tel" value={settingsMobile} onChange={e => setSettingsMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', caretColor: 'white' }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
                  <div className="w-full px-3.5 py-2.5 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                    {user?.email}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>To change email, contact support@jobtrackai.co.in</p>
                </div>
                {settingsMsg && (
                  <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: settingsMsg.type === 'success' ? 'rgba(25,185,84,0.12)' : 'rgba(220,53,69,0.12)',
                             color: settingsMsg.type === 'success' ? '#4ade80' : '#ff6b7a' }}>
                    {settingsMsg.text}
                  </p>
                )}
                <button type="submit" disabled={settingsSaving}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold mt-1"
                  style={{ background: settingsSaving ? 'rgba(27,111,235,0.5)' : 'var(--blue-accent)', color: 'white' }}>
                  {settingsSaving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Close help tooltip on outside click */}
        {showHelp && (
          <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
        )}
      </div>
    </AuthContext.Provider>
  )
}
