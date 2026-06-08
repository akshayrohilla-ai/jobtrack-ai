export default function Dashboard({ applications }) {
  const total = applications.length
  const byStatus = { applied: 0, interview: 0, offer: 0, rejected: 0 }
  let scoreSum = 0, scoreCount = 0

  applications.forEach(a => {
    if (a.status in byStatus) byStatus[a.status]++
    if (a.match_score) { scoreSum += a.match_score; scoreCount++ }
  })

  const interviewRate = total > 0 ? Math.round(((byStatus.interview + byStatus.offer) / total) * 100) : 0
  const avgScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null

  const metrics = [
    { label: 'Total applied', value: total },
    { label: 'Interviews', value: byStatus.interview + byStatus.offer },
    { label: 'Response rate', value: interviewRate + '%' },
    { label: 'Avg match score', value: avgScore || '—' },
  ]

  const funnel = [
    { label: 'Applied', count: total, bg: 'bg-blue-50', text: 'text-blue-800' },
    { label: 'Interview', count: byStatus.interview, bg: 'bg-amber-50', text: 'text-amber-800' },
    { label: 'Offer', count: byStatus.offer, bg: 'bg-green-50', text: 'text-green-800' },
    { label: 'Rejected', count: byStatus.rejected, bg: 'bg-red-50', text: 'text-red-800' },
  ]

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-medium text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-label">Application funnel</div>
        <div className="flex rounded-lg overflow-hidden">
          {funnel.map(f => (
            <div key={f.label} className={`flex-1 py-3 text-center ${f.bg}`}>
              <div className={`text-lg font-medium ${f.text}`}>{f.count}</div>
              <div className={`text-xs ${f.text} opacity-80`}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-label">All applications</div>
        {!applications.length ? (
          <p className="text-sm text-gray-400">No applications yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {applications.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{a.job_title}</div>
                  <div className="text-xs text-gray-400">{a.company} · {a.location}</div>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score && (
                    <span className={`text-xs font-medium ${a.match_score >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                      {a.match_score}%
                    </span>
                  )}
                  <span className={
                    a.status === 'applied' ? 'badge-blue' :
                    a.status === 'interview' ? 'badge-amber' :
                    a.status === 'offer' ? 'badge-green' : 'badge-red'
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
