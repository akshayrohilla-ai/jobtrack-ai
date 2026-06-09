import { useState, useEffect } from 'react'
import { FileText, Search, LayoutDashboard, Kanban, ClipboardCheck, AlertCircle, Wand2 } from 'lucide-react'
import CVProfile from '../components/CVProfile'
import JobSearch from '../components/JobSearch'
import Tracker from '../components/Tracker'
import Dashboard from '../components/Dashboard'
import JDEvaluator from '../components/JDEvaluator'
import CVTailor from '../components/CVTailor'
import { getApplications, getProfile } from '../lib/api'
import { useAuth } from '../App'

const SESSION_CV_KEY = 'jobtrack_raw_cv'

const TABS = [
  { id: 'cv',        label: 'My profile',  icon: FileText },
  { id: 'jobs',      label: 'Find jobs',   icon: Search },
  { id: 'evaluate',  label: 'Evaluate JD', icon: ClipboardCheck },
  { id: 'tailor',    label: 'Tailor CV',   icon: Wand2 },
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

  // Raw CV text stored in sessionStorage — survives refresh, clears on tab close
  // Retrieved on mount so a page refresh doesn't lose the CV text
  const [rawCvText, setRawCvText] = useState(() => {
    try { return sessionStorage.getItem(SESSION_CV_KEY) || '' } catch { return '' }
  })

  useEffect(() => {
    if (user) {
      loadApps()
      // If rawCvText is empty (e.g. after refresh or new session),
      // try to restore it from the last saved CV profile in Supabase
      if (!rawCvText) restoreRawCvText()
    } else {
      setApplications([])
    }
  }, [user])

  async function restoreRawCvText() {
    try {
      const { data } = await getProfile()
      if (data?.raw_text) {
        try { sessionStorage.setItem(SESSION_CV_KEY, data.raw_text) } catch {}
        setRawCvText(data.raw_text)
        // Restore parsed profile if not already in state
        if (!profile && data) {
          setProfile({
            name: data.name, title: data.title, location: data.location,
            years_exp: data.years_exp, seniority: data.seniority, domain: data.domain,
            skills: data.skills || [], summary: data.summary, initials: data.initials,
          })
        }
      }
      // If data exists but raw_text is null (old row before deploy),
      // silently skip — user will get raw_text on next parse
    } catch {
      // 404 = no saved profile yet, or old rows without user_id — silently ignore
    }
  }

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
    setProfile(p)
    setEvalResult(null)
    setEvalJdText('')
    setEvalRole('')
    setEvalCompany('')

    // Store raw CV text in sessionStorage for tailoring
    // raw_text is returned from backend alongside the parsed profile
    if (p.raw_text) {
      try {
        sessionStorage.setItem(SESSION_CV_KEY, p.raw_text)
        setRawCvText(p.raw_text)
      } catch { }
    }
  }

  function handleSwap() {
    // Only reset CV state — preserve JD evaluation so user doesn't lose credits
    setProfile(null)
    try { sessionStorage.removeItem(SESSION_CV_KEY) } catch { }
    setRawCvText('')
  }

  function goToFindJobs()   { setTab('jobs') }
  function goToEvaluateJD() { setTab('evaluate') }

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
        {tab === 'cv' && (
          <CVProfile
            profile={profile}
            onProfileParsed={handleProfileParsed}
            onSwap={handleSwap}
            onFindJobs={goToFindJobs}
            onEvaluateJD={goToEvaluateJD}
          />
        )}
        {tab === 'jobs' && (
          <JobSearch profile={profile} applications={applications}
            onApply={(app) => setApplications(prev => {
              const exists = prev.find(a => a.id === app.id)
              return exists ? prev : [...prev, app]
            })} />
        )}
        {tab === 'evaluate' && (
          <JDEvaluator
            profile={profile}
            savedResult={evalResult} savedJdText={evalJdText}
            savedRole={evalRole} savedCompany={evalCompany}
            onResultChange={setEvalResult} onJdTextChange={setEvalJdText}
            onRoleChange={setEvalRole} onCompanyChange={setEvalCompany}
            applications={applications}
            onTrack={(app) => setApplications(prev => {
              const exists = prev.find(a => a.id === app.id)
              return exists ? prev : [...prev, { ...app, jobId: app.id }]
            })}
          />
        )}
        {tab === 'tailor' && (
          <CVTailor
            profile={profile}
            rawCvText={rawCvText}
            evalJdText={evalJdText}
            evalRole={evalRole}
            evalCompany={evalCompany}
          />
        )}
        {tab === 'tracker'   && <Tracker applications={applications} loading={loadingApps} onUpdate={setApplications} onRefresh={loadApps} />}
        {tab === 'dashboard' && <Dashboard applications={applications} />}
      </div>
    </div>
  )
}
