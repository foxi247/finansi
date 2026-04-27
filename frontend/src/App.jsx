import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home'
import AddTransaction from './pages/AddTransaction'
import Analytics from './pages/Analytics'
import AIChat from './pages/AIChat'
import BottomNav from './components/BottomNav'
import { initUser, setTelegramUser } from './api/client'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#0B0B1A')
      tg.setBackgroundColor('#0B0B1A')
    }

    const tgUser = tg?.initDataUnsafe?.user

    // Dev fallback
    const mockUser = tgUser || { id: 123456789, first_name: 'Тест', username: 'testuser' }
    setTelegramUser(mockUser)

    initUser({
      telegram_id: String(mockUser.id),
      first_name: mockUser.first_name || null,
      last_name: mockUser.last_name || null,
      username: mockUser.username || null
    })
      .then(u => {
        setUser(u)
        setReady(true)
      })
      .catch(err => {
        console.error('Init error:', err)
        setError('Не удалось подключиться к серверу')
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <LoadingLogo />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Загрузка Finansi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    )
  }

  const pages = { home: Home, add: AddTransaction, analytics: Analytics, ai: AIChat }
  const CurrentPage = pages[tab] || Home

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div className="page-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ minHeight: '100%' }}
          >
            <CurrentPage onTabChange={setTab} user={user} />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}

function LoadingLogo() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #8B5CF6, #10D9A0, #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24
      }}>💸</div>
    </motion.div>
  )
}
