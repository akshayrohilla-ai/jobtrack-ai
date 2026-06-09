import { useState, useEffect } from 'react'
import { FileText, Search, LayoutDashboard, Kanban, ClipboardCheck, AlertCircle } from 'lucide-react'
import CVProfile from '../components/CVProfile'
import JobSearch from '../components/JobSearch'
import Tracker from '../components/Tracker'
import Dashboard from '../components/Dashboard'
import JDEvaluator from '../components/JDEvaluator'
import { getApplications } from '../lib/api'
import { useAuth } from '../App'

const TABS = [
  { id: 'cv',        label: 'My profile',  icon: FileText },
  { id: 'evaluate',  label: 'Evaluate JD', icon: ClipboardCheck },
  { id: 'jobs',      label: 'Find jobs',   icon: Search },
  { id: 'tracker',   label: 'Tracker',     icon: Kanban },
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
]

export default function SeekerMode() {
  const { user } = useAuth()

  const [tab, setTab]                   = useState('cv')
  const [profile, setProfile]           = useState(null)
  const [applications, setApplications] = useState([])
  const [loadingApps, setLoadingApps]   = useState(false)
  const [loadError, setLoadError]       = useState(null)
  const [evalResult, setEvalResult]     = useState(null)
  const [evalJdText, setEvalJdText]     = useState('')
  const [evalRole, setEvalRole]         = useState('')
  const [evalCompany, setEvalCompany]   = useState('')

  // Only load applications when user is signed in
  useEffect(() => {
    if (user) loadApps()
    else setApplications([])
  }, [user])

  async function loadApps() {
    setLoadingApps(true); setLoadError(null)
    try {
      const { data } = await getApplications()
      if (Array.isArray(data)) setApplications(data.map(a => ({ ...a, jobId: a.id })))
    } catch (e) {
      setLoadError(e.response?.data?.detail || e.message || 'Failed to load applications')
    } finally { setLoadingApps(false) }
  }

  function handleProfileParsed(p) {
    setProfile(p); setEvalResult(null); setEvalJdText(''); setEvalRole(''); setEvalCompany('')
    setTab('evaluate')
  }

  function handleSwap() {
    setProfile(null); setEvalResult(null); setEvalJdText(''); setEvalRole(''); setEvalCompany('')
  }

  return (
    <div>
      {/* Tab nav */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}
          className="tab-nav flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-3.5 text-xs font-medium border-b-2 transition-all duration-150 whitespace-nowrap"
              style={tab === id
                ? { borderBottomColor: 'var(--blue-accent)', color: 'var(--blue-accent)' }
                : { borderBottomColor: 'transparent', color: 'var(--text-muted)' }
              }>
              <Icon size={14} />
              {label}
              {id === 'tracker' && applications.length > 0 && (
                <span className="ml-1 text-xs rounded-full px-1.5 py-0.5 font-medium"
                  style={{ background: 'var(--blue-pale)', color: 'var(--blue-accent)' }}>
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 24px 0' }}>
          <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #FECACA' }}>
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <div><strong>Could not load saved applications:</strong> {loadError}
              <button onClick={loadApps} className="ml-2 underline">Retry</button></div>
          </div>
        </div>
      )}

      <div className="app-content">
        {tab === 'cv'       && <CVProfile profile={profile} onProfileParsed={handleProfileParsed} onSwap={handleSwap} />}
        {tab === 'evaluate' && (
          <JDEvaluator
            profile={profile}
            savedResult={evalResult} savedJdText={evalJdText}
            savedRole={evalRole} savedCompany={evalCompany}
            onResultChange={setEvalResult} onJdTextChange={setEvalJdText}
            onRoleChange={setEvalRole} onCompanyChange={setEvalCompany}
            onTrack={(app) => setApplications(prev => {
              const exists = prev.find(a => a.id === app.id)
              return exists ? prev : [...prev, { ...app, jobId: app.id }]
            })}
          />
        )}
        {tab === 'jobs' && (
          <JobSearch profile={profile} applications={applications}
            onApply={(app) => setApplications(prev => {
              const exists = prev.find(a => a.id === app.id)
              return exists ? prev : [...prev, app]
            })} />
        )}
        {tab === 'tracker'   && <Tracker applications={applications} loading={loadingApps} onUpdate={setApplications} onRefresh={loadApps} />}
        {tab === 'dashboard' && <Dashboard applications={applications} />}
      </div>
    </div>
  )
}
