
import { useEffect, useRef, useState } from 'react'
import { PORTALS, fetchDashboard } from './auth.js'
import {
  fetchAvailableExams,
  fetchExamQuestions,
  fetchExamResults,
  submitExamAttempt,
  startExam,
} from './api.js'
import TeacherExamManagement from './TeacherExamManagement.jsx'
import TeacherExamReports from './TeacherExamReports.jsx'
import AdminPanel from './AdminPanel.jsx'
import QuestionBank from './QuestionBank.jsx'

function readSessionAnswers(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function writeSessionAnswers(key, answers) {
  try {
    sessionStorage.setItem(key, JSON.stringify(answers))
  } catch {
    // Keep the current in-memory answers if session storage is unavailable.
  }
}

function clearSessionAnswers(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Submission still succeeds if session storage is unavailable.
  }
}

export default function Dashboard({ session, onLogout }) {
  const { user, token } = session
  const portal = Object.keys(PORTALS).find((k) => PORTALS[k].role === user.role)

  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('exams')
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionStatus, setQuestionStatus] = useState('idle')
  const [questionError, setQuestionError] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [attemptId, setAttemptId] = useState(null)
  const [attemptStartedAt, setAttemptStartedAt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [answerStatus, setAnswerStatus] = useState('idle')
  const [answerError, setAnswerError] = useState('')
  const [autoSubmitStatus, setAutoSubmitStatus] = useState('idle')
  const [autoSubmitError, setAutoSubmitError] = useState('')
  const [manualSubmitStatus, setManualSubmitStatus] = useState('idle')
  const [manualSubmitError, setManualSubmitError] = useState('')
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [examResult, setExamResult] = useState(null)
  const answersRef = useRef({})
  const submitInFlight = useRef(false)
  const questionRequestId = useRef(0)

  function getAnswerStorageKey(examId) {
    return `exam-answers:${user.id}:${examId}`
  }

  async function loadExamResult(examId) {
    try {
      const result = await fetchExamResults(examId, token)
      if (selectedExam?.id === examId) setExamResult(result)
    } catch {
      setExamResult(null)
    }
  }

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

  async function handleStartExam(exam) {
    const requestId = ++questionRequestId.current
    setSelectedExam(exam)
    setQuestions([])
    setCurrentQuestion(0)
    setQuestionError('')
    setQuestionStatus('loading')
    setAttemptId(null)
    setAttemptStartedAt(null)
    answersRef.current = {}
    setAnswers({})
    setAnswerStatus('idle')
    setAnswerError('')
    setAutoSubmitStatus('idle')
    setAutoSubmitError('')
    setManualSubmitStatus('idle')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    setTimeRemaining(null)
    setExamResult(null)

    try {
      const attemptData = await startExam(exam.id, token)
      if (requestId !== questionRequestId.current) return
      const data = await fetchExamQuestions(exam.id, token)
      if (requestId !== questionRequestId.current) return

      const savedAnswers = readSessionAnswers(getAnswerStorageKey(exam.id))
      const validQuestionIds = new Set((data.questions || []).map((question) => String(question.id)))
      const restoredAnswers = Object.fromEntries(
        Object.entries(savedAnswers).filter(([questionId]) => validQuestionIds.has(questionId)),
      )
      answersRef.current = restoredAnswers
      setQuestions(data.questions || [])
      setAttemptId(attemptData.attempt.id)
      setAttemptStartedAt(attemptData.attempt.startedAt)
      setAnswers(restoredAnswers)
      setAnswerStatus('idle')
      setSelectedExam({
        ...exam,
        title: data.title || exam.title,
        durationMinutes: data.durationMinutes ?? exam.durationMinutes,
      })
      setQuestionStatus('ready')
    } catch (err) {
      if (requestId !== questionRequestId.current) return
      if (err.status === 401) {
        onLogout()
        return
      }

      setQuestionError(err.message || 'Unable to load examination questions.')
      setQuestionStatus('error')
    }
  }

  function handleBackToExams() {
    questionRequestId.current += 1
    setSelectedExam(null)
    setQuestions([])
    setCurrentQuestion(0)
    setAttemptId(null)
    setAttemptStartedAt(null)
    answersRef.current = {}
    setAnswers({})
    setAnswerStatus('idle')
    setAnswerError('')
    setAutoSubmitStatus('idle')
    setAutoSubmitError('')
    setManualSubmitStatus('idle')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    setTimeRemaining(null)
    setExamResult(null)
    setQuestionStatus('idle')
    setQuestionError('')
  }

  const activeQuestion = questions[currentQuestion]

  function handleSelectAnswer(questionId, answer) {
    if (!attemptId || autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle') return

    const nextAnswers = { ...answersRef.current, [questionId]: answer }
    answersRef.current = nextAnswers
    setAnswers(nextAnswers)
    writeSessionAnswers(getAnswerStorageKey(selectedExam.id), nextAnswers)
    setAnswerStatus('saved')
    setAnswerError('')
  }

  async function handleManualSubmit() {
    if (
      !attemptId || submitInFlight.current || autoSubmitStatus !== 'idle' ||
      (manualSubmitStatus !== 'idle' && manualSubmitStatus !== 'error')
    ) return

    submitInFlight.current = true
    setManualSubmitStatus('submitting')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    try {
      await submitExamAttempt(selectedExam.id, answersRef.current, token)
      clearSessionAnswers(getAnswerStorageKey(selectedExam.id))
      setManualSubmitStatus('submitted')
      await loadExamResult(selectedExam.id)
    } catch (err) {
      if (err.status === 401) {
        onLogout()
        return
      }
      setManualSubmitError(err.message || 'Unable to submit your examination.')
      setManualSubmitStatus('error')
    } finally {
      submitInFlight.current = false
    }
  }

  useEffect(() => {
    if (
      !attemptId || !attemptStartedAt || !selectedExam ||
      questionStatus !== 'ready' || autoSubmitStatus !== 'idle' ||
      manualSubmitStatus === 'submitting' || manualSubmitStatus === 'submitted'
    ) return undefined

    const startedAt = new Date(attemptStartedAt).getTime()
    let deadline = startedAt + selectedExam.durationMinutes * 60 * 1000
    if (selectedExam.endTime) {
      deadline = Math.min(deadline, new Date(selectedExam.endTime).getTime())
    }
    if (!Number.isFinite(deadline)) return undefined

    let intervalId
    let submissionStarted = false
    const updateTimer = async () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining > 0 || submissionStarted) return
      if (submitInFlight.current) return

      submissionStarted = true
      clearInterval(intervalId)
      setAutoSubmitStatus('submitting')
      submitInFlight.current = true
      try {
        await submitExamAttempt(selectedExam.id, answersRef.current, token)
        clearSessionAnswers(getAnswerStorageKey(selectedExam.id))
        setAutoSubmitStatus('submitted')
        await loadExamResult(selectedExam.id)
      } catch (err) {
        if (err.status === 401) {
          onLogout()
          return
        }
        setAutoSubmitError(err.message || 'Automatic submission failed.')
        setAutoSubmitStatus('error')
      } finally {
        submitInFlight.current = false
      }
    }

    updateTimer()
    intervalId = setInterval(updateTimer, 1000)
    return () => clearInterval(intervalId)
  }, [
    answerStatus,
    attemptId,
    attemptStartedAt,
    autoSubmitStatus,
    manualSubmitStatus,
    onLogout,
    questionStatus,
    selectedExam,
    token,
  ])

  function formatRemaining(seconds) {
    if (seconds === null) return '--:--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
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
                {user.role === 'TEACHER' && (
                  <button
                    type="button"
                    style={{ fontWeight: tab === 'bank' ? 'bold' : 'normal' }}
                    onClick={() => setTab('bank')}
                  >
                    Question Bank (FR-05)
                  </button>
                )}
                <button
                  type="button"
                  style={{ fontWeight: tab === 'reports' ? 'bold' : 'normal' }}
                  onClick={() => setTab('reports')}
                >
                  Examination Reports (FR-20)
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    type="button"
                    style={{ fontWeight: tab === 'admin' ? 'bold' : 'normal' }}
                    onClick={() => setTab('admin')}
                  >
                    Administration
                  </button>
                )}
              </div>
              {tab === 'exams' && <TeacherExamManagement token={token} />}
              {tab === 'bank' && user.role === 'TEACHER' && <QuestionBank token={token} />}
              {tab === 'reports' && <TeacherExamReports token={token} />}
              {tab === 'admin' && user.role === 'ADMIN' && (
                <AdminPanel token={token} currentUserId={user.id} />
              )}
            </div>
          )}

          {user.role === 'STUDENT' && (
            <section className="available-exams">
              {!selectedExam ? (
                <>
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

                          <button
                            type="button"
                            disabled={questionStatus === 'loading'}
                            onClick={() => handleStartExam(exam)}
                          >
                            Start Exam
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <section className="exam-view">
                  <button type="button" onClick={handleBackToExams}>
                    Back to examinations
                  </button>

                  <h2>{selectedExam.title}</h2>

                  <p>
                    {selectedExam.durationMinutes} minutes ·{' '}
                    {questions.length || selectedExam.questionCount} questions
                  </p>

                  {attemptStartedAt && questionStatus === 'ready' && (
                    <p className="exam-timer" aria-live="polite">
                      Time remaining: {formatRemaining(timeRemaining)}
                    </p>
                  )}

                  {questionStatus === 'loading' && (
                    <p>Loading examination questions…</p>
                  )}

                  {questionStatus === 'error' && (
                    <div>
                      <p className="form-error">{questionError}</p>
                      <button
                        type="button"
                        onClick={() => handleStartExam(selectedExam)}
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {questionStatus === 'ready' && autoSubmitStatus === 'submitted' && (
                    <p role="status">Time expired. Your examination was submitted automatically.</p>
                  )}

                  {questionStatus === 'ready' && manualSubmitStatus === 'submitted' && (
                    <p role="status">Your examination was submitted successfully.</p>
                  )}

                  {questionStatus === 'ready' && manualSubmitStatus === 'submitting' && (
                    <p role="status">Submitting your saved answers…</p>
                  )}

                  {questionStatus === 'ready' && examResult && (
                    <section className="exam-result" aria-live="polite">
                      <h3>Result status</h3>
                      {examResult.isReleased ? (
                        <>
                          <p>
                            Score: {examResult.score} / {examResult.totalMarks} ({examResult.percentage}%)
                          </p>
                          {examResult.evaluation && (
                            <div>
                              <h4>Answer evaluation</h4>
                              <ol>
                                {questions.map((question, index) => {
                                  const evaluation = examResult.evaluation[question.id]
                                  const answerStatus = !evaluation || evaluation.answer === null
                                    ? 'Unanswered'
                                    : evaluation.isCorrect ? 'Correct' : 'Incorrect'
                                  return <li key={question.id}>Question {index + 1}: {answerStatus}</li>
                                })}
                              </ol>
                            </div>
                          )}
                        </>
                      ) : (
                        <p>
                          Results are pending release.
                          {examResult.releaseTime && ` Available after ${formatDate(examResult.releaseTime)}.`}
                        </p>
                      )}
                    </section>
                  )}

                  {questionStatus === 'ready' && manualSubmitStatus === 'error' && (
                    <div>
                      <p className="form-error" role="alert">{manualSubmitError}</p>
                      <button type="button" onClick={handleManualSubmit}>
                        Retry submission
                      </button>
                    </div>
                  )}

                  {questionStatus === 'ready' && autoSubmitStatus === 'submitting' && (
                    <p role="status">Time expired. Submitting your saved answers…</p>
                  )}

                  {questionStatus === 'ready' && autoSubmitStatus === 'error' && (
                    <div>
                      <p className="form-error" role="alert">{autoSubmitError}</p>
                      <button type="button" onClick={() => {
                        setAutoSubmitError('')
                        setAutoSubmitStatus('idle')
                      }}>
                        Retry automatic submission
                      </button>
                    </div>
                  )}

                  {questionStatus === 'ready' && autoSubmitStatus !== 'submitted' && manualSubmitStatus !== 'submitted' && (
                    questions.length === 0 ? (
                      <p>No questions are available for this examination.</p>
                    ) : (
                      <div className="question-container">
                        <p>
                          Question {currentQuestion + 1} of {questions.length}
                        </p>

                        <h3>{activeQuestion.text}</h3>

                        <div className="question-options">
                          {activeQuestion.options.map((option, index) => (
                            <label className="question-option" key={index}>
                              <input
                                type="radio"
                                name={`answer-${activeQuestion.id}`}
                                value={option}
                                checked={answers[activeQuestion.id] === option}
                                disabled={autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'}
                                onChange={() =>
                                  handleSelectAnswer(activeQuestion.id, option)
                                }
                              />
                              <span>{String.fromCharCode(65 + index)}. {option}</span>
                            </label>
                          ))}
                        </div>

                        <p aria-live="polite">
                          {answerStatus === 'saved' && 'Answer saved.'}
                        </p>
                        {answerError && (
                          <p className="form-error" role="alert">{answerError}</p>
                        )}

                        <div className="question-navigation">
                          <button
                            type="button"
                            disabled={currentQuestion === 0 || autoSubmitStatus !== 'idle' || manualSubmitStatus === 'submitting' || manualSubmitStatus === 'submitted'}
                            onClick={() =>
                              setCurrentQuestion((previous) => previous - 1)
                            }
                          >
                            Previous
                          </button>

                          <button
                            type="button"
                            disabled={currentQuestion === questions.length - 1 || autoSubmitStatus !== 'idle' || manualSubmitStatus === 'submitting' || manualSubmitStatus === 'submitted'}
                            onClick={() =>
                              setCurrentQuestion((previous) => previous + 1)
                            }
                          >
                            Next
                          </button>
                        </div>

                        {!showSubmitConfirmation ? (
                          <button
                            type="button"
                            className="submit-exam-button"
                            disabled={autoSubmitStatus !== 'idle' || manualSubmitStatus === 'submitting' || manualSubmitStatus === 'submitted'}
                            onClick={() => setShowSubmitConfirmation(true)}
                          >
                            Submit examination
                          </button>
                        ) : (
                          <div className="submit-confirmation" role="group" aria-label="Confirm examination submission">
                            <p>You won’t be able to change your answers after submitting.</p>
                            <button
                              type="button"
                              disabled={manualSubmitStatus === 'submitting'}
                              onClick={handleManualSubmit}
                            >
                              Confirm submission
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSubmitConfirmation(false)}
                            >
                              Keep working
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </section>
              )}
            </section>
          )}
        </>
      )}
    </main>
  )
}
