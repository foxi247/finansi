import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

let telegramUserId = null
let telegramUser = null

export function setTelegramUser(user) {
  telegramUser = user
  telegramUserId = String(user.id)
}

export function getTelegramUserId() {
  return telegramUserId
}

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  if (telegramUserId) {
    config.headers['X-Telegram-User-Id'] = telegramUserId
  }
  return config
})

// Users
export const initUser = (data) => api.post('/users/init', data).then(r => r.data)

// Transactions
export const getTransactions = (params = {}) => api.get('/transactions', { params }).then(r => r.data)
export const createTransaction = (data) => api.post('/transactions', data).then(r => r.data)
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(r => r.data)

// Categories
export const getCategories = (type) => api.get('/categories', { params: type ? { type } : {} }).then(r => r.data)

// Analytics
export const getSummary = (params = {}) => api.get('/analytics/summary', { params }).then(r => r.data)
export const getByCategory = (params = {}) => api.get('/analytics/by-category', { params }).then(r => r.data)
export const getTrend = (days = 30) => api.get('/analytics/trend', { params: { days } }).then(r => r.data)

// AI Chat
export const sendAIMessage = (message) => api.post('/ai/chat', { message }).then(r => r.data)

// Export
export const getExcelUrl = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (telegramUserId) qs.set('_uid', telegramUserId)
  return `${BASE_URL}/export/excel?${qs}`
}

export const downloadExcel = async (params = {}) => {
  const resp = await api.get('/export/excel', {
    params,
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([resp.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = `finansi_${new Date().toISOString().slice(0,10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
