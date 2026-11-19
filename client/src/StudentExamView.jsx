import { useState, useEffect } from 'react'
import { fetchExams, fetchExamQuestions, fetchExamResults } from './api.js'

export default function StudentExamView({ token }) {
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [questions, setQuestions] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    fetchExams(token)
      .then((data) => {
        if (!active) return
        const publishedExams = (data.exams || []).filter((e) => e.isPublished)
        setExams(publishedExams)
        if (publishedExams.length > 0) {
          setSelectedExamId(publishedExams[0].id)
        }
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
    setResult(null)

    Promise.all([
      fetchExamQuestions(selectedExamId, token).catch((e) => ({ error: e.message })),
      fetchExamResults(selectedExamId, token).catch((e) => ({ error: e.message })),
    ]).then(([qData, rData]) => {
      if (!active) return
      if (qData.error) setError(qData.error)
      else setQuestions(qData.questions || [])

      if (!rData.error) setResult(rData)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [selectedExamId, token])

  return (
    <section className="student-exam-view" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
      <h2>Available Examinations (Sprint 1 & Sprint 2)</h2>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Select Examination:{' '}
          <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.durationMinutes} mins)
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading examination...</p>}

      {/* FR-19: Automatic Result Release View */}
      {result && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '6px',
            border: result.isReleased ? '2px solid #28a745' : '2px solid #ffc107',
            background: result.isReleased ? '#e8f5e9' : '#fff9c4',
          }}
        >
          <h3>Result Release Status (FR-19)</h3>
          {!result.isReleased ? (
            <div>
              <p>
                <strong>Status: PENDING RELEASE</strong>
              </p>
              <p>{result.message}</p>
              {result.releaseTime && (
                <p>Scheduled Release: {new Date(result.releaseTime).toLocaleString()}</p>
              )}
            </div>
          ) : (
            <div>
              <p>
                <strong>Status: RELEASED</strong>
              </p>
              <p>
                Your Score: <strong>{result.score}</strong> / {result.totalMarks} ({result.percentage}%)
              </p>
              <p>Submitted at: {new Date(result.submittedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* FR-10: Same Question Set for All Students */}
      {!loading && questions.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Assigned Questions (FR-10: Fixed Question Set)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px' }}>
                <p>
                  <strong>Q{idx + 1}:</strong> {q.text}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {q.options?.map((opt, oIdx) => (
                    <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="radio" name={`question-${q.id}`} value={oIdx} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
