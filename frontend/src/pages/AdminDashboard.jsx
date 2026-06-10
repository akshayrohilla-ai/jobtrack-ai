import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { getAuthHeader } from '../lib/supabase'
import { Users, Zap, TrendingUp, DollarSign, RefreshCw, AlertTriangle, Activity, Clock, Gift } from 'lucide-react'

const ADMIN_USER_ID = '56adc198-81e7-4036-aacd-d0ee22de16cc'
const API_URL = import.meta.env.VITE_API_URL

function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: iconColor + '18', border: `1px solid ${iconColor}25` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ fontFamily: 'DM Serif Display, serif', color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Gift credits form
  const [giftEmail, setGiftEmail]     = useState('')
  const [giftAmount, setGiftAmount]   = useState(5)
  const [giftNote, setGiftNote]       = useState('beta tester gift')
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftMsg, setGiftMsg]         = useState(null)  // { type: 'success'|'error', text }

  const isAdmin = user?.id === ADMIN_USER_ID

  useEffect(() => {
    if (isAdmin) fetchStats()
  }, [isAdmin])

  async function giftCredits(e) {
    e.preventDefault()
    setGiftLoading(true); setGiftMsg(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/api/admin/gift-credits`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: giftEmail.trim(), credits: giftAmount, note: giftNote })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      setGiftMsg({ type: 'success', text: `✓ ${data.credits_added} credits added to ${data.email}. New balance: ${data.new_balance}` })
      setGiftEmail('')
      fetchStats()
    } catch (err) {
      setGiftMsg({ type: 'error', text: err.message })
    } finally { setGiftLoading(false) }
  }

  async function fetchStats() {
    setLoading(true); setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers })
      if (res.status === 403) { setError('Access denied.'); return }
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  // Not signed in
  if (!user) return (
    <div className="flex items-center justify-center min-h-96">
      <p style={{ color: 'var(--text-muted)' }}>Sign in to access this page.</p>
    </div>
  )

  // Not admin — same vague message as the backend
  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-96">
      <p style={{ color: 'var(--text-muted)' }}>Not found.</p>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--danger)' }}>
        <AlertTriangle size={16} />{error}
      </div>
    </div>
  )

  const { users, credits, usage, estimated_spend_usd, cost_note, user_details } = stats

  return (
    <div className="animate-slide-up space-y-6" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Admin dashboard
          </h1>
          {lastRefresh && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>Last refreshed {lastRefresh}</p>
          )}
        </div>
        <button onClick={fetchStats} className="btn-ghost text-xs">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* User stats */}
      <div>
        <p className="section-label mb-3">Users</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users} iconColor="var(--blue-accent)" label="Total users" value={users.total} />
          <StatCard icon={Activity} iconColor="var(--success)" label="Active (30 days)" value={users.active} sub={`${users.stale} stale`} />
          <StatCard icon={Clock} iconColor="var(--warning)" label="Stale users" value={users.stale} sub="No activity in 30 days" />
        </div>
      </div>

      {/* Credit stats */}
      <div>
        <p className="section-label mb-3">Credits</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Zap} iconColor="var(--blue-accent)" label="Total issued" value={credits.total_issued} sub="2 per signup" />
          <StatCard icon={TrendingUp} iconColor="var(--danger)" label="Total used" value={credits.total_used} />
          <StatCard icon={Zap} iconColor="var(--success)" label="Remaining across all users" value={credits.total_remaining} />
        </div>
      </div>

      {/* Usage stats */}
      <div>
        <p className="section-label mb-3">Usage</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Credits used by period</div>
            <div className="space-y-3">
              {[
                { label: 'Last 7 days',  value: usage.last_7_days },
                { label: 'Last 30 days', value: usage.last_30_days },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Credits used by feature</div>
            <div className="space-y-2">
              {Object.entries(usage.by_action).length === 0
                ? <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>No usage yet</p>
                : Object.entries(usage.by_action)
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action.replace('_', ' ')}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                      </div>
                    ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Anthropic cost estimate */}
      <div className="card" style={{ border: '1px solid var(--border)', background: 'var(--navy-900)' }}>
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <DollarSign size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white">${estimated_spend_usd}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>estimated total spend</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{cost_note}</p>
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
              className="text-xs mt-2 inline-block" style={{ color: 'var(--blue-light)' }}>
              Check live balance on Anthropic Console ↗
            </a>
          </div>
        </div>
      </div>

      {/* Gift credits */}
      <div>
        <p className="section-label mb-3">Gift credits</p>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={15} style={{ color: 'var(--blue-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add free credits to any user</span>
          </div>
          <form onSubmit={giftCredits} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="User email address"
                value={giftEmail}
                onChange={e => setGiftEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <select
                value={giftAmount}
                onChange={e => setGiftAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)', minWidth: '90px' }}
              >
                {[2, 5, 10, 15, 20, 30].map(n => (
                  <option key={n} value={n}>{n} credits</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Note (optional)"
                value={giftNote}
                onChange={e => setGiftNote(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                type="submit"
                disabled={giftLoading || !giftEmail}
                className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                style={{ background: giftLoading ? 'rgba(27,111,235,0.4)' : 'var(--blue-accent)', color: 'white', cursor: giftLoading ? 'not-allowed' : 'pointer' }}
              >
                <Gift size={13} />
                {giftLoading ? 'Sending…' : 'Gift credits'}
              </button>
            </div>
            {giftMsg && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: giftMsg.type === 'success' ? 'var(--success-bg, #d1fae5)' : 'rgba(220,53,69,0.1)',
                  color: giftMsg.type === 'success' ? 'var(--success, #065f46)' : 'var(--danger)'
                }}>
                {giftMsg.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Per-user table */}
      <div>
        <p className="section-label mb-3">All users</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                {['Email', 'Balance', 'Used', 'Status', 'Last seen'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user_details.map((u, i) => (
                <tr key={u.user_id}
                  style={{ borderBottom: i < user_details.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div>{u.email || <span style={{ color: 'var(--text-ghost)' }}>unknown</span>}</div>
                    <div className="font-mono mt-0.5" style={{ color: 'var(--text-ghost)', fontSize: '10px' }}>
                      {u.user_id.slice(0, 8)}…
                      {u.user_id === ADMIN_USER_ID && (
                        <span className="ml-2 badge-blue">you</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: u.balance <= 1 ? 'var(--danger)' : 'var(--success)' }}>
                    {u.balance}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.lifetime_used}</td>
                  <td className="px-4 py-3">
                    <span className={u.is_active ? 'badge-green' : 'badge-amber'}>
                      {u.is_active ? 'Active' : 'Stale'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-ghost)' }}>
                    {u.last_seen !== '—' ? new Date(u.last_seen).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {user_details.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-ghost)' }}>No users yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
