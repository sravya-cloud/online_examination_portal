
import { useEffect, useRef, useState } from 'react'
import { PORTALS, fetchDashboard } from './auth.js'
import {
  fetchAvailableExams,
  fetchExamQuestions,
  autoSubmitExamAttempt,
  saveExamAnswer,
  submitExamAttempt,
  startExamAttempt,
} from './api.js'
import TeacherExamManagement from './TeacherExamManagement.jsx'
import TeacherExamReports from './TeacherExamReports.jsx'
import StudentExamView from './StudentExamView.jsx'

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
  const questionRequestId = useRef(0)
  const autoSubmitRetryTimer = useRef(null)

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
    setAutoSubmitStatus('idle')
    setAutoSubmitError('')
    setManualSubmitStatus('idle')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    setTimeRemaining(null)

    try {
      const attemptData = await startExamAttempt(exam.id, token)
      if (requestId !== questionRequestId.current) return
      const data = await fetchExamQuestions(exam.id, token)
      if (requestId !== questionRequestId.current) return

      setQuestions(data.questions || [])
      setAttemptId(attemptData.attempt.id)
      setAttemptStartedAt(attemptData.attempt.startedAt)
      setAnswers(attemptData.attempt.answers || {})
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
    setAnswers({})
    setAnswerStatus('idle')
    setAnswerError('')
    setAutoSubmitStatus('idle')
    setAutoSubmitError('')
    setManualSubmitStatus('idle')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    setTimeRemaining(null)
    setQuestionStatus('idle')
    setQuestionError('')
  }

  const activeQuestion = questions[currentQuestion]

  async function handleSelectAnswer(questionId, answer) {
    if (
      !attemptId || answerStatus === 'saving' || autoSubmitStatus !== 'idle' ||
      manualSubmitStatus !== 'idle'
    ) return

    const requestId = questionRequestId.current
    const previousAnswer = answers[questionId]
    setAnswers((current) => ({ ...current, [questionId]: answer }))
    setAnswerStatus('saving')
    setAnswerError('')

    try {
      const data = await saveExamAnswer(
        selectedExam.id,
        attemptId,
        questionId,
        answer,
        token,
      )
      if (requestId !== questionRequestId.current) return
      setAnswers(data.answers || {})
      setAnswerStatus('saved')
    } catch (err) {
      if (requestId !== questionRequestId.current) return
      if (err.status === 401) {
        onLogout()
        return
      }
      setAnswers((current) => {
        const next = { ...current }
        if (previousAnswer === undefined) delete next[questionId]
        else next[questionId] = previousAnswer
        return next
      })
      setAnswerError(err.message || 'Unable to save your answer.')
      setAnswerStatus('error')
    }
  }

  async function handleManualSubmit() {
    if (
      !attemptId || answerStatus === 'saving' || autoSubmitStatus !== 'idle' ||
      (manualSubmitStatus !== 'idle' && manualSubmitStatus !== 'error')
    ) return

    setManualSubmitStatus('submitting')
    setManualSubmitError('')
    setShowSubmitConfirmation(false)
    try {
      await submitExamAttempt(selectedExam.id, attemptId, token)
      setManualSubmitStatus('submitted')
    } catch (err) {
      if (err.status === 401) {
        onLogout()
        return
      }
      setManualSubmitError(err.message || 'Unable to submit your examination.')
      setManualSubmitStatus('error')
    }
  }

  useEffect(() => {
    if (
      !attemptId || !attemptStartedAt || !selectedExam ||
      questionStatus !== 'ready' || answerStatus === 'saving' ||
      autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'
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

      submissionStarted = true
      clearInterval(intervalId)
      setAutoSubmitStatus('submitting')
      setAutoSubmitError('')
      try {
        await autoSubmitExamAttempt(selectedExam.id, attemptId, token)
        setAutoSubmitStatus('submitted')
      } catch (err) {
        if (err.status === 401) {
          onLogout()
          return
        }
        if (err.status === 409 && err.deadline) {
          setAutoSubmitStatus('waiting')
          const retryDelay = Math.max(250, new Date(err.deadline).getTime() - Date.now() + 100)
          autoSubmitRetryTimer.current = setTimeout(
            () => setAutoSubmitStatus('idle'),
            retryDelay,
          )
          return
        }
        setAutoSubmitError(err.message || 'Automatic submission failed.')
        setAutoSubmitStatus('error')
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

  useEffect(() => () => clearTimeout(autoSubmitRetryTimer.current), [])

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

                  {questionStatus === 'ready' && autoSubmitStatus === 'waiting' && (
                    <p role="status">Finishing automatic submission…</p>
                  )}

                  {questionStatus === 'ready' && autoSubmitStatus === 'error' && (
                    <div>
                      <p className="form-error" role="alert">{autoSubmitError}</p>
                      <button type="button" onClick={() => setAutoSubmitStatus('idle')}>
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
                                disabled={answerStatus === 'saving' || autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'}
                                onChange={() =>
                                  handleSelectAnswer(activeQuestion.id, option)
                                }
                              />
                              <span>{String.fromCharCode(65 + index)}. {option}</span>
                            </label>
                          ))}
                        </div>

                        <p aria-live="polite">
                          {answerStatus === 'saving' && 'Saving answer…'}
                          {answerStatus === 'saved' && 'Answer saved.'}
                        </p>
                        {answerError && (
                          <p className="form-error" role="alert">{answerError}</p>
                        )}

                        <div className="question-navigation">
                          <button
                            type="button"
                            disabled={currentQuestion === 0 || answerStatus === 'saving' || autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'}
                            onClick={() =>
                              setCurrentQuestion((previous) => previous - 1)
                            }
                          >
                            Previous
                          </button>

                          <button
                            type="button"
                            disabled={currentQuestion === questions.length - 1 || answerStatus === 'saving' || autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'}
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
                            disabled={answerStatus === 'saving' || autoSubmitStatus !== 'idle' || manualSubmitStatus !== 'idle'}
                            onClick={() => setShowSubmitConfirmation(true)}
                          >
                            Submit examination
                          </button>
                        ) : (
                          <div className="submit-confirmation" role="group" aria-label="Confirm examination submission">
                            <p>You won’t be able to change your answers after submitting.</p>
                            <button
                              type="button"
                              disabled={answerStatus === 'saving'}
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
          {user.role === 'STUDENT' && <StudentExamView token={token} />}
        </>
      )}
    </main>
  )
}
