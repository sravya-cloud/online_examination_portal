import { useCallback, useState } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Dashboard.jsx'
import { clearSession, loadSession, saveSession } from './auth.js'

export default function App() {
  const [session, setSession] = useState(loadSession)

  const handleLoggedIn = (next) => {
    saveSession(next)
    setSession(next)
  }

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return session ? (
    <Dashboard session={session} onLogout={handleLogout} />
  ) : (
    <LoginPage onLoggedIn={handleLoggedIn} />
  )
}
