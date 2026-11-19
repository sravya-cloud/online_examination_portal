import { useEffect, useState } from 'react'

// FR-05, FR-06: create question pools and add questions with a difficulty level.
async function request(token, path, options = {}) {
  const res = await fetch(`/api/questions${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.details ? ` ${Object.values(data.details).join(' ')}` : ''
    throw new Error(`${data.error || 'Request failed'}${detail}`)
  }
  return data
}

const EMPTY = { text: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'EASY' }

export default function QuestionBank({ token }) {
  const [version, setVersion] = useState(0)
  const [pools, setPools] = useState([])
  const [poolId, setPoolId] = useState('')
  const [questions, setQuestions] = useState([])
  const [newPool, setNewPool] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request(token, '/pools')
      .then((data) => {
        if (!active) return
        setPools(data.pools)
        setPoolId((current) => current || data.pools[0]?.id || '')
      })
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [token, version])

  useEffect(() => {
    if (!poolId) return undefined
    let active = true
    request(token, `/pool/${poolId}`)
      .then((data) => active && setQuestions(data.questions))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [token, poolId, version])

  async function run(action, success) {
    setMessage('')
    setError('')
    try {
      await action()
      setMessage(success)
      setVersion((v) => v + 1)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  async function addPool(e) {
    e.preventDefault()
    const ok = await run(
      () =>
        request(token, '/pools', { method: 'POST', body: { name: newPool } }).then((d) =>
          setPoolId(d.pool.id)
        ),
      'Question pool created.'
    )
    if (ok) setNewPool('')
  }

  async function addQuestion(e) {
    e.preventDefault()
    const options = form.options.map((o) => o.trim())
    const ok = await run(
      () =>
        request(token, '/', {
          method: 'POST',
          body: {
            text: form.text,
            options,
            correctAnswer: options[form.correctIndex],
            questionPoolId: poolId,
            difficulty: form.difficulty,
          },
        }),
      'Question added.'
    )
    if (ok) setForm(EMPTY)
  }

  return (
    <section style={{ marginTop: '1rem' }}>
      <h2>Question bank</h2>
      {message && <p role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <form className="login-form" onSubmit={addPool}>
        <label>
          New question pool name
          <input value={newPool} onChange={(e) => setNewPool(e.target.value)} required maxLength={100} />
        </label>
        <button type="submit">Create pool</button>
      </form>

      {pools.length === 0 ? (
        <p>Create a question pool to start adding questions.</p>
      ) : (
        <>
          <label>
            Question pool{' '}
            <select value={poolId} onChange={(e) => setPoolId(e.target.value)}>
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.questionCount} questions)
                </option>
              ))}
            </select>
          </label>

          <h3>Add a question</h3>
          <form className="login-form" onSubmit={addQuestion}>
            <label>
              Question
              <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
            </label>
            {form.options.map((option, i) => (
              <label key={i}>
                Option {i + 1}
                <input
                  value={option}
                  required
                  onChange={(e) => {
                    const options = [...form.options]
                    options[i] = e.target.value
                    setForm({ ...form, options })
                  }}
                />
              </label>
            ))}
            <label>
              Correct option
              <select
                value={form.correctIndex}
                onChange={(e) => setForm({ ...form, correctIndex: Number(e.target.value) })}
              >
                {form.options.map((_, i) => (
                  <option key={i} value={i}>
                    Option {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Difficulty
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option>EASY</option>
                <option>MEDIUM</option>
                <option>HARD</option>
              </select>
            </label>
            <button type="submit">Add question</button>
          </form>

          <h3>Questions in this pool</h3>
          {questions.length === 0 ? (
            <p>No questions yet.</p>
          ) : (
            <ol>
              {questions.map((q) => (
                <li key={q.id}>
                  {q.text} <em>({q.difficulty})</em>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}
