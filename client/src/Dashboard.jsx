import { useEffect, useState } from 'react'
import { PORTALS, fetchDashboard } from './auth.js'
import TeacherExamManagement from './TeacherExamManagement.jsx'
import TeacherExamReports from './TeacherExamReports.jsx'
import StudentExamView from './StudentExamView.jsx'

export default function Dashboard({ session, onLogout }) {
  const { user, token } = session
  const portal = Object.keys(PORTALS).find((k) => PORTALS[k].role === user.role)
  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('exams')

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
      {status === 'ready' && (
        <>
          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  style={{ fontWeight: tab === 'exams' ? 'bold' : 'normal' }}
                  onClick={() => setTab('exams')}
                >
                  Manage Exams & Questions
                </button>
                <button
                  type="button"
                  style={{ fontWeight: tab === 'reports' ? 'bold' : 'normal' }}
                  onClick={() => setTab('reports')}
                >
                  Examination Reports (FR-20)
                </button>
              </div>
              {tab === 'exams' && <TeacherExamManagement token={token} />}
              {tab === 'reports' && <TeacherExamReports token={token} />}
            </div>
          )}
          {user.role === 'STUDENT' && <StudentExamView token={token} />}
        </>
      )}
    </main>
  )
}
