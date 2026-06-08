import { TrendingUp, Briefcase, MessageSquare, Target } from 'lucide-react'

export default function Dashboard({ applications }) {
  const total    = applications.length
  const byStatus = { applied: 0, interview: 0, offer: 0, rejected: 0 }
  let scoreSum = 0, scoreCount = 0

  applications.forEach(a => {
    if (a.status in byStatus) byStatus[a.status]++
    if (a.match_score) { scoreSum += a.match_score; scoreCount++ }
  })

  const interviewRate = total > 0 ? Math.round(((byStatus.interview + byStatus.offer) / total) * 100) : 0
  const avgScore      = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null

  const metrics = [
    { label: 'Total applied',   value: total,              icon: Briefcase,    accent: 'var(--blue-accent)' },
    { label: 'Interviews',      value: byStatus.interview + byStatus.offer, icon: MessageSquare, accent: '#7C3AED' },
    { label: 'Response rate',   value: interviewRate + '%', icon: TrendingUp,   accent: 'var(--success)' },
    { label: 'Avg match score', value: avgScore ? avgScore + '%' : '—', icon: Target, accent: 'var(--warning)' },
  ]

  const funnel = [
    { label: 'Applied',   count: total,              bg: '#EBF2FF', text: '#1D4ED8' },
    { label: 'Interview', count: byStatus.interview, bg: '#F3F0FF', text: '#6D28D9' },
    { label: 'Offer',     count: byStatus.offer,     bg: 'var(--success-bg)', text: 'var(--success)' },
    { label: 'Rejected',  count: byStatus.rejected,  bg: 'var(--danger-bg)',  text: 'var(--danger)' },
  ]

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: '1.5rem', color: 'var(--navy-900)' }}>Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your job search at a glance</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {metrics.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="metric-card">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: accent + '18', border: `1px solid ${accent}30` }}>
              <Icon size={16} style={{ color: accent }} />
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="card mb-4">
        <span className="section-label">Application funnel</span>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {funnel.map((f, i) => (
            <div key={f.label} className="flex-1 py-4 text-center"
              style={{ background: f.bg, borderRight: i < funnel.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div className="text-xl font-semibold" style={{ fontFamily: 'DM Serif Display, serif', color: f.text }}>{f.count}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: f.text, opacity: 0.8 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications list */}
      <div className="card">
        <span className="section-label">All applications</span>
        {!applications.length ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-ghost)' }}>
            No applications yet — start tracking jobs from the Tracker tab.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            {applications.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.job_title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.company}{a.location ? ` · ${a.location}` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score && (
                    <span className="text-xs font-semibold" style={{ color: a.match_score >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                      {a.match_score}%
                    </span>
                  )}
                  <span className={
                    a.status === 'applied'   ? 'badge-blue'  :
                    a.status === 'interview' ? 'badge-navy'  :
                    a.status === 'offer'     ? 'badge-green' : 'badge-red'
                  }>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
