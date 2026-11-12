import { useEffect, useState } from 'react'
import { PORTALS, fetchDashboard } from './auth.js'

export default function Dashboard({ session, onLogout }) {
  const { user, token } = session
  const portal = Object.keys(PORTALS).find((k) => PORTALS[k].role === user.role)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    fetchDashboard(portal, token)
      .then(() => active && setStatus('ready'))
      .catch((err) => {
        if (!active) return
        if (err.status === 401) onLogout()
        else setStatus('error')
      })
    return () => {
      active = false
    }
  }, [portal, token, onLogout])

  return (
    <main className="dashboard">
      <header>
        <h1>{PORTALS[portal].label} dashboard</h1>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </header>
      <p>Welcome, {user.name}.</p>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p className="form-error">Could not load the dashboard.</p>}
      {status === 'ready' && <p>Your features will appear here in the next sprint.</p>}
    </main>
  )
}
