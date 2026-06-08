import { useState, useEffect, createContext, useContext } from 'react'
import SeekerMode from './pages/SeekerMode'
import RecruiterMode from './pages/RecruiterMode'
import AuthModal from './components/AuthModal'
import { supabase, signOut } from './lib/supabase'

// Auth context — consume with useAuth() anywhere in the tree
export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

export default function App() {
  const [mode, setMode]           = useState('seeker')
  const [darkMode, setDarkMode]   = useState(() => localStorage.getItem('jobtrack_theme') === 'dark')
  const [user, setUser]           = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [creditBalance, setCreditBalance] = useState(null)

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('jobtrack_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('jobtrack_theme', 'light')
    }
  }, [darkMode])

  // Auth state listener — fires on sign in, sign out, token refresh
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

  // Fetch credit balance when user signs in
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
      } catch {
        // Non-critical — balance will show on next evaluation
      }
    })
  }, [user])

  async function handleSignOut() {
    await signOut()
    setUser(null)
    setCreditBalance(null)
  }

  return (
    <AuthContext.Provider value={{ user, creditBalance, setCreditBalance, setShowAuthModal }}>
      <div className="min-h-screen" style={{ background: darkMode ? '#060F1A' : '#F0F4FA' }}>

        {/* Header */}
        <header style={{ background: 'var(--navy-900)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="sticky top-0 z-20">
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}
            className="h-14 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
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
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {['seeker', 'recruiter'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="mode-toggle-btn px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                    style={mode === m
                      ? { background: 'var(--blue-accent)', color: 'white', boxShadow: '0 1px 4px rgba(27,111,235,0.4)' }
                      : { color: 'rgba(255,255,255,0.6)' }
                    }>
                    {m === 'seeker' ? 'Job seeker' : 'Recruiter'}
                  </button>
                ))}
              </div>

              {/* Credit balance — shown when signed in */}
              {user && creditBalance !== null && (
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
              )}

              {/* Auth button */}
              {authLoading ? null : user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'var(--blue-accent)', color: 'white' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Sign in
                </button>
              )}

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(d => !d)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
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
          {mode === 'seeker' ? <SeekerMode /> : <RecruiterMode />}
        </main>

        {/* Auth modal */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    </AuthContext.Provider>
  )
}
