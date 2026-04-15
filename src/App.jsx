import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import TodoList from './components/TodoList'
import CalendarView from './components/CalendarView'
import Background from './components/Background'
import ThemeStore from './components/ThemeStore'
import MfaSetup from './components/MfaSetup'
import './App.css'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [showThemeStore, setShowThemeStore] = useState(false)

  // Apply theme
  useEffect(() => {
    document.body.className = '';
    if (theme === 'dark') {
      document.body.classList.add('dark-mode')
    } else if (theme === 'theme-neon') {
      document.body.classList.add('theme-neon')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogin = (userInfo) => {
    setUser(userInfo)
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <div className={`app-wrapper ${!user ? 'login-mode' : 'home-mode'}`}>
      <Background theme={theme} />
      {!user ? (
        <div className="login-container">
          <header style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '☀️' : '🌙'}
            </button>
            <button className="theme-toggle" onClick={() => setShowThemeStore(!showThemeStore)}>
              🎨
            </button>
          </header>
          <h1 style={{ marginBottom: '2rem', fontSize: '3rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Todo Master
          </h1>
          <Auth onLogin={handleLogin} />
        </div>
      ) : (
        <div className="dashboard-container">
          <header className="header">
            <h1>Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? '☀️' : '🌙'}
              </button>
              <button className="theme-toggle" onClick={() => setShowThemeStore(!showThemeStore)}>
                🎨
              </button>
            </div>
          </header>

          <main className="dashboard-grid">
            <div className="card todo-section">
              <TodoList user={user} />
            </div>
            <div className="card calendar-section">
              <CalendarView user={user} />
            </div>
            {showThemeStore && (
              <div className="theme-store-overlay" onClick={() => setShowThemeStore(false)}>
                <div className="theme-store-modal" onClick={e => e.stopPropagation()}>
                  <div className="theme-store-header">
                    <h2>Settings & Customization</h2>
                    <button className="close-store" onClick={() => setShowThemeStore(false)}>&times;</button>
                  </div>
                  <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: '1rem' }}>
                    <ThemeStore user={user} currentTheme={theme} onThemeSelect={handleThemeChange} />
                    <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />
                    <MfaSetup user={user} />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App
