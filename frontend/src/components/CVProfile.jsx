import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Cpu, RefreshCw, MapPin, CheckCircle, AlertCircle, Briefcase, Clock } from 'lucide-react'
import { parseCV } from '../lib/api'
import { getSessionId } from '../lib/session'

export default function CVProfile({ profile, onProfileParsed, onSwap }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted.length) { setFile(accepted[0]); setError(null) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1
  })

  async function handleParse() {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const { data } = await parseCV(file, getSessionId())
      onProfileParsed(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Parsing failed. Check your backend is running.')
    } finally { setLoading(false) }
  }

  if (profile) {
    const initials = profile.initials || profile.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'
    return (
      <div className="animate-slide-up">
        {/* Profile hero card */}
        <div className="card" style={{ borderLeft: '3px solid var(--blue-accent)', padding: '24px' }}>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--blue-accent), var(--navy-700))' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: 'var(--text-primary)' }}>
                {profile.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.title}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {profile.location && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={11} />{profile.location}
                  </span>
                )}
                {profile.years_exp && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} />{profile.years_exp}
                  </span>
                )}
              </div>
            </div>
            <span className="badge-green"><CheckCircle size={11} />Ready</span>
          </div>

          {profile.summary && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              {profile.summary}
            </p>
          )}

          <div className="mb-4">
            <span className="section-label">Extracted skills</span>
            <div className="flex flex-wrap">
              {profile.skills?.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[['Experience', profile.years_exp], ['Seniority', profile.seniority], ['Domain', profile.domain]].map(([label, value]) => (
              <div key={label} className="rounded-lg p-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-light)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-ghost)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
            <button className="btn-primary flex-1 justify-center" onClick={() => onProfileParsed(profile)}>
              <ClipboardCheck size={14} />Evaluate a JD
            </button>
            <button className="btn-ghost" onClick={onSwap}>
              <RefreshCw size={13} />Swap CV
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      {/* Upload hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: 'var(--blue-pale)', border: '1px solid #BFDBFE' }}>
          <Briefcase size={22} style={{ color: 'var(--blue-accent)' }} />
        </div>
        <h1 style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: '1.75rem', color: 'var(--navy-900)', lineHeight: 1.2 }}>
          Upload your CV
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          AI reads your actual file and extracts your skills, experience, and seniority
        </p>
      </div>

      <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div
          {...getRootProps()}
          className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
          style={{
            border: `2px dashed ${isDragActive ? 'var(--blue-accent)' : 'var(--border)'}`,
            background: isDragActive ? 'var(--blue-pale)' : 'var(--surface-raised)',
          }}
        >
          <input {...getInputProps()} />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: isDragActive ? 'var(--blue-pale)' : 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
            <Upload size={18} style={{ color: isDragActive ? 'var(--blue-accent)' : 'var(--text-ghost)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {file ? file.name : isDragActive ? 'Drop it here' : 'Drop your CV or click to upload'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>PDF · DOCX · TXT — max 10MB</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg mt-3 text-xs"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #FECACA' }}>
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        <button className="btn-primary w-full justify-center mt-4" onClick={handleParse} disabled={!file || loading}>
          {loading
            ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Parsing with AI...</>
            : <><Cpu size={15} />Parse CV with AI</>
          }
        </button>
      </div>
    </div>
  )
}

function ClipboardCheck({ size, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  )
}
