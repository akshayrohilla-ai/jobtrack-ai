import { Star, Download } from 'lucide-react'

function exportShortlistCSV(shortlist) {
  const headers = ['Candidate Name', 'Title', 'Location', 'Match Score', 'Matched Skills', 'Label']
  const rows = shortlist.map(c => [
    `"${c.candidate?.name || ''}"`,
    `"${c.candidate?.title || ''}"`,
    `"${c.candidate?.location || ''}"`,
    c.score || '',
    `"${(c.matched_required || []).join(', ')}"`,
    `"${c.label || ''}"`,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shortlist-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Shortlist({ shortlist }) {
  if (!shortlist.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Star size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No candidates shortlisted yet.</p>
        <p className="text-xs mt-1">Score candidates in the Candidates tab, then add strong matches here.</p>
      </div>
    )
  }

  const sorted = [...shortlist].sort((a, b) => b.score - a.score)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label mb-0">Shortlisted candidates ({shortlist.length})</div>
        <button
          onClick={() => exportShortlistCSV(shortlist)}
          className="btn-secondary text-xs py-1.5"
        >
          <Download size={13} />Export CSV
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {sorted.map((c, i) => {
          const score = c.score
          const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
          const initials = c.candidate?.initials ||
            c.candidate?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
          return (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-medium flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{c.candidate?.name}</div>
                  <div className="text-xs text-gray-400">{c.candidate?.title}{c.candidate?.location ? ` · ${c.candidate.location}` : ''}</div>
                  {c.matched_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.matched_required.slice(0, 4).map((s, j) => (
                        <span key={j} className="skill-chip-match text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-medium ${scoreColor}`}>{score}%</span>
                <span className="badge-green">Shortlisted</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
