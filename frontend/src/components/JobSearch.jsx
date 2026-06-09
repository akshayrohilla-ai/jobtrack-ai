import { useState, useEffect } from 'react'
import { Search, ExternalLink, CheckCircle, BookmarkPlus, Clock, Users, Globe } from 'lucide-react'
import { searchJobs, createApplication } from '../lib/api'

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
  const [query, setQuery]         = useState('')
  const [location, setLocation]   = useState('Pune')
  const [recency, setRecency]     = useState('week')
  const [seniority, setSeniority] = useState('senior')
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [showManual, setShowManual]     = useState(false)
  const [manualTitle, setManualTitle]   = useState('')
  const [manualCompany, setManualCompany] = useState('')
  const [manualUrl, setManualUrl]       = useState('')
  const [addingManual, setAddingManual] = useState(false)

  useEffect(() => { if (profile?.title) setQuery(profile.title) }, [profile?.title])

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { data } = await searchJobs(query, location, seniority, recency)
      setResults(data)
    } catch {
      const encoded = encodeURIComponent(query)
      const loc = encodeURIComponent(location)
      setResults({
        query, location, recency_label: RECENCY_OPTIONS.find(r => r.value === recency)?.label,
        primary_url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=${loc}`,
        search_urls: [{ label: query, url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=${loc}&f_E=4`, description: `Exact match · ${location}` }]
      })
    } finally { setLoading(false) }
  }

  async function handleManualTrack() {
    if (!manualTitle.trim() || !manualCompany.trim()) return
    setAddingManual(true)
    try {
      const { data } = await createApplication({
        job_title: manualTitle,
        company: manualCompany,
        location,
        match_score: null,
        linkedin_url: manualUrl || null
      })
      onApply({ ...data, jobId: data.id })
      setManualTitle(''); setManualCompany(''); setManualUrl(''); setShowManual(false)
    } catch {
      // Optimistic fallback — show in UI even if backend failed
      onApply({
        id: Date.now().toString(), jobId: Date.now().toString(),
        job_title: manualTitle, company: manualCompany,
        location, match_score: null, status: 'applied',
        applied_date: new Date().toISOString().split('T')[0]
      })
      setManualTitle(''); setManualCompany(''); setManualUrl(''); setShowManual(false)
    } finally { setAddingManual(false) }
  }

  return (
    <div className="animate-slide-up space-y-4">
      <div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--navy-900)' }}>Find jobs</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Generate targeted LinkedIn searches filtered to your role and preferences</p>
      </div>

      {/* Search form */}
      <div className="card">
        <div className="flex gap-2 mb-3 flex-wrap">
          <input className="input-field flex-1 min-w-40" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Job title or keywords..." onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <select className="input-field" style={{ width: 'auto' }} value={location} onChange={e => setLocation(e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <Clock size={13} style={{ color: 'var(--text-ghost)', flexShrink: 0 }} />
            <select className="input-field flex-1" value={recency} onChange={e => setRecency(e.target.value)}>
              {RECENCY_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <select className="input-field flex-1" value={seniority} onChange={e => setSeniority(e.target.value)}>
            {SENIORITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="btn-primary" onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {profile?.skills?.length > 0 && (
          <p className="text-xs mt-3 pt-3" style={{ color: 'var(--text-ghost)', borderTop: '1px solid var(--border-light)' }}>
            Profile loaded — {profile.skills.length} skills · searches filtered to {seniority} level · {RECENCY_OPTIONS.find(r => r.value === recency)?.label.toLowerCase()}
          </p>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label mb-0">{results.search_urls?.length} LinkedIn search variants</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-ghost)' }}>
              <Clock size={11} />{results.recency_label}
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Each link opens live LinkedIn with your filters applied. Find a role → use <strong>Track a job</strong> below to add it to your tracker.
          </p>
          <div className="space-y-2">
            {results.search_urls?.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg transition-all group"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-accent)'; e.currentTarget.style.background = 'var(--blue-pale)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-raised)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                </div>
                <ExternalLink size={13} style={{ color: 'var(--text-ghost)', flexShrink: 0 }} />
              </a>
            ))}
          </div>
          <a href={results.primary_url} target="_blank" rel="noreferrer" className="btn-primary w-full justify-center mt-4">
            <Globe size={15} />Open primary search on LinkedIn
          </a>
        </div>
      )}

      {/* Manual track */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Track a job manually</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Found a role on LinkedIn or elsewhere? Add it here.</div>
          </div>
          <button className="btn-secondary text-xs py-1.5" onClick={() => setShowManual(!showManual)}>
            <BookmarkPlus size={13} />{showManual ? 'Cancel' : 'Add job'}
          </button>
        </div>
        {showManual && (
          <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">Job title *</label>
                <input className="input-field" placeholder="e.g. Senior Business Analyst"
                  value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
              </div>
              <div>
                <label className="section-label">Company *</label>
                <input className="input-field" placeholder="e.g. Accenture"
                  value={manualCompany} onChange={e => setManualCompany(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="section-label">LinkedIn URL <span style={{ color: 'var(--text-ghost)', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input className="input-field" placeholder="https://www.linkedin.com/jobs/view/..."
                value={manualUrl} onChange={e => setManualUrl(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleManualTrack}
              disabled={!manualTitle.trim() || !manualCompany.trim() || addingManual}>
              {addingManual ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <CheckCircle size={14} />}
              Add to tracker
            </button>
          </div>
        )}
        {applications?.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>
              {applications.length} job{applications.length !== 1 ? 's' : ''} tracked → go to Tracker tab to manage
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
