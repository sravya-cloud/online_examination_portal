import { useState, useEffect } from 'react'
import { fetchExamReport, fetchExams } from './api.js'

export default function TeacherExamReports({ token }) {
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchExams(token)
      .then((data) => {
        if (!active) return
        const list = data.exams || []
        setExams(list)
        if (list.length > 0) setSelectedExamId(list[0].id)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!selectedExamId) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetchExamReport(selectedExamId, token)
      .then((data) => {
        if (!active) return
        setReport(data.report)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        setReport(null)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedExamId, token])

  return (
    <section className="exam-reports" style={{ marginTop: '2rem', textAlign: 'left' }}>
      <h2>Examination Reports (FR-20)</h2>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Select Examination:{' '}
          <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.isPublished ? 'Published' : 'Draft'})
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading report data...</p>}

      {!loading && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Candidates</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{report.statistics.totalAttempts}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Average Score</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{report.statistics.averageScore}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Pass Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'green' }}>
                {report.statistics.passRate}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>Highest / Lowest</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                {report.statistics.highestScore} / {report.statistics.lowestScore}
              </div>
            </div>
          </div>

          <div>
            <h3>Question Pool Difficulty Distribution</h3>
            <p>
              Easy: {report.questionDifficulty.EASY} | Medium: {report.questionDifficulty.MEDIUM} | Hard:{' '}
              {report.questionDifficulty.HARD}
            </p>
          </div>

          <div>
            <h3>Candidate Attempts</h3>
            {report.attempts.length === 0 ? (
              <p>No attempts recorded yet for this examination.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '0.5rem' }}>Candidate</th>
                    <th style={{ padding: '0.5rem' }}>Score</th>
                    <th style={{ padding: '0.5rem' }}>Total Marks</th>
                    <th style={{ padding: '0.5rem' }}>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {report.attempts.map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>{att.studentName}</td>
                      <td style={{ padding: '0.5rem' }}>{att.score}</td>
                      <td style={{ padding: '0.5rem' }}>{att.totalMarks}</td>
                      <td style={{ padding: '0.5rem' }}>{new Date(att.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
