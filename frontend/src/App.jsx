import { useState } from 'react'
import SeekerMode from './pages/SeekerMode'
import RecruiterMode from './pages/RecruiterMode'

export default function App() {
  const [mode, setMode] = useState('seeker')

  return (
    <div className="min-h-screen" style={{ background: '#F0F4FA' }}>
      {/* Top navigation */}
      <header style={{ background: 'var(--navy-900)' }} className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-accent)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">JobTrack <span style={{ color: 'var(--blue-light)' }}>AI</span></span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {['seeker', 'recruiter'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={mode === m
                  ? { background: 'var(--blue-accent)', color: 'white', boxShadow: '0 1px 4px rgba(27,111,235,0.4)' }
                  : { color: 'rgba(255,255,255,0.6)' }
                }
              >
                {m === 'seeker' ? 'Job seeker' : 'Recruiter'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        {mode === 'seeker' ? <SeekerMode /> : <RecruiterMode />}
      </main>
    </div>
  )
}
