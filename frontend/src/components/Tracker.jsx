import { updateApplication, deleteApplication } from '../lib/api'
import { Download, Trash2, RefreshCw } from 'lucide-react'

const COLS = [
  { id: 'applied',   label: 'Applied',   color: 'bg-blue-400' },
  { id: 'interview', label: 'Interview', color: 'bg-amber-400' },
  { id: 'offer',     label: 'Offer',     color: 'bg-green-500' },
  { id: 'rejected',  label: 'Rejected',  color: 'bg-red-400' },
]

function exportToCSV(applications) {
  const headers = ['Job Title', 'Company', 'Location', 'Status', 'Match Score', 'Applied Date', 'LinkedIn URL']
  const rows = applications.map(a => [
    `"${a.job_title || ''}"`,
    `"${a.company || ''}"`,
    `"${a.location || ''}"`,
    `"${a.status || ''}"`,
    a.match_score || '',
    a.applied_date || '',
    `"${a.linkedin_url || ''}"`,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jobtrack-applications-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Tracker({ applications, loading, onUpdate, onRefresh }) {
  async function moveCard(app, newStatus) {
    const updated = applications.map(a => a.id === app.id ? { ...a, status: newStatus } : a)
    onUpdate(updated)
    try {
      await updateApplication(app.id, { status: newStatus })
    } catch (e) {
      console.error('Failed to update status:', e)
    }
  }

  async function removeCard(app) {
    const updated = applications.filter(a => a.id !== app.id)
    onUpdate(updated)
    try {
      await deleteApplication(app.id)
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-3" />
        <p className="text-sm">Loading your applications...</p>
      </div>
    )
  }

  if (!applications.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No applications yet.</p>
        <p className="text-xs mt-1">Go to Find jobs → use "Track a job" to add applications.</p>
        {onRefresh && (
          <button onClick={onRefresh} className="mt-3 btn-secondary text-xs mx-auto">
            <RefreshCw size={12} />Refresh
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{applications.length} application{applications.length !== 1 ? 's' : ''} tracked</p>
        <div className="flex gap-2">
          {onRefresh && (
            <button onClick={onRefresh} className="btn-secondary text-xs py-1.5">
              <RefreshCw size={12} />Refresh
            </button>
          )}
          <button onClick={() => exportToCSV(applications)} className="btn-secondary text-xs py-1.5">
            <Download size={13} />Export CSV
          </button>
        </div>
      </div>

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
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{app.job_title}</div>
                        <div className="text-xs text-gray-400 truncate">{app.company}{app.location ? ` · ${app.location}` : ''}</div>
                      </div>
                      <button
                        onClick={() => removeCard(app)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 mb-2">
                      {app.match_score ? (
                        <span className={`text-xs font-medium ${app.match_score >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                          {app.match_score}% match
                        </span>
                      ) : <span />}
                      <span className="text-xs text-gray-300">{app.applied_date}</span>
                    </div>
                    {app.linkedin_url && (
                      <a href={app.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline block mb-2 truncate">
                        View posting ↗
                      </a>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveCard(app, c.id)}
                          className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-50">
                          → {c.label}
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
      <p className="text-xs text-gray-400 text-center mt-3">Changes save automatically · Use Refresh if you don't see recent additions</p>
    </div>
  )
}
