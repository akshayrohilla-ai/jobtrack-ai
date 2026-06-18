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
    { label: 'Interviews',      value: byStatus.interview + byStatus.offer, icon: MessageSquare, accent: 'var(--brass)' },
    { label: 'Response rate',   value: interviewRate + '%', icon: TrendingUp,   accent: 'var(--success)' },
    { label: 'Avg match score', value: avgScore ? avgScore + '%' : '—', icon: Target, accent: 'var(--warning)' },
  ]

  const funnel = [
    { label: 'Applied',   count: total,              bg: 'var(--blue-pale)', text: 'var(--blue-accent)' },
    { label: 'Interview', count: byStatus.interview, bg: 'rgba(166,128,60,0.14)', text: 'var(--brass)' },
    { label: 'Offer',     count: byStatus.offer,     bg: 'var(--success-bg)', text: 'var(--success)' },
    { label: 'Rejected',  count: byStatus.rejected,  bg: 'var(--danger-bg)',  text: 'var(--danger)' },
  ]

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="h-page">Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your job search at a glance</p>
      </div>

      {/* Metrics — 4 col desktop, 2 col mobile */}
      <div className="metric-grid-4 grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

      {/* Two column layout on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-4 grid-2-col">
        {/* Funnel */}
        <div className="card" style={{ margin: 0 }}>
          <span className="section-label">Application funnel</span>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {funnel.map((f, i) => (
              <div key={f.label} className="flex-1 py-4 text-center"
                style={{ background: f.bg, borderRight: i < funnel.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div className="text-xl" style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, color: f.text }}>{f.count}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: f.text, opacity: 0.8 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="card" style={{ margin: 0 }}>
          <span className="section-label">Activity breakdown</span>
          <div className="space-y-3">
            {[
              { label: 'Applied', count: total, color: 'var(--blue-accent)', pct: 100 },
              { label: 'Got interviews', count: byStatus.interview + byStatus.offer, color: 'var(--brass)', pct: total > 0 ? Math.round(((byStatus.interview+byStatus.offer)/total)*100) : 0 },
              { label: 'Offers received', count: byStatus.offer, color: 'var(--success)', pct: total > 0 ? Math.round((byStatus.offer/total)*100) : 0 },
              { label: 'Rejected', count: byStatus.rejected, color: 'var(--danger)', pct: total > 0 ? Math.round((byStatus.rejected/total)*100) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className="text-xs font-semibold" style={{ color: s.color }}>{s.count}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div className="card">
        <span className="section-label">All applications</span>
        {!applications.length ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--blue-pale)', border: '1px solid rgba(122,46,46,0.22)' }}>
              <Briefcase size={20} style={{ color: 'var(--blue-accent)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No applications yet — start tracking jobs from the Tracker tab.
            </p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            {applications.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="min-w-0 flex-1 mr-3">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.job_title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.company}{a.location ? ` · ${a.location}` : ''}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
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
