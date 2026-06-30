import { Star, Download, CheckCircle } from 'lucide-react'

function exportShortlistCSV(shortlist) {
  const headers = ['Candidate Name', 'Title', 'Location', 'Match Score', 'Matched Skills', 'Label']
  const rows = shortlist.map(c => [
    `"${c.candidate?.name || ''}"`, `"${c.candidate?.title || ''}"`, `"${c.candidate?.location || ''}"`,
    c.score || '', `"${(c.matched_required || []).join(', ')}"`, `"${c.label || ''}"`
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `shortlist-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Shortlist({ shortlist }) {
  if (!shortlist.length) return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--blue-pale)', border: '1px solid #BFDBFE' }}>
        <Star size={24} style={{ color: 'var(--blue-accent)' }} />
      </div>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', color: 'var(--text-primary)' }}>No candidates shortlisted</h3>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Score candidates in the Candidates tab, then add strong matches here.</p>
    </div>
  )

  const sorted = [...shortlist].sort((a, b) => b.score - a.score)

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Shortlisted candidates</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{shortlist.length} candidate{shortlist.length !== 1 ? 's' : ''} shortlisted</p>
        </div>
        <button onClick={() => exportShortlistCSV(shortlist)} className="btn-secondary text-xs py-1.5">
          <Download size={13} />Export CSV
        </button>
      </div>

      <div className="card">
        <div style={{ borderTop: '1px solid var(--border-light)' }}>
          {sorted.map((c, i) => {
            const score = c.score
            const scoreColor = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
            const initials = c.candidate?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'
            return (
              <div key={i} className="flex items-center justify-between py-4"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ background: 'var(--blue-accent)' }}>{initials}</div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.candidate?.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {c.candidate?.title}{c.candidate?.location ? ` · ${c.candidate.location}` : ''}
                    </div>
                    {c.matched_required?.length > 0 && (
                      <div className="flex flex-wrap mt-1.5">
                        {c.matched_required.slice(0, 4).map((s, j) => <span key={j} className="skill-chip-match">{s}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: scoreColor }}>{score}%</span>
                  <span className="badge-green"><CheckCircle size={11} />Shortlisted</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
