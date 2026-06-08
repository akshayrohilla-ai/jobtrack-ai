import { useState, useEffect } from 'react'
import { FileText, Search, LayoutDashboard, Kanban, ClipboardCheck, AlertCircle } from 'lucide-react'
import CVProfile from '../components/CVProfile'
import JobSearch from '../components/JobSearch'
import Tracker from '../components/Tracker'
import Dashboard from '../components/Dashboard'
import JDEvaluator from '../components/JDEvaluator'
import { getApplications } from '../lib/api'
import { getSessionId } from '../lib/session'

const TABS = [
  { id: 'cv',        label: 'My profile',  icon: FileText },
  { id: 'evaluate',  label: 'Evaluate JD', icon: ClipboardCheck },
  { id: 'jobs',      label: 'Find jobs',   icon: Search },
  { id: 'tracker',   label: 'Tracker',     icon: Kanban },
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
]

export default function SeekerMode() {
  const [tab, setTab]                     = useState('cv')
  const [profile, setProfile]             = useState(null)
  const [applications, setApplications]   = useState([])
  const [loadingApps, setLoadingApps]     = useState(true)
  const [loadError, setLoadError]         = useState(null)
  // Lift evaluation state up so it persists across tab switches
  const [evalResult, setEvalResult]       = useState(null)
  const [evalJdText, setEvalJdText]       = useState('')

  useEffect(() => { loadApps() }, [])

  async function loadApps() {
    setLoadingApps(true)
    setLoadError(null)
    try {
      const { data } = await getApplications(getSessionId())
      if (Array.isArray(data)) {
        setApplications(data.map(a => ({ ...a, jobId: a.id })))
      }
    } catch (e) {
      setLoadError(e.response?.data?.detail || e.message || 'Failed to load applications')
    } finally {
      setLoadingApps(false)
    }
  }

  function handleProfileParsed(p) {
    // Clear evaluation results when a new CV is uploaded
    setProfile(p)
    setEvalResult(null)
    setEvalJdText('')
    setTab('evaluate')
  }

  return (
    <div>
      <nav className="bg-white border-b border-gray-100 px-4 flex overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
            {id === 'tracker' && applications.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5 ml-1">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {loadError && (
        <div className="max-w-4xl mx-auto px-5 pt-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>Could not load saved applications:</strong> {loadError}
              <button onClick={loadApps} className="ml-2 underline">Retry</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-5">
        {tab === 'cv' && (
          <CVProfile
            profile={profile}
            onProfileParsed={handleProfileParsed}
            onSwap={() => {
              setProfile(null)
              setEvalResult(null)
              setEvalJdText('')
            }}
          />
        )}
        {tab === 'evaluate' && (
          <JDEvaluator
            profile={profile}
            savedResult={evalResult}
            savedJdText={evalJdText}
            onResultChange={setEvalResult}
            onJdTextChange={setEvalJdText}
            onTrack={(app) => setApplications(prev => [...prev, { ...app, jobId: app.id }])}
          />
        )}
        {tab === 'jobs' && (
          <JobSearch
            profile={profile}
            applications={applications}
            onApply={(app) => setApplications(prev => {
              const exists = prev.find(a => a.id === app.id)
              return exists ? prev : [...prev, app]
            })}
          />
        )}
        {tab === 'tracker' && (
          <Tracker
            applications={applications}
            loading={loadingApps}
            onUpdate={setApplications}
            onRefresh={loadApps}
          />
        )}
        {tab === 'dashboard' && (
          <Dashboard applications={applications} />
        )}
      </div>
    </div>
  )
}
