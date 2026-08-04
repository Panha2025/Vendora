import { useState } from 'react'
import { getStoredUser, logoutUser } from './api/auth'
import { getTranslator } from './i18n'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import MarketplacePage from './pages/MarketplacePage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [authMode, setAuthMode] = useState('register')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [language, setLanguage] = useState(() =>
    localStorage.getItem('secondloop_language') || 'en',
  )
  const t = getTranslator(language)

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
    localStorage.setItem('secondloop_language', nextLanguage)
  }

  function handleLogout() {
    setUser(null)
    setIsAuthOpen(false)
    logoutUser().catch(() => null)
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
        language={language}
        onAuthenticated={handleAuthenticated}
        onBack={() => setIsAuthOpen(false)}
        onLanguageChange={changeLanguage}
        t={t}
      />
    )
  }

  if (user?.role === 'admin') {
    return (
      <AdminPage
        language={language}
        onLanguageChange={changeLanguage}
        onLogout={handleLogout}
        t={t}
        user={user}
      />
    )
  }

  return (
    <MarketplacePage
      language={language}
      onLanguageChange={changeLanguage}
      onLogout={handleLogout}
      onRequireAuth={handleRequireAuth}
      t={t}
      user={user}
    />
  )
}

export default App
