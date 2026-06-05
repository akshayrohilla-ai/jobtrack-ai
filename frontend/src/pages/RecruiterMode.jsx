import { useState } from 'react'
import { FileText, Users, Star } from 'lucide-react'
import JDAnalyzer from '../components/JDAnalyzer'
import CandidateScorer from '../components/CandidateScorer'
import Shortlist from '../components/Shortlist'

const TABS = [
  { id: 'jd', label: 'Job description', icon: FileText },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'shortlist', label: 'Shortlist', icon: Star },
]

export default function RecruiterMode() {
  const [tab, setTab] = useState('jd')
  const [jdAnalysis, setJdAnalysis] = useState(null)
  const [shortlist, setShortlist] = useState([])

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
        {tab === 'jd' && (
          <JDAnalyzer
            onAnalyzed={(analysis) => { setJdAnalysis(analysis); setTab('candidates') }}
          />
        )}
        {tab === 'candidates' && (
          <CandidateScorer
            jdAnalysis={jdAnalysis}
            shortlist={shortlist}
            onShortlist={(candidate) => {
              setShortlist(prev => [...prev, candidate])
              setTab('shortlist')
            }}
          />
        )}
        {tab === 'shortlist' && (
          <Shortlist shortlist={shortlist} />
        )}
      </div>
    </div>
  )
}
