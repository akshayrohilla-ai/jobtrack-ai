import { useState } from 'react'
import { FileText, Users, Star } from 'lucide-react'
import JDAnalyzer from '../components/JDAnalyzer'
import CandidateScorer from '../components/CandidateScorer'
import Shortlist from '../components/Shortlist'

const TABS = [
  { id: 'jd',         label: 'Job description', icon: FileText },
  { id: 'candidates', label: 'Candidates',       icon: Users },
  { id: 'shortlist',  label: 'Shortlist',        icon: Star },
]

export default function RecruiterMode() {
  const [tab, setTab]           = useState('jd')
  const [jdAnalysis, setJdAnalysis] = useState(null)
  const [shortlist, setShortlist]   = useState([])

  return (
    <div>
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
              <Icon size={14} />{label}
              {id === 'shortlist' && shortlist.length > 0 && (
                <span className="ml-1 text-xs rounded-full px-1.5 py-0.5 font-medium"
                  style={{ background: 'var(--blue-pale)', color: 'var(--blue-accent)' }}>{shortlist.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="app-content">
        {tab === 'jd' && <JDAnalyzer onAnalyzed={(a) => { setJdAnalysis(a); setTab('candidates') }} />}
        {tab === 'candidates' && <CandidateScorer jdAnalysis={jdAnalysis} shortlist={shortlist} onShortlist={(c) => { setShortlist(prev => [...prev, c]); setTab('shortlist') }} />}
        {tab === 'shortlist' && <Shortlist shortlist={shortlist} />}
      </div>
    </div>
  )
}
