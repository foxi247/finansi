import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getSummary, getByCategory, getTrend, downloadExcel } from '../api/client'

function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) }

const PERIODS = [
  { key: 7, label: '7 дней' },
  { key: 14, label: '14 дней' },
  { key: 30, label: 'Месяц' },
  { key: 90, label: '3 мес' },
  { key: 365, label: 'Год' },
]

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [trend, setTrend] = useState([])
  const [catType, setCatType] = useState('expense')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      const params = { date_from: dateFrom.toISOString() }
      try {
        const [sum, cats, tr] = await Promise.all([
          getSummary(params),
          getByCategory({ ...params, type: catType }),
          getTrend(days)
        ])
        setSummary(sum)
        setCategories(cats.slice(0, 8))
        setTrend(tr.filter(d => d.income > 0 || d.expense > 0))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [days, catType])

  const handleExport = async () => {
    setExporting(true)
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      await downloadExcel({ date_from: dateFrom.toISOString() })
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const savingsRate = summary
    ? summary.total_income > 0
      ? Math.max(0, Math.round((summary.balance / summary.total_income) * 100))
      : 0
    : 0

  return (
    <div style={{ padding: '20px 20px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Аналитика</h2>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12,
            background: 'rgba(16,217,160,0.1)',
            border: '1px solid rgba(16,217,160,0.2)',
            color: '#10D9A0', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          <span>{exporting ? '⏳' : '📊'}</span>
          {exporting ? 'Экспорт...' : 'Excel'}
        </motion.button>
      </div>

      {/* Period */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        {PERIODS.map(p => (
          <motion.button
            key={p.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDays(p.key)}
            style={{
              flexShrink: 0, padding: '7px 14px',
              borderRadius: 100, border: '1px solid',
              borderColor: days === p.key ? 'var(--accent)' : 'var(--border)',
              background: days === p.key ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: days === p.key ? 'var(--accent-light)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: days === p.key ? 600 : 400,
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[200, 200, 260, 220].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 20 }} className="skeleton" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary cards */}
          {summary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <SummaryCard label="Доходы" value={summary.total_income} color="#10D9A0" icon="↑" />
                <SummaryCard label="Расходы" value={summary.total_expense} color="#FF5757" icon="↓" />
                <SummaryCard label="Норма сбережений" value={`${savingsRate}%`} color="#A78BFA" icon="📊" raw />
              </div>
            </motion.div>
          )}

          {/* Trend chart */}
          {trend.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Динамика доходов и расходов</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={trend} barGap={2} barSize={trend.length > 20 ? 4 : 8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#5A5A75', fontSize: 10 }}
                    tickFormatter={d => {
                      const date = new Date(d)
                      return `${date.getDate()}.${date.getMonth()+1}`
                    }}
                    interval={Math.floor(trend.length / 5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1A1A35', border: '1px solid #2A2A4A', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
                    formatter={(val, name) => [`${fmt(val)} ₽`, name === 'income' ? 'Доход' : 'Расход']}
                    labelFormatter={d => new Date(d).toLocaleDateString('ru-RU')}
                  />
                  <Bar dataKey="income" fill="#10D9A0" radius={[3, 3, 0, 0]} opacity={0.85} />
                  <Bar dataKey="expense" fill="#FF5757" radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10D9A0' }}/>
                  Доходы
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FF5757' }}/>
                  Расходы
                </div>
              </div>
            </motion.div>
          )}

          {/* Category breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            {/* Tab switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>По категориям</div>
              <div style={{
                display: 'flex', background: 'var(--bg-input)',
                borderRadius: 10, padding: 3, gap: 2
              }}>
                {[['expense', 'Расходы'], ['income', 'Доходы']].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setCatType(k)}
                    style={{
                      padding: '5px 10px', borderRadius: 8, border: 'none',
                      background: catType === k
                        ? (k === 'expense' ? 'rgba(255,87,87,0.2)' : 'rgba(16,217,160,0.2)')
                        : 'transparent',
                      color: catType === k ? (k === 'expense' ? '#FF5757' : '#10D9A0') : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: 32 }}>📭</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет данных за этот период</div>
              </div>
            ) : (
              <div>
                {/* Pie chart */}
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {categories.map((cat, i) => (
                        <Cell key={i} fill={cat.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1A1A35', border: '1px solid #2A2A4A', borderRadius: 12, fontSize: 12, color: '#F0F0FF' }}
                      formatter={(val) => [`${fmt(val)} ₽`]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: catType === 'expense' ? '#FF5757' : '#10D9A0' }}>
                          {fmt(cat.amount)} ₽
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
                          {cat.percent}%
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-input)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percent}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          style={{ height: '100%', borderRadius: 3, background: cat.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Export button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            disabled={exporting}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(16,217,160,0.15), rgba(16,217,160,0.05))',
              border: '1px solid rgba(16,217,160,0.2)',
              color: '#10D9A0',
              fontWeight: 600, fontSize: 15,
              width: '100%', marginBottom: 8
            }}
          >
            <span>{exporting ? '⏳' : '📥'}</span>
            {exporting ? 'Скачивание...' : 'Скачать в Excel'}
          </motion.button>

          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color, icon, raw }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16, padding: '12px 10px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontSize: raw ? 16 : 14,
        fontWeight: 800,
        color,
        marginBottom: 4,
        lineHeight: 1.2
      }}>
        {raw ? value : `${new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)} ₽`}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.2 }}>{label}</div>
    </div>
  )
}
