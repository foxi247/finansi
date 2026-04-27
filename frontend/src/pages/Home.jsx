import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import TransactionCard from '../components/TransactionCard'
import { getTransactions, getSummary } from '../api/client'

function formatAmount(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.abs(n))
}

export default function Home({ onTabChange, user }) {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const periodLabels = { week: 'Неделя', month: 'Месяц', year: 'Год', all: 'Всё время' }

  const getPeriodDates = (p) => {
    const now = new Date()
    const from = new Date()
    if (p === 'week') from.setDate(now.getDate() - 7)
    else if (p === 'month') from.setMonth(now.getMonth() - 1)
    else if (p === 'year') from.setFullYear(now.getFullYear() - 1)
    else return {}
    return { date_from: from.toISOString() }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = getPeriodDates(period)
      const [txs, sum] = await Promise.all([
        getTransactions({ ...params, limit: 50 }),
        getSummary(params)
      ])
      setTransactions(txs)
      setSummary(sum)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  const handleDeleted = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    load()
  }

  const balance = summary.balance
  const isPositive = balance >= 0

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>Добро пожаловать 👋</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {user?.first_name || 'Finansi'}
            </div>
          </div>
          <motion.div
            whileTap={{ scale: 0.9 }}
            onClick={() => onTabChange('ai')}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,217,160,0.1))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 20
            }}
          >
            🤖
          </motion.div>
        </div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1A1A45 0%, #2D1B69 50%, #1A2A45 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            padding: '24px 24px 20px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(139,92,246,0.2)'
          }}
        >
          {/* Background decor */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}/>
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,217,160,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}/>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
              Баланс · {periodLabels[period]}
            </div>
            <motion.div
              key={balance}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: 36, fontWeight: 800,
                color: isPositive ? '#10D9A0' : '#FF5757',
                marginBottom: 20,
                letterSpacing: '-1px'
              }}
            >
              {isPositive ? '+' : '-'}{formatAmount(balance)} ₽
            </motion.div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                flex: 1, background: 'rgba(16,217,160,0.1)',
                borderRadius: 14, padding: '12px 14px',
                border: '1px solid rgba(16,217,160,0.15)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(16,217,160,0.7)', marginBottom: 4, fontWeight: 500 }}>
                  ↑ Доходы
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10D9A0' }}>
                  {formatAmount(summary.total_income)} ₽
                </div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(255,87,87,0.1)',
                borderRadius: 14, padding: '12px 14px',
                border: '1px solid rgba(255,87,87,0.15)'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,87,87,0.7)', marginBottom: 4, fontWeight: 500 }}>
                  ↓ Расходы
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FF5757' }}>
                  {formatAmount(summary.total_expense)} ₽
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {Object.entries(periodLabels).map(([key, label]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(key)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: period === key ? 'var(--accent)' : 'var(--border)',
                background: period === key
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))'
                  : 'transparent',
                color: period === key ? 'var(--accent-light)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: period === key ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange('add')}
            className="btn btn-income"
            style={{ flex: 1, fontSize: 14 }}
          >
            <span style={{ fontSize: 16 }}>↑</span> Доход
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange('add')}
            className="btn btn-expense"
            style={{ flex: 1, fontSize: 14 }}
          >
            <span style={{ fontSize: 16 }}>↓</span> Расход
          </motion.button>
        </div>
      </div>

      {/* Transactions */}
      <div style={{ padding: '0 20px' }}>
        <div className="section-header">
          <div className="section-title">Последние операции</div>
          <div className="section-action" onClick={() => onTabChange('analytics')}>
            Аналитика →
          </div>
        </div>

        {loading ? (
          <TransactionsSkeleton />
        ) : transactions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">Нет транзакций</div>
            <div className="empty-state-text">Добавьте первый доход или расход, нажав кнопку выше</div>
          </motion.div>
        ) : (
          <div>
            {transactions.map((tx, i) => (
              <TransactionCard key={tx.id} tx={tx} onDeleted={handleDeleted} animationDelay={i * 0.04} />
            ))}
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {transactions.length} операций · свайп влево для удаления
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 12 }} className="skeleton" />
      ))}
    </div>
  )
}
