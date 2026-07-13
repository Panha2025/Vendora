import { useState } from 'react'
import { getStoredUser, logoutUser } from './api/auth'
import AuthPage from './pages/AuthPage'
import MarketplacePage from './pages/MarketplacePage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [authMode, setAuthMode] = useState('register')
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  async function handleLogout() {
    await logoutUser()
    setUser(null)
  }

  function handleRequireAuth(mode = 'register') {
    setAuthMode(mode)
    setIsAuthOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleAuthenticated(nextUser) {
    setUser(nextUser)
    setIsAuthOpen(false)
  }

  if (!user && isAuthOpen) {
    return (
      <AuthPage
        initialMode={authMode}
        onAuthenticated={handleAuthenticated}
        onBack={() => setIsAuthOpen(false)}
      />
    )
  }

  return (
    <MarketplacePage
      onLogout={handleLogout}
      onRequireAuth={handleRequireAuth}
      user={user}
    />
  )
}

export default App
