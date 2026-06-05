import { Star } from 'lucide-react'

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
      <div className="section-label">Shortlisted candidates ({shortlist.length})</div>
      <div className="divide-y divide-gray-50">
        {sorted.map((c, i) => {
          const score = c.score
          const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
          return (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-medium flex-shrink-0">
                  {c.candidate?.initials || c.candidate?.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{c.candidate?.name}</div>
                  <div className="text-xs text-gray-400">{c.candidate?.title} · {c.candidate?.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.matched_required?.length > 0 && (
                  <div className="hidden sm:flex gap-1">
                    {c.matched_required.slice(0, 3).map((s, j) => <span key={j} className="skill-chip-match">{s}</span>)}
                  </div>
                )}
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
