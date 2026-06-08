import { useState, useEffect } from 'react'
import { Search, ExternalLink, CheckCircle, BookmarkPlus, Clock } from 'lucide-react'
import { searchJobs, createApplication } from '../lib/api'
import { getSessionId } from '../lib/session'

const LOCATIONS = ['Pune', 'Bangalore', 'Hyderabad', 'Mumbai', 'Gurgaon', 'Chennai', 'UAE']

const RECENCY_OPTIONS = [
  { value: '24h',   label: 'Last 24 hours' },
  { value: 'week',  label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'any',   label: 'Any time' },
]

const SENIORITY_OPTIONS = [
  { value: 'senior', label: 'Senior level' },
  { value: 'mid',    label: 'Mid level' },
  { value: 'any',    label: 'Any level' },
]

export default function JobSearch({ profile, applications, onApply }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Pune')
  const [recency, setRecency] = useState('week')
  const [seniority, setSeniority] = useState('senior')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualCompany, setManualCompany] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (profile?.title) setQuery(profile.title)
  }, [profile?.title])

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { data } = await searchJobs(query, location, seniority, recency)
      setResults(data)
    } catch {
      const encoded = encodeURIComponent(query)
      const loc = encodeURIComponent(location)
      const recencyMap = { '24h': 'r86400', 'week': 'r604800', 'month': 'r2592000', 'any': '' }
      const rf = recencyMap[recency] ? `&f_TPR=${recencyMap[recency]}` : ''
      setResults({
        query, location, recency_label: RECENCY_OPTIONS.find(r => r.value === recency)?.label,
        primary_url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=${loc}${rf}`,
        search_urls: [
          { label: query, url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=${loc}&f_E=4${rf}`, description: `Exact match · ${location}` },
          { label: `Senior ${query}`, url: `https://www.linkedin.com/jobs/search/?keywords=Senior+${encoded}&location=${loc}&f_E=4${rf}`, description: `Senior level · ${location}` },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleManualTrack() {
    if (!manualTitle.trim() || !manualCompany.trim()) return
    setAddingManual(true)
    try {
      const { data } = await createApplication({
        session_id: getSessionId(),
        job_title: manualTitle,
        company: manualCompany,
        location,
        match_score: null,
        linkedin_url: manualUrl || null
      })
      onApply({ ...data, jobId: data.id })
      setManualTitle(''); setManualCompany(''); setManualUrl('')
      setShowManual(false)
    } catch {
      onApply({
        id: Date.now().toString(), jobId: Date.now().toString(),
        job_title: manualTitle, company: manualCompany, location,
        match_score: null, status: 'applied',
        applied_date: new Date().toISOString().split('T')[0]
      })
      setManualTitle(''); setManualCompany(''); setManualUrl('')
      setShowManual(false)
    } finally {
      setAddingManual(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="section-label">Search parameters</div>
        <div className="flex gap-2 flex-wrap mb-3">
          <input
            className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Job title or keywords..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            value={location}
            onChange={e => setLocation(e.target.value)}
          >
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Clock size={13} className="text-gray-400 flex-shrink-0" />
            <select
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              value={recency}
              onChange={e => setRecency(e.target.value)}
            >
              {RECENCY_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <select
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            value={seniority}
            onChange={e => setSeniority(e.target.value)}
          >
            {SENIORITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="btn-primary" onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading
              ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              : <Search size={15} />
            }
            Search
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Generates LinkedIn search links filtered by your role, location, seniority, and posting date.
          {profile?.skills?.length > 0 && ` Profile loaded: ${profile.skills.length} skills.`}
        </p>
      </div>

      {results && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="section-label mb-0">{results.search_urls?.length} LinkedIn search variants</div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />{results.recency_label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Each link opens live LinkedIn results with your filters applied. Find a job you like → come back → use <strong>"Track a job"</strong> below to add it to your tracker.
          </p>
          <div className="space-y-2">
            {results.search_urls?.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>
                </div>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 ml-3" />
              </a>
            ))}
          </div>
          <a
            href={results.primary_url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full justify-center mt-4"
          >
            <ExternalLink size={15} />Open primary search on LinkedIn
          </a>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="section-label mb-0">Track a job</div>
            <p className="text-xs text-gray-400 mt-1">Found a role on LinkedIn? Add it to your tracker here.</p>
          </div>
          <button className="btn-secondary text-sm" onClick={() => setShowManual(!showManual)}>
            <BookmarkPlus size={14} />{showManual ? 'Cancel' : 'Add job'}
          </button>
        </div>

        {showManual && (
          <div className="border-t border-gray-100 pt-4 space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Job title *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g. Senior Business Analyst"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Company *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g. Accenture"
                  value={manualCompany}
                  onChange={e => setManualCompany(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">LinkedIn URL (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleManualTrack}
              disabled={!manualTitle.trim() || !manualCompany.trim() || addingManual}
            >
              {addingManual
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <CheckCircle size={15} />
              }
              Add to tracker
            </button>
          </div>
        )}

        {applications?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{applications.length} job{applications.length !== 1 ? 's' : ''} tracked → go to Tracker tab to manage</p>
          </div>
        )}
      </div>
    </div>
  )
}
