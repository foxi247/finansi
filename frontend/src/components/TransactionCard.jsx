import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { useState } from 'react'
import { deleteTransaction } from '../api/client'

function formatAmount(amount) {
  return new Intl.NumberFormat('ru-RU').format(amount)
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const dayMs = 86400000

  if (diff < dayMs && d.getDate() === now.getDate()) return 'Сегодня'
  if (diff < 2 * dayMs) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

export default function TransactionCard({ tx, onDeleted, animationDelay = 0 }) {
  const [deleting, setDeleting] = useState(false)
  const x = useMotionValue(0)
  const controls = useAnimation()
  const background = useTransform(x, [-80, 0], ['rgba(255,87,87,0.2)', 'rgba(0,0,0,0)'])
  const deleteOpacity = useTransform(x, [-80, -30], [1, 0])

  const isIncome = tx.type === 'income'
  const sign = isIncome ? '+' : '-'
  const color = isIncome ? 'var(--income)' : 'var(--expense)'
  const bgColor = isIncome ? 'var(--income-bg)' : 'var(--expense-bg)'

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteTransaction(tx.id)
      onDeleted?.(tx.id)
    } catch {
      setDeleting(false)
      await controls.start({ x: 0 })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}
    >
      {/* Delete bg */}
      <motion.div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: 'rgba(255,87,87,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: deleteOpacity
        }}
      >
        <span style={{ fontSize: 20 }}>🗑️</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        style={{ x, background: 'var(--bg-card)', cursor: 'grab' }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            controls.start({ x: -80 })
          } else {
            controls.start({ x: 0 })
          }
        }}
        onClick={async (e) => {
          const curX = x.get()
          if (curX < -30) {
            e.stopPropagation()
            await handleDelete()
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44,
            borderRadius: 14,
            background: bgColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            border: `1px solid ${isIncome ? 'rgba(16,217,160,0.15)' : 'rgba(255,87,87,0.15)'}`
          }}>
            {tx.category?.icon || (isIncome ? '💰' : '💸')}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tx.category?.name || (isIncome ? 'Доход' : 'Расход')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {tx.note ? tx.note : formatDate(tx.date)}
              {tx.note && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>· {formatDate(tx.date)}</span>}
            </div>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color }}>
              {sign}{formatAmount(tx.amount)} ₽
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
