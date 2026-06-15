import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the user here with a token in the URL fragment (#access_token=...).
  // onAuthStateChange fires with event PASSWORD_RECOVERY once the token is parsed.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setSuccess(true)
      setTimeout(() => { window.location.href = '/' }, 2500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,0.1)' }}>

        <div className="flex justify-center mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--blue-accent)' }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2 className="text-white text-center font-semibold text-lg mb-1">Set new password</h2>
        <p className="text-center text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Choose a strong password for your account
        </p>

        {success ? (
          <div className="text-center py-4">
            <p className="text-sm px-3 py-3 rounded-lg" style={{ background: 'rgba(25,185,84,0.15)', color: '#4ade80' }}>
              Password updated! Redirecting you to the app…
            </p>
          </div>
        ) : !sessionReady ? (
          <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Verifying reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', caretColor: 'white' }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', caretColor: 'white' }}
            />

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(220,53,69,0.15)', color: '#ff6b7a' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-1"
              style={{ background: loading ? 'rgba(122,46,46,0.5)' : 'var(--blue-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
