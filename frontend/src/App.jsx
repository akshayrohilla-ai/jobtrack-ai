import { useState, useEffect } from 'react'
import SeekerMode from './pages/SeekerMode'
import RecruiterMode from './pages/RecruiterMode'

export default function App() {
  const [mode, setMode]       = useState('seeker')
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('jobtrack_theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('jobtrack_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('jobtrack_theme', 'light')
    }
  }, [darkMode])

  return (
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
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
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
    </div>
  )
}
