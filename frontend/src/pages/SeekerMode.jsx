import { useState } from 'react'
import { FileText, Search, LayoutDashboard, Kanban } from 'lucide-react'
import CVProfile from '../components/CVProfile'
import JobSearch from '../components/JobSearch'
import Tracker from '../components/Tracker'
import Dashboard from '../components/Dashboard'

const TABS = [
  { id: 'cv', label: 'My profile', icon: FileText },
  { id: 'jobs', label: 'Find jobs', icon: Search },
  { id: 'tracker', label: 'Tracker', icon: Kanban },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function SeekerMode() {
  const [tab, setTab] = useState('cv')
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])

  return (
    <div>
      <nav className="bg-white border-b border-gray-100 px-4 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
              tab === id
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="max-w-4xl mx-auto p-5">
        {tab === 'cv' && (
          <CVProfile
            profile={profile}
            onProfileParsed={(p) => { setProfile(p); setTab('jobs') }}
            onSwap={() => setProfile(null)}
          />
        )}
        {tab === 'jobs' && (
          <JobSearch
            profile={profile}
            applications={applications}
            onApply={(app) => setApplications(prev => [...prev, app])}
          />
        )}
        {tab === 'tracker' && (
          <Tracker
            applications={applications}
            onUpdate={setApplications}
          />
        )}
        {tab === 'dashboard' && (
          <Dashboard applications={applications} />
        )}
      </div>
    </div>
  )
}
