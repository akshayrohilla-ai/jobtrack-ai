import { useState, useRef } from 'react'
import { updateApplication, deleteApplication } from '../lib/api'
import { Download, Trash2, RefreshCw, Kanban } from 'lucide-react'

const COLS = [
  { id: 'applied',   label: 'Applied',   dot: 'var(--blue-accent)', count_bg: 'var(--blue-pale)', count_text: 'var(--blue-accent)' },
  { id: 'interview', label: 'Interview', dot: 'var(--brass)',       count_bg: 'rgba(166,128,60,0.14)', count_text: 'var(--brass)' },
  { id: 'offer',     label: 'Offer',     dot: 'var(--success)',     count_bg: 'var(--success-bg)', count_text: 'var(--success)' },
  { id: 'rejected',  label: 'Rejected',  dot: 'var(--danger)',      count_bg: 'var(--danger-bg)',  count_text: 'var(--danger)' },
]

function exportToCSV(applications) {
  const headers = ['Job Title', 'Company', 'Location', 'Status', 'Match Score', 'Applied Date', 'LinkedIn URL']
  const rows = applications.map(a => [
    `"${a.job_title || ''}"`, `"${a.company || ''}"`, `"${a.location || ''}"`,
    `"${a.status || ''}"`, a.match_score || '', a.applied_date || '', `"${a.linkedin_url || ''}"`
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `jobtrack-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function Tracker({ applications, loading, onUpdate, onRefresh }) {
  const dragApp = useRef(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  async function moveCard(app, newStatus) {
    if (app.status === newStatus) return
    onUpdate(applications.map(a => a.id === app.id ? { ...a, status: newStatus } : a))
    try { await updateApplication(app.id, { status: newStatus }) } catch { }
  }

  async function removeCard(app) {
    onUpdate(applications.filter(a => a.id !== app.id))
    try { await deleteApplication(app.id) } catch { }
  }

  function onDragStart(e, app) {
    dragApp.current = app
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, colId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  function onDragLeave() {
    setDragOverCol(null)
  }

  function onDrop(e, colId) {
    e.preventDefault()
    setDragOverCol(null)
    if (dragApp.current) moveCard(dragApp.current, colId)
    dragApp.current = null
  }

  if (loading) return (
    <div className="text-center py-20" style={{ color: 'var(--text-ghost)' }}>
      <div className="animate-spin w-7 h-7 border-2 rounded-full mx-auto mb-3"
        style={{ borderColor: 'var(--blue-accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm">Loading your applications...</p>
    </div>
  )

  if (!applications.length) return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--blue-pale)', border: '1px solid rgba(122,46,46,0.22)' }}>
        <Kanban size={24} style={{ color: 'var(--blue-accent)' }} />
      </div>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', color: 'var(--navy-900)' }}>No applications yet</h3>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Find jobs and click "Open & track" or add from a JD evaluation.</p>
      {onRefresh && <button onClick={onRefresh} className="btn-ghost mt-4"><RefreshCw size={13} />Refresh</button>}
    </div>
  )

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: 'var(--navy-900)' }}>Application tracker</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{applications.length} application{applications.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && <button onClick={onRefresh} className="btn-ghost text-xs py-1.5"><RefreshCw size={12} />Refresh</button>}
          <button onClick={() => exportToCSV(applications)} className="btn-secondary text-xs py-1.5"><Download size={13} />Export CSV</button>
        </div>
      </div>

      <div className="kanban-grid grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {COLS.map(col => {
          const colApps = applications.filter(a => a.status === col.id)
          return (
            <div key={col.id} className="kanban-col"
              onDragOver={e => onDragOver(e, col.id)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, col.id)}
              style={{ transition: 'background 0.15s', borderRadius: 12,
                background: dragOverCol === col.id ? 'rgba(122,46,46,0.06)' : 'transparent',
                outline: dragOverCol === col.id ? '2px dashed rgba(122,46,46,0.35)' : '2px dashed transparent' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.dot }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{col.label}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: col.count_bg, color: col.count_text }}>{colApps.length}</span>
              </div>

              <div className="space-y-2">
                {colApps.map(app => (
                  <div key={app.id} className="kcard"
                    draggable
                    onDragStart={e => onDragStart(e, app)}
                    style={{ cursor: 'grab' }}>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{app.job_title}</div>
                        <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {app.company}{app.location ? ` · ${app.location}` : ''}
                        </div>
                      </div>
                      <button onClick={() => removeCard(app)} className="flex-shrink-0 mt-0.5 transition-colors"
                        style={{ color: 'var(--text-ghost)' }}
                        onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-ghost)'}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      {app.match_score
                        ? <span className="text-xs font-semibold" style={{ color: app.match_score >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                            {app.match_score}% match
                          </span>
                        : <span />
                      }
                      <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>{app.applied_date}</span>
                    </div>
                    {app.linkedin_url && (
                      <a href={app.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-xs block mb-2 truncate" style={{ color: 'var(--blue-accent)' }}>
                        View posting ↗
                      </a>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveCard(app, c.id)}
                          className="text-xs px-2 py-0.5 rounded transition-colors"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-subtle)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
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
      <p className="text-xs text-center mt-4" style={{ color: 'var(--text-ghost)' }}>Changes save automatically to your database</p>
    </div>
  )
}
