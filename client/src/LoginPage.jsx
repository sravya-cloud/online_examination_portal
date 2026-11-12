import { useState } from 'react'
import { PORTALS, loginRequest } from './auth.js'

export default function LoginPage({ onLoggedIn }) {
  const [portal, setPortal] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await loginRequest(portal, email, password)
      onLoggedIn({ token: data.token, user: data.user })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <h1>Online Examination Portal</h1>
      <p className="subtitle">Choose your portal and sign in.</p>
      <div className="tabs" role="tablist" aria-label="Choose portal">
        {Object.entries(PORTALS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={portal === key}
            className={portal === key ? 'tab active' : 'tab'}
            onClick={() => {
              setPortal(key)
              setError('')
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : `Sign in as ${PORTALS[portal].label}`}
        </button>
      </form>
    </main>
  )
}
