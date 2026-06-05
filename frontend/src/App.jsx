import { useState } from 'react'
import { Briefcase } from 'lucide-react'
import SeekerMode from './pages/SeekerMode'
import RecruiterMode from './pages/RecruiterMode'

export default function App() {
  const [mode, setMode] = useState('seeker')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-blue-600" />
          <span className="font-medium text-gray-900">JobTrack AI</span>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('seeker')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'seeker'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Job seeker
          </button>
          <button
            onClick={() => setMode('recruiter')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'recruiter'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recruiter
          </button>
        </div>
      </header>

      <main>
        {mode === 'seeker' ? <SeekerMode /> : <RecruiterMode />}
      </main>
    </div>
  )
}
