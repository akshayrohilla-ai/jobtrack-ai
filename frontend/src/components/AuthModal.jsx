import { useState } from 'react'
import { signIn, signUp, signInWithGoogle, supabase } from '../lib/supabase'

export default function AuthModal({ onClose }) {
  const [tab, setTab]           = useState('signin')   // 'signin' | 'signup' | 'reset'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (tab === 'signup') {
        const data = await signUp(email, password, fullName.trim())
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists. Please sign in instead.')
          return
        }
        if (fullName.trim()) try { localStorage.setItem('jobtrack_display_name', fullName.trim()) } catch {}
        setSuccess('Check your email to confirm your account, then sign in.')
      } else if (tab === 'reset') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
        if (err) throw err
        setSuccess('Password reset link sent — check your inbox.')
      } else {
        await signIn(email, password)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await signInWithGoogle()
      // Page will redirect — no need to call onClose
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Logo mark */}
        <div className="flex justify-center mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--blue-accent)' }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2 className="text-white text-center font-semibold text-lg mb-1">
          {tab === 'signin' ? 'Welcome back' : tab === 'signup' ? 'Create account' : 'Reset password'}
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {tab === 'signin' ? 'Sign in to JobTrack AI' : tab === 'signup' ? 'Get 3 free credits to start' : 'Enter your email to receive a reset link'}
        </p>

        {/* Tab toggle — hidden on reset view */}
        {tab !== 'reset' && (
          <div className="flex rounded-lg p-1 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {['signin', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                style={tab === t
                  ? { background: 'var(--blue-accent)', color: 'white' }
                  : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        {/* Google OAuth — hidden on reset view */}
        {tab === 'reset' && (
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(''); setSuccess('') }}
            className="text-xs mb-4 underline"
            style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}
          >
            ← Back to sign in
          </button>
        )}
        {tab !== 'reset' && (
          <>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-medium mb-4 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}/>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}/>
            </div>
          </>
        )}

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === 'signup' && (
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                caretColor: 'white'
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              caretColor: 'white'
            }}
          />
          {tab !== 'reset' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                caretColor: 'white'
              }}
            />
          )}
          {tab === 'signin' && (
            <button
              type="button"
              onClick={() => { setTab('reset'); setError(''); setSuccess('') }}
              className="text-xs text-right self-end -mt-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Forgot password?
            </button>
          )}

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,53,69,0.15)', color: '#ff6b7a' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(25,185,84,0.15)', color: '#4ade80' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-1"
            style={{
              background: loading ? 'rgba(27,111,235,0.5)' : 'var(--blue-accent)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : tab === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}
