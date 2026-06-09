import axios from 'axios'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
})

// Attach JWT to every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// CV — parsing is FREE, no credits consumed
export const parseCV = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/cv/parse', form)
}

// Jobs
export const searchJobs = (query, location, seniority = 'senior', recency = 'week') =>
  api.get('/api/jobs/search', { params: { query, location, seniority, recency } })

// Applications — no session_id, user_id comes from JWT on backend
export const getApplications = () =>
  api.get('/api/applications/')

export const createApplication = (data) =>
  api.post('/api/applications/', data)

export const updateApplication = (id, data) =>
  api.patch(`/api/applications/${id}`, data)

export const deleteApplication = (id) =>
  api.delete(`/api/applications/${id}`)

export const getStats = () =>
  api.get('/api/applications/stats')

// CV Tailoring — costs 1 credit
export const tailorCV = (jdText, cvRawText, cvProfile) =>
  api.post('/api/tailor/tailor-cv', {
    jd_text: jdText,
    cv_raw_text: cvRawText,
    cv_profile: cvProfile,
  })

// Recruiter
export const analyzeJD = (jdText) =>
  api.post('/api/recruiter/analyze-jd', { jd_text: jdText })

export const scoreCandidate = (file, requiredSkills, niceToHave) => {
  const form = new FormData()
  form.append('file', file)
  form.append('jd_required_skills', JSON.stringify(requiredSkills))
  form.append('jd_nice_to_have', JSON.stringify(niceToHave))
  return api.post('/api/recruiter/score-candidate', form)
}

export const getShortlist = () =>
  api.get('/api/recruiter/shortlist')

export const addToShortlist = (data) => {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => form.append(k, typeof v === 'object' ? JSON.stringify(v) : v))
  return api.post('/api/recruiter/shortlist', form)
}
