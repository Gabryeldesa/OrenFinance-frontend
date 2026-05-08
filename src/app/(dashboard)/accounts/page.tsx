'use client'

import { useState, useEffect } from 'react'
import { accountsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const ACCOUNT_TYPES: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  investment: 'Investimento',
  other: 'Outro'
}

interface Account {
  id: string
  name: string
  type: string
  initial_balance: number
  current_balance: number
  color: string | null
  icon: string | null
}

interface AccountForm {
  name: string
  type: string
  initial_balance: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<AccountForm>({
    name: '',
    type: 'checking',
    initial_balance: '0,00',
  })

  const loadAccounts = async () => {
    try {
      const res = await accountsAPI.list()
      setAccounts(res.data || [])
      setTotalBalance(res.meta?.total_balance || 0)
    } catch {
      setError('Erro ao carregar contas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAccounts() }, [])

  const openCreate = () => {
    setForm({ name: '', type: 'checking', initial_balance: '0,00' })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const cents = Math.round(
        parseFloat(form.initial_balance.replace(/\./g, '').replace(',', '.')) * 100
      )
      await accountsAPI.create({
        name: form.name.trim(),
        type: form.type,
        initial_balance: isNaN(cents) ? 0 : cents,
      })
      setShowModal(false)
      loadAccounts()
    } catch {
      setError('Erro ao salvar conta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    try {
      await accountsAPI.delete(id)
      loadAccounts()
    } catch {
      alert('Erro ao excluir conta.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie suas contas bancárias</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova conta
        </button>
      </div>

      <div className="bg-blue-600 rounded-xl p-5 mb-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Saldo total consolidado</p>
        <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma conta cadastrada</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            Adicionar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900 dark:text-white text-sm">{account.name}</span>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-xs"
                >
                  Excluir
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{ACCOUNT_TYPES[account.type]}</p>
              <p className={`text-xl font-bold ${account.current_balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(account.current_balance)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              Nova conta
            </h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Nubank, Bradesco..."
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                  <option value="cash">Dinheiro</option>
                  <option value="investment">Investimento</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Saldo inicial (R$)</label>
                <input
                  type="text"
                  value={form.initial_balance}
                  onChange={e => setForm({ ...form, initial_balance: e.target.value })}
                  placeholder="0,00"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}