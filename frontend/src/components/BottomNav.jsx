import { motion } from 'framer-motion'

const tabs = [
  { id: 'home', icon: HomeIcon, label: 'Главная' },
  { id: 'add', icon: AddIcon, label: 'Добавить' },
  { id: 'analytics', icon: ChartIcon, label: 'Аналитика' },
  { id: 'ai', icon: AIIcon, label: 'ИИ Помощник' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      height: 'var(--nav-height)',
      paddingBottom: 'var(--safe-bottom)',
      background: 'rgba(19, 19, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      zIndex: 100
    }}>
      {tabs.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id
        const isAdd = id === 'add'

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              position: 'relative',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isAdd ? (
              <motion.div
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 48, height: 48,
                  borderRadius: '50%',
                  background: active
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
                  marginTop: -8
                }}
              >
                <Icon size={22} color="white" />
              </motion.div>
            ) : (
              <motion.div
                whileTap={{ scale: 0.85 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
              >
                <Icon size={22} color={active ? '#A78BFA' : '#4A4A6A'} />
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#A78BFA' : '#4A4A6A',
                  letterSpacing: '0.02em'
                }}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    style={{
                      position: 'absolute',
                      top: 6,
                      width: 4, height: 4,
                      borderRadius: '50%',
                      background: '#A78BFA'
                    }}
                  />
                )}
              </motion.div>
            )}
          </button>
        )
      })}
    </nav>
  )
}

function HomeIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function AddIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function ChartIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function AIIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 018 8v4a8 8 0 01-8 8H8a8 8 0 01-8-8v-4a8 8 0 018-8h4z"/>
      <circle cx="9" cy="10" r="1" fill={color}/>
      <circle cx="15" cy="10" r="1" fill={color}/>
      <path d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5"/>
    </svg>
  )
}
