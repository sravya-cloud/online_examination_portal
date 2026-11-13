import { useState, useEffect, useCallback } from 'react'
import { fetchExams, createExam, publishExam, fetchExamQuestions, updateQuestion, deleteQuestion } from './api.js'

export default function TeacherExamManagement({ token }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Exam Form
  const [title, setTitle] = useState('')
  const [poolId, setPoolId] = useState('pool-1')
  const [questionCount, setQuestionCount] = useState(5)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [resultReleaseTime, setResultReleaseTime] = useState('')

  // Selected Exam Questions View
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const loadExams = useCallback(async () => {
    try {
      const data = await fetchExams(token)
      setExams(data.exams || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    let active = true
    fetchExams(token)
      .then((data) => {
        if (!active) return
        setExams(data.exams || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const handleCreateExam = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await createExam(
        {
          title,
          questionPoolId: poolId,
          questionCount: Number(questionCount),
          durationMinutes: Number(durationMinutes),
          startTime: startTime ? new Date(startTime).toISOString() : null,
          endTime: endTime ? new Date(endTime).toISOString() : null,
          resultReleaseTime: resultReleaseTime ? new Date(resultReleaseTime).toISOString() : null,
        },
        token
      )
      setMessage('Examination created successfully.')
      setTitle('')
      loadExams()
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePublish = async (examId) => {
    setError(null)
    setMessage(null)
    try {
      const res = await publishExam(examId, token)
      setMessage(res.message || 'Exam published and question set fixed.')
      loadExams()
      if (selectedExamId === examId) {
        loadQuestions(examId)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const loadQuestions = async (examId) => {
    setSelectedExamId(examId)
    setQuestionsLoading(true)
    setError(null)
    try {
      const data = await fetchExamQuestions(examId, token)
      setQuestions(data.questions || [])
    } catch (err) {
      setError(err.message)
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
  }

  const handleEditQuestion = async (qId, currentText) => {
    const newText = prompt('Enter new question text:', currentText)
    if (!newText || newText === currentText) return
    setError(null)
    try {
      await updateQuestion(qId, { text: newText }, token)
      setMessage('Question updated successfully.')
      if (selectedExamId) loadQuestions(selectedExamId)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to remove this question?')) return
    setError(null)
    try {
      await deleteQuestion(qId, token)
      setMessage('Question deleted.')
      if (selectedExamId) loadQuestions(selectedExamId)
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId)

  return (
    <section className="teacher-exam-management" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
      <h2>Exam & Question Configuration (Sprint 1)</h2>
      {error && <div style={{ color: 'red', padding: '0.5rem', background: '#fee' }}>{error}</div>}
      {message && <div style={{ color: 'green', padding: '0.5rem', background: '#efe' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        <div>
          <h3>Create Examination (FR-04, FR-08)</h3>
          <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>
              Title:
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Question Pool ID:
              <input type="text" value={poolId} onChange={(e) => setPoolId(e.target.value)} required />
            </label>
            <label>
              Number of Questions (FR-09):
              <input
                type="number"
                min="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                required
              />
            </label>
            <label>
              Duration in Minutes (FR-08):
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </label>
            <label>
              Availability Start (FR-08):
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label>
              Availability End (FR-08):
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
            <label>
              Result Release Time (FR-19):
              <input
                type="datetime-local"
                value={resultReleaseTime}
                onChange={(e) => setResultReleaseTime(e.target.value)}
              />
            </label>
            <button type="submit" style={{ marginTop: '0.5rem' }}>
              Create Examination
            </button>
          </form>
        </div>

        <div>
          <h3>Existing Examinations</h3>
          {loading ? (
            <p>Loading examinations...</p>
          ) : exams.length === 0 ? (
            <p>No examinations found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {exams.map((exam) => (
                <li
                  key={exam.id}
                  style={{
                    border: '1px solid #ccc',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  <strong>{exam.title}</strong>
                  <div>
                    Status:{' '}
                    <span style={{ color: exam.isPublished ? 'green' : 'orange' }}>
                      {exam.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <div>Duration: {exam.durationMinutes} mins | Questions: {exam.questionCount}</div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    {!exam.isPublished && (
                      <button type="button" onClick={() => handlePublish(exam.id)}>
                        Publish & Fix Questions (FR-09, FR-10)
                      </button>
                    )}
                    <button type="button" onClick={() => loadQuestions(exam.id)}>
                      View Questions
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedExamId && (
        <div style={{ marginTop: '2rem', borderTop: '2px solid #ddd', paddingTop: '1rem' }}>
          <h3>Questions for: {selectedExam?.title || selectedExamId}</h3>
          <p>
            Status:{' '}
            <strong>{selectedExam?.isPublished ? 'PUBLISHED (Questions locked: FR-07)' : 'DRAFT (Editable: FR-07)'}</strong>
          </p>
          {questionsLoading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions currently assigned. Publish exam to draw random questions from pool (FR-09).</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <div>
                    <strong>Q{idx + 1}:</strong> {q.text} <em>({q.difficulty || 'MEDIUM'})</em>
                  </div>
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1.2rem' }}>
                    {q.options?.map((opt, oIdx) => (
                      <li key={oIdx}>{opt}</li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      disabled={selectedExam?.isPublished}
                      title={selectedExam?.isPublished ? 'Cannot edit questions after publishing' : 'Edit question text'}
                      onClick={() => handleEditQuestion(q.id, q.text)}
                    >
                      Edit Question (FR-07)
                    </button>
                    <button
                      type="button"
                      disabled={selectedExam?.isPublished}
                      title={selectedExam?.isPublished ? 'Cannot delete questions after publishing' : 'Delete question'}
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      Delete Question (FR-07)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
