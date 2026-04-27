import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendAIMessage } from '../api/client'

const SUGGESTIONS = [
  'Сколько я потратил за последние 7 дней?',
  'Добавь расход 500 рублей на еду',
  'Каков мой баланс за месяц?',
  'Добавь доход 50000 рублей зарплата',
  'Как сэкономить деньги?',
  'Добавь расход 1200 на транспорт',
]

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Привет! 👋 Я твой финансовый ИИ-ассистент.\n\nМогу помочь:\n• Добавить доход или расход\n• Показать статистику\n• Дать советы по финансам\n\nПросто напиши что нужно!',
      time: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    const userMsg = { id: Date.now(), role: 'user', text: msg, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const resp = await sendAIMessage(msg)
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: resp.reply,
        time: new Date(),
        action: resp.action
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: '⚠️ Не удалось получить ответ. Проверь подключение к интернету.',
        time: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, transparent 100%)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(16,217,160,0.2))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>ИИ Ассистент</div>
            <div style={{ fontSize: 12, color: 'var(--income)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: 'var(--income)', animation: 'pulse 2s infinite'
              }}/>
              Онлайн · Mistral AI
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, borderRadius: 10,
                  background: 'linear-gradient(135deg, #8B5CF6, #10D9A0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0, alignSelf: 'flex-end'
                }}>
                  🤖
                </div>
              )}
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
                {msg.action?.type === 'add_transaction' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      marginTop: 6,
                      background: msg.action.data.type === 'income'
                        ? 'rgba(16,217,160,0.1)'
                        : 'rgba(255,87,87,0.1)',
                      border: `1px solid ${msg.action.data.type === 'income' ? 'rgba(16,217,160,0.3)' : 'rgba(255,87,87,0.3)'}`,
                      borderRadius: 12, padding: '8px 12px',
                      fontSize: 12, display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    <span>
                      {msg.action.data.type === 'income' ? '✅ Доход добавлен' : '✅ Расход добавлен'}
                    </span>
                    <span style={{ fontWeight: 700, color: msg.action.data.type === 'income' ? '#10D9A0' : '#FF5757' }}>
                      {new Intl.NumberFormat('ru-RU').format(msg.action.data.amount)} ₽
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{msg.action.data.category}</span>
                  </motion.div>
                )}
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left',
                  paddingLeft: msg.role === 'assistant' ? 4 : 0,
                  paddingRight: msg.role === 'user' ? 4 : 0
                }}>
                  {msg.time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: 'linear-gradient(135deg, #8B5CF6, #10D9A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>🤖</div>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px',
              display: 'flex', gap: 4, alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {messages.length <= 2 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '8px 16px',
              display: 'flex', gap: 8, overflowX: 'auto',
              flexShrink: 0
            }}
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => send(s)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis'
                }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(19,19,42,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
        flexShrink: 0
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать ИИ ассистенту..."
          rows={1}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '12px 16px',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 14,
            outline: 'none',
            resize: 'none',
            maxHeight: 100,
            lineHeight: 1.5,
            transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44,
            borderRadius: 14,
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
              : 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: input.trim() ? '0 4px 15px rgba(139,92,246,0.4)' : 'none'
          }}
        >
          <SendIcon color={input.trim() && !loading ? 'white' : 'var(--text-muted)'} />
        </motion.button>
      </div>
    </div>
  )
}

function SendIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}
