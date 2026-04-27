import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategories, createTransaction } from '../api/client'

export default function AddTransaction({ onTabChange }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCategories(type).then(cats => {
      setCategories(cats)
      setSelectedCategory(cats[0] || null)
    })
  }, [type])

  const handleAmountChange = (e) => {
    const val = e.target.value
    // только цифры и одна точка
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val)
      setError('')
    }
  }

  const handleSubmit = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Введите сумму'); return }
    setError('')
    setLoading(true)
    try {
      await createTransaction({
        type,
        amount: num,
        category_id: selectedCategory?.id || null,
        note: note.trim() || null
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setAmount('')
        setNote('')
        onTabChange('home')
      }, 1200)
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const isIncome = type === 'income'
  const accentColor = isIncome ? '#10D9A0' : '#FF5757'
  const accentBg = isIncome ? 'rgba(16,217,160,0.1)' : 'rgba(255,87,87,0.1)'

  return (
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>Новая операция</h2>

      {/* Type Toggle */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 4,
        border: '1px solid var(--border)'
      }}>
        {[
          { key: 'expense', label: '↓ Расход', color: '#FF5757' },
          { key: 'income', label: '↑ Доход', color: '#10D9A0' }
        ].map(({ key, label, color }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setType(key)}
            style={{
              flex: 1, padding: '12px 8px',
              borderRadius: 12, border: 'none',
              background: type === key
                ? `linear-gradient(135deg, ${color}22, ${color}11)`
                : 'transparent',
              color: type === key ? color : 'var(--text-muted)',
              fontWeight: type === key ? 700 : 400,
              fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: type === key ? `0 0 0 1px ${color}40` : 'none'
            }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Amount input */}
      <motion.div
        key={type}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: accentBg,
          border: `1px solid ${accentColor}30`,
          borderRadius: 20,
          padding: '20px 24px',
        }}
      >
        <div style={{ fontSize: 13, color: accentColor, opacity: 0.7, marginBottom: 10 }}>
          {isIncome ? 'Сумма дохода' : 'Сумма расхода'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 40,          /* >= 16px — зум не срабатывает */
              fontWeight: 800,
              color: amount ? accentColor : 'var(--text-muted)',
              fontFamily: 'inherit',
              letterSpacing: '-1px',
              width: '100%',
              caretColor: accentColor
            }}
          />
          <span style={{ fontSize: 28, color: accentColor, fontWeight: 700, flexShrink: 0 }}>₽</span>
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#FF5757', fontSize: 13, marginTop: 8 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* Categories */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>Категория</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          maxHeight: 190,
          overflowY: 'auto'
        }}>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, padding: '10px 4px',
                borderRadius: 14, border: '1px solid',
                borderColor: selectedCategory?.id === cat.id ? accentColor : 'var(--border)',
                background: selectedCategory?.id === cat.id ? accentBg : 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: selectedCategory?.id === cat.id ? accentColor : 'var(--text-muted)',
                textAlign: 'center', lineHeight: 1.2
              }}>
                {cat.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Note */}
      <input
        type="text"
        className="input"
        placeholder="Заметка (необязательно)"
        value={note}
        onChange={e => setNote(e.target.value)}
        maxLength={120}
        style={{ fontSize: 16 }}   /* 16px — зум не срабатывает */
      />

      {/* Submit */}
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '16px',
              background: 'rgba(16,217,160,0.15)',
              border: '1px solid rgba(16,217,160,0.3)',
              borderRadius: 16, color: '#10D9A0',
              fontWeight: 700, fontSize: 16
            }}
          >
            <motion.span
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ fontSize: 24 }}
            >✅</motion.span>
            {isIncome ? 'Доход добавлен!' : 'Расход добавлен!'}
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading || !amount}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 16, border: 'none',
              background: amount
                ? `linear-gradient(135deg, ${accentColor}, ${isIncome ? '#059669' : '#DC2626'})`
                : 'var(--bg-card)',
              color: amount ? 'white' : 'var(--text-muted)',
              fontSize: 16, fontWeight: 700,
              cursor: amount ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: amount ? `0 6px 25px ${accentColor}40` : 'none',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '...' : `${isIncome ? 'Добавить доход' : 'Добавить расход'}`}
          </motion.button>
        )}
      </AnimatePresence>

      <div style={{ height: 8 }} />
    </div>
  )
}
