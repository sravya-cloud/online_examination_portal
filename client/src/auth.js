const KEY = 'exam-portal-session'

export const PORTALS = {
  student: { label: 'Student', role: 'STUDENT' },
  teacher: { label: 'Teacher', role: 'TEACHER' },
  admin: { label: 'Administrator', role: 'ADMIN' },
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable: session lasts until reload */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export async function loginRequest(portal, email, password) {
  const res = await fetch(`/api/auth/${portal}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data
}

export async function fetchDashboard(portal, token) {
  const res = await fetch(`/api/${portal}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || 'Request failed')
    err.status = res.status
    throw err
  }
  return res.json()
}
