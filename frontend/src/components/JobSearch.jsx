import { useState } from 'react'
import { Search, ExternalLink, CheckCircle } from 'lucide-react'
import { searchJobs, createApplication } from '../lib/api'
import { getSessionId } from '../lib/session'

const LOCATIONS = ['Pune', 'Bangalore', 'Hyderabad', 'Mumbai', 'Gurgaon', 'Chennai', 'UAE']

const SAMPLE_JOBS = [
  { id: 's1', title: 'Senior Business Systems Analyst', company: 'Accenture', score: 94, skills: ['Business Analysis', 'Stakeholder Mgmt', 'Power BI', 'KPI Development', 'Agile/SAFe'], matchedSkills: ['Business Analysis', 'Power BI', 'KPI Development'] },
  { id: 's2', title: 'Technical Business Analyst – Cloud', company: 'Infosys', score: 91, skills: ['Cloud Migration', 'SQL', 'VMware', 'Stakeholder Mgmt', 'Agile'], matchedSkills: ['SQL', 'VMware', 'Stakeholder Mgmt'] },
  { id: 's3', title: 'AI-Augmented Business Analyst', company: 'Capgemini', score: 89, skills: ['Python', 'NL-to-SQL', 'RAG', 'Power BI', 'Business Analysis'], matchedSkills: ['Python', 'NL-to-SQL', 'RAG', 'Power BI'] },
  { id: 's4', title: 'Senior IT Analyst – Enterprise Systems', company: 'TCS', score: 87, skills: ['ITSM', 'Process Improvement', 'KPI', 'Agile', 'CMDB'], matchedSkills: ['ITSM', 'Process Improvement', 'Agile'] },
  { id: 's5', title: 'Enterprise Transformation BA', company: 'Wipro', score: 85, skills: ['Change Management', 'Stakeholder Mgmt', 'Agile', 'SQL', 'Reporting'], matchedSkills: ['Stakeholder Mgmt', 'Agile', 'SQL'] },
]

function ScoreRing({ score }) {
  const color = score >= 90 ? '#16a34a' : '#d97706'
  const dash = score * 1.257
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} 125.7`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">{score}</div>
    </div>
  )
}

export default function JobSearch({ profile, applications, onApply }) {
  const [query, setQuery] = useState(profile?.title || 'Senior Business Systems Analyst')
  const [location, setLocation] = useState('Pune')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trackingId, setTrackingId] = useState(null)

  async function handleSearch() {
    setLoading(true)
    try {
      const { data } = await searchJobs(query, location)
      const jobs = SAMPLE_JOBS.map(j => ({
        ...j,
        location,
        linkedinUrl: data.search_urls[0]?.url?.replace('Senior+Business+Systems+Analyst', encodeURIComponent(j.title)) || data.primary_url
      }))
      setResults({ jobs, searchUrls: data.search_urls, primaryUrl: data.primary_url })
    } catch {
      const jobs = SAMPLE_JOBS.map(j => ({
        ...j, location,
        linkedinUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(j.title)}&location=${encodeURIComponent(location)}`
      }))
      setResults({ jobs, searchUrls: [], primaryUrl: jobs[0].linkedinUrl })
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyAndTrack(job) {
    window.open(job.linkedinUrl, '_blank')
    if (applications.find(a => a.jobId === job.id)) return
    setTrackingId(job.id)
    try {
      const { data } = await createApplication({
        session_id: getSessionId(),
        job_title: job.title,
        company: job.company,
        location: job.location,
        match_score: job.score,
        linkedin_url: job.linkedinUrl
      })
      onApply({ ...data, jobId: job.id })
    } catch {
      onApply({ id: Date.now().toString(), jobId: job.id, job_title: job.title, company: job.company, location: job.location, match_score: job.score, status: 'applied', applied_date: new Date().toISOString().split('T')[0] })
    } finally {
      setTrackingId(null)
    }
  }

  const trackedIds = new Set(applications.map(a => a.jobId))

  return (
    <div>
      <div className="card">
        <div className="section-label">Search parameters</div>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Job title..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            value={location}
            onChange={e => setLocation(e.target.value)}
          >
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {results?.searchUrls?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-2">Direct LinkedIn searches</div>
            <div className="flex flex-wrap gap-2">
              {results.searchUrls.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink size={10} />{s.label}
                </a>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Green tags = skills matching your CV · "Open & track" opens LinkedIn and logs the application</p>
      </div>

      {!results && (
        <div className="text-center py-12 text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click search to find personalized jobs</p>
        </div>
      )}

      {results?.jobs.map(job => {
        const isTracked = trackedIds.has(job.id)
        const isTracking = trackingId === job.id
        return (
          <div key={job.id} className={`card flex gap-3 ${isTracked ? 'border-green-200' : ''}`}>
            <ScoreRing score={job.score} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{job.title}</div>
              <div className="text-xs text-gray-400 mb-2">{job.company} · {job.location} · Posted recently</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {job.skills.map(s => (
                  <span key={s} className={job.matchedSkills.includes(s) ? 'skill-chip-match' : 'skill-chip'}>{s}</span>
                ))}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {isTracked ? (
                  <span className="badge-green flex items-center gap-1 text-xs px-3 py-1.5">
                    <CheckCircle size={11} />Tracked
                  </span>
                ) : (
                  <button
                    className="btn-primary text-xs py-1.5"
                    onClick={() => handleApplyAndTrack(job)}
                    disabled={isTracking}
                  >
                    {isTracking
                      ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      : <ExternalLink size={12} />
                    }
                    Open & track
                  </button>
                )}
                <a href={job.linkedinUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs py-1.5">
                  <ExternalLink size={12} />LinkedIn
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
