
import { useEffect, useState } from 'react'
import { PORTALS, fetchDashboard } from './auth.js'
import { fetchAvailableExams } from './api.js'
import TeacherExamManagement from './TeacherExamManagement.jsx'
import TeacherExamReports from './TeacherExamReports.jsx'
import StudentExamView from './StudentExamView.jsx'

export default function Dashboard({ session, onLogout }) {
  const { user, token } = session
  const portal = Object.keys(PORTALS).find((k) => PORTALS[k].role === user.role)

  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('exams')
  const [exams, setExams] = useState([])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        await fetchDashboard(portal, token)

        if (user.role === 'STUDENT') {
          const data = await fetchAvailableExams(token)
          if (active) setExams(data.exams || [])
        }

        if (active) setStatus('ready')
      } catch (err) {
        if (!active) return

        if (err.status === 401) onLogout()
        else setStatus('error')
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [portal, token, user.role, onLogout])

  const formatDate = (date) => {
    if (!date) return null

    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

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

      {status === 'error' && (
        <p className="form-error">Could not load the dashboard.</p>
      )}

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

          {user.role === 'STUDENT' && (
            <section className="available-exams">
              <h2>Available examinations</h2>

              {exams.length === 0 ? (
                <p>No examinations are currently available.</p>
              ) : (
                <div className="exam-list">
                  {exams.map((exam) => (
                    <article className="exam-card" key={exam.id}>
                      <h3>{exam.title}</h3>

                      <p>
                        {exam.questionCount} questions ·{' '}
                        {exam.durationMinutes} minutes
                      </p>

                      <p>
                        Starts: {formatDate(exam.startTime) || 'Available now'}
                      </p>

                      <p>
                        Ends: {formatDate(exam.endTime) || 'No end time'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          {user.role === 'STUDENT' && <StudentExamView token={token} />}
        </>
      )}
    </main>
  )
}
