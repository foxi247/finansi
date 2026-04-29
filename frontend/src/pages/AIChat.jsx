import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendAIMessage, confirmAITransaction, createTransaction } from '../api/client'

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
  // Track which message ids have been confirmed or cancelled
  const [confirmedIds, setConfirmedIds] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg, time: new Date() }])
    setLoading(true)

    try {
      const resp = await sendAIMessage(msg)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: resp.reply,
        time: new Date(),
        action: resp.action
      }])
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Неизвестная ошибка'
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `⚠️ Ошибка: ${detail}`,
        time: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (msgId, actionData) => {
    try {
      // Try the dedicated /api/ai/confirm endpoint first, fall back to /api/transactions
      const payload = {
        type: actionData.type || 'expense',
        amount: parseFloat(actionData.amount) || 0,
        category_id: actionData.category_id || null,
        note: actionData.note || null,
      }
      await confirmAITransaction(payload)
      setConfirmedIds(prev => ({ ...prev, [msgId]: 'confirmed' }))
    } catch (e) {
      // Fallback: create directly
      try {
        const payload = {
          type: actionData.type || 'expense',
          amount: parseFloat(actionData.amount) || 0,
          category_id: actionData.category_id || null,
          note: actionData.note || null,
        }
        await createTransaction(payload)
        setConfirmedIds(prev => ({ ...prev, [msgId]: 'confirmed' }))
      } catch {
        setConfirmedIds(prev => ({ ...prev, [msgId]: 'error' }))
      }
    }
  }

  const handleCancel = (msgId) => {
    setConfirmedIds(prev => ({ ...prev, [msgId]: 'cancelled' }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      minHeight: 0
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(16,217,160,0.2))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>ИИ Ассистент</div>
            <div style={{ fontSize: 12, color: 'var(--income)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: 'var(--income)'
              }}/>
              Онлайн · Mistral AI
            </div>
          </div>
        </div>
      </div>

      {/* Messages scroll area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 0
      }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: 'linear-gradient(135deg, #8B5CF6, #10D9A0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0
                }}>🤖</div>
              )}
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '11px 15px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>

                {/* Confirmation card for AI transaction suggestions */}
                {msg.role === 'assistant' &&
                  msg.action?.type === 'add_transaction' &&
                  msg.action?.requires_confirmation &&
                  !confirmedIds[msg.id] && (
                  <ConfirmationCard
                    action={msg.action}
                    onConfirm={() => handleConfirm(msg.id, msg.action.data)}
                    onCancel={() => handleCancel(msg.id)}
                  />
                )}

                {/* Confirmed state */}
                {confirmedIds[msg.id] === 'confirmed' && msg.action?.type === 'add_transaction' && (
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
                    <span>{msg.action.data.type === 'income' ? '✅ Доход добавлен' : '✅ Расход добавлен'}</span>
                    <span style={{ fontWeight: 700, color: msg.action.data.type === 'income' ? '#10D9A0' : '#FF5757' }}>
                      {new Intl.NumberFormat('ru-RU').format(msg.action.data.amount)} ₽
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{msg.action.data.category}</span>
                  </motion.div>
                )}

                {/* Cancelled state */}
                {confirmedIds[msg.id] === 'cancelled' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 6, fontSize: 12,
                      color: 'var(--text-muted)', paddingLeft: 4
                    }}
                  >
                    Отменено
                  </motion.div>
                )}

                {/* Error state */}
                {confirmedIds[msg.id] === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 6, fontSize: 12,
                      color: '#FF5757', paddingLeft: 4
                    }}
                  >
                    Ошибка при добавлении. Попробуйте снова.
                  </motion.div>
                )}

                <div style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  marginTop: 4,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: 'linear-gradient(135deg, #8B5CF6, #10D9A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
            }}>🤖</div>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '18px 18px 18px 4px',
              padding: '11px 15px',
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

      {/* Suggestion chips */}
      <AnimatePresence>
        {messages.length <= 2 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flexShrink: 0,
              padding: '6px 16px',
              display: 'flex', gap: 8, overflowX: 'auto',
              borderTop: '1px solid var(--border)'
            }}
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => send(s)}
                style={{
                  flexShrink: 0,
                  padding: '7px 12px',
                  borderRadius: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div style={{
        flexShrink: 0,
        padding: '10px 14px',
        background: 'rgba(19,19,42,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'flex-end'
      }}>
        <textarea
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
            fontSize: 16,
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

function ConfirmationCard({ action, onConfirm, onCancel }) {
  const data = action?.data || {}
  const isIncome = data.type === 'income'
  const accentColor = isIncome ? '#10D9A0' : '#FF5757'
  const accentBg = isIncome ? 'rgba(16,217,160,0.08)' : 'rgba(255,87,87,0.08)'
  const accentBorder = isIncome ? 'rgba(16,217,160,0.25)' : 'rgba(255,87,87,0.25)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        marginTop: 8,
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 13
      }}
    >
      <div style={{ fontWeight: 600, color: accentColor, marginBottom: 8 }}>
        {isIncome ? '💰 Подтвердить доход?' : '💸 Подтвердить расход?'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Сумма</span>
          <span style={{ fontWeight: 700, color: accentColor }}>
            {new Intl.NumberFormat('ru-RU').format(data.amount)} ₽
          </span>
        </div>
        {data.category && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Категория</span>
            <span style={{ color: 'var(--text-primary)' }}>{data.category}</span>
          </div>
        )}
        {data.note && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Заметка</span>
            <span style={{ color: 'var(--text-primary)' }}>{data.note}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          style={{
            flex: 1, padding: '9px 8px',
            borderRadius: 10, border: 'none',
            background: accentColor,
            color: 'white',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Добавить ✅
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          style={{
            flex: 1, padding: '9px 8px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-muted)',
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Отмена ❌
        </motion.button>
      </div>
    </motion.div>
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
