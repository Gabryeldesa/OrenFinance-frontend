import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchAPI(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const impersonateId = typeof window !== 'undefined'
    ? localStorage.getItem('impersonate_id')
    : null

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(impersonateId ? { 'x-impersonate-id': impersonateId } : {}),
      ...options.headers
    }
  })

  if (response.status === 204) return { data: null }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro na requisição')
  }

  return data
}

// ── Categorias ──────────────────────────────────────────
export const categoriesAPI = {
  list: () => fetchAPI('/api/categories'),
  create: (body: object) => fetchAPI('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/categories/${id}`, { method: 'DELETE' })
}

// ── Contas ──────────────────────────────────────────────
export const accountsAPI = {
  list: () => fetchAPI('/api/accounts'),
  create: (body: object) => fetchAPI('/api/accounts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/accounts/${id}`, { method: 'DELETE' })
}

// ── Transações ──────────────────────────────────────────
export const transactionsAPI = {
  list: (params?: object) => fetchAPI('/api/transactions?' + new URLSearchParams(params as Record<string, string>)),
  summary: (params?: object) => fetchAPI('/api/transactions/summary?' + new URLSearchParams(params as Record<string, string>)),
  create: (body: object) => fetchAPI('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/transactions/${id}`, { method: 'DELETE' })
}

// ── Metas ───────────────────────────────────────────────
export const goalsAPI = {
  list: () => fetchAPI('/api/goals'),
  create: (body: object) => fetchAPI('/api/goals', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/goals/${id}`, { method: 'DELETE' }),
  deposit: (id: string, body: object) => fetchAPI(`/api/goals/${id}/deposit`, { method: 'POST', body: JSON.stringify(body) })
}

// ── Cartões ─────────────────────────────────────────────
export const cardsAPI = {
  list: () => fetchAPI('/api/cards'),
  create: (body: object) => fetchAPI('/api/cards', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/cards/${id}`, { method: 'DELETE' }),
  getInvoices: (id: string) => fetchAPI(`/api/cards/${id}/invoices`),
  payInvoice: (id: string, invoiceId: string) => fetchAPI(`/api/cards/${id}/invoices/${invoiceId}/pay`, { method: 'PUT' })
}

// ── Recorrentes ─────────────────────────────────────────
export const recurringAPI = {
  list: () => fetchAPI('/api/recurring'),
  create: (body: object) => fetchAPI('/api/recurring', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => fetchAPI(`/api/recurring/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/recurring/${id}`, { method: 'DELETE' }),
  apply: () => fetchAPI('/api/recurring/apply', { method: 'POST' })
}

// ── Transferências ───────────────────────────────────────
export const transfersAPI = {
  list: () => fetchAPI('/api/transfers'),
  create: (body: object) => fetchAPI('/api/transfers', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => fetchAPI(`/api/transfers/${id}`, { method: 'DELETE' })
}

// ── Admin ───────────────────────────────────────────────
export const adminAPI = {
  check: () => fetchAPI('/api/admin/check'),
  getUsers: () => fetchAPI('/api/admin/users'),
  getUserData: (id: string) => fetchAPI(`/api/admin/users/${id}/data`),
  blockUser: (id: string, is_blocked: boolean) => fetchAPI(`/api/admin/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ is_blocked }) }),
  deleteUser: (id: string) => fetchAPI(`/api/admin/users/${id}`, { method: 'DELETE' })
}

// ── Configurações ────────────────────────────────────────
export const settingsAPI = {
  getProfile: () => fetchAPI('/api/settings/profile'),
  updateProfile: (body: object) => fetchAPI('/api/settings/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (password: string) => fetchAPI('/api/settings/password', { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteAccount: () => fetchAPI('/api/settings/account', { method: 'DELETE' })
}

export async function getCalendar(month: string) {
  return fetchAPI(`/api/calendar?month=${month}`)
}

export async function getInsights() {
  return fetchAPI('/api/insights')
}

// ── Alertas ──────────────────────────────────────────────
export const alertsAPI = {
  list: () => fetchAPI('/api/alerts')
}