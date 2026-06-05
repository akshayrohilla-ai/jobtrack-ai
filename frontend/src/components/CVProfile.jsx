import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Cpu, RefreshCw, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { parseCV } from '../lib/api'
import { getSessionId } from '../lib/session'

export default function CVProfile({ profile, onProfileParsed, onSwap }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    setLoading(true)
    setError(null)
    try {
      const { data } = await parseCV(file, getSessionId())
      onProfileParsed(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Parsing failed. Check your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  if (profile) {
    const initials = profile.initials || profile.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'
    return (
      <div className="card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-base flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{profile.name}</div>
            <div className="text-sm text-gray-500">{profile.title}</div>
            {profile.location && (
              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={11} />{profile.location}
              </div>
            )}
          </div>
          <span className="badge-green flex items-center gap-1">
            <CheckCircle size={11} />Profile ready
          </span>
        </div>

        {profile.summary && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{profile.summary}</p>
        )}

        <div className="section-label">Skills extracted</div>
        <div className="mb-4">
          {profile.skills?.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            ['Experience', profile.years_exp],
            ['Seniority', profile.seniority],
            ['Domain', profile.domain],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-sm font-medium">{value || '—'}</div>
            </div>
          ))}
        </div>

        <button className="btn-ghost w-full justify-center mt-2" onClick={onSwap}>
          <RefreshCw size={14} />Upload a different resume
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-label">Upload your CV</div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={28} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600 font-medium">
          {file ? file.name : isDragActive ? 'Drop it here...' : 'Drop your CV here or click to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF · DOCX · TXT — max 10MB</p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <button
        className="btn-primary w-full justify-center mt-4"
        onClick={handleParse}
        disabled={!file || loading}
      >
        {loading ? (
          <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Parsing with AI...</>
        ) : (
          <><Cpu size={15} />Parse CV with AI</>
        )}
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        AI reads your actual file and extracts name, skills, experience, and seniority
      </p>
    </div>
  )
}
