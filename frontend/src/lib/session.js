const SESSION_KEY = 'jobtrack_session_id'

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
