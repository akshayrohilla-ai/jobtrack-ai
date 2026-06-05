import { updateApplication } from '../lib/api'

const COLS = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-400' },
  { id: 'interview', label: 'Interview', color: 'bg-amber-400' },
  { id: 'offer', label: 'Offer', color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-400' },
]

export default function Tracker({ applications, onUpdate }) {
  async function moveCard(app, newStatus) {
    const updated = applications.map(a =>
      a.id === app.id ? { ...a, status: newStatus } : a
    )
    onUpdate(updated)
    try {
      await updateApplication(app.id, { status: newStatus })
    } catch { /* optimistic update already applied */ }
  }

  if (!applications.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No applications yet. Find jobs and click "Open & track" to add them.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        {COLS.map(col => {
          const colApps = applications.filter(a => a.status === col.id)
          return (
            <div key={col.id} className="bg-gray-100 rounded-xl p-3 min-h-48">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{col.label}</span>
                </div>
                <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs font-medium">
                  {colApps.length}
                </span>
              </div>
              <div className="space-y-2">
                {colApps.map(app => (
                  <div key={app.id} className="bg-white border border-gray-100 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-900 mb-1">{app.job_title}</div>
                    <div className="text-xs text-gray-400 mb-2">{app.company} · {app.location}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${app.match_score >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                        {app.match_score}/10 match
                      </span>
                      <span className="text-xs text-gray-300">{app.applied_date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COLS.filter(c => c.id !== col.id).map(c => (
                        <button
                          key={c.id}
                          onClick={() => moveCard(app, c.id)}
                          className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-50"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">Use the buttons on each card to move between stages</p>
    </div>
  )
}
