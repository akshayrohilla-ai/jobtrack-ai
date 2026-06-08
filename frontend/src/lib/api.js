import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
})

// CV
export const parseCV = (file, sessionId) => {
  const form = new FormData()
  form.append('file', file)
  form.append('session_id', sessionId)
  return api.post('/api/cv/parse', form)
}

// Jobs
export const searchJobs = (query, location, seniority = 'senior', recency = 'week') =>
  api.get('/api/jobs/search', { params: { query, location, seniority, recency } })

// Applications
export const getApplications = (sessionId) =>
  api.get(`/api/applications/session/${sessionId}`)

export const createApplication = (data) =>
  api.post('/api/applications/', data)

export const updateApplication = (id, data) =>
  api.patch(`/api/applications/${id}`, data)

export const deleteApplication = (id) =>
  api.delete(`/api/applications/${id}`)

export const getStats = (sessionId) =>
  api.get(`/api/applications/stats/${sessionId}`)

// Recruiter
export const analyzeJD = (jdText, sessionId) =>
  api.post('/api/recruiter/analyze-jd', { jd_text: jdText, session_id: sessionId })

export const scoreCandidate = (file, sessionId, requiredSkills, niceToHave) => {
  const form = new FormData()
  form.append('file', file)
  form.append('session_id', sessionId)
  form.append('jd_required_skills', JSON.stringify(requiredSkills))
  form.append('jd_nice_to_have', JSON.stringify(niceToHave))
  return api.post('/api/recruiter/score-candidate', form)
}

export const getShortlist = (sessionId) =>
  api.get(`/api/recruiter/shortlist/${sessionId}`)

export const addToShortlist = (data) => {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => form.append(k, typeof v === 'object' ? JSON.stringify(v) : v))
  return api.post('/api/recruiter/shortlist', form)
}
