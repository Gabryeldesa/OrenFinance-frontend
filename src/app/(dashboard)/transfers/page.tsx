'use client'

import { useState, useEffect } from 'react'
import { transfersAPI, accountsAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface Transfer {
  id: string
  amount_cents: number
  date: string
  notes: string | null
  from_account: { id: string; name: string }
  to_account: { id: string; name: string }
}

interface Account {
  id: string
  name: string
  current_balance: number
}

interface TransferForm {
  from_account_id: string
  to_account_id: string
  amount: string
  date: string
  notes: string
}

const emptyForm: TransferForm = {
  from_account_id: '',
  to_account_id: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: ''
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TransferForm>(emptyForm)

  const loadData = async () => {
    try {
      const [transfersRes, accRes] = await Promise.all([
        transfersAPI.list(),
        accountsAPI.list()
      ])
      setTransfers(transfersRes.data || [])
      setAccounts(accRes.data || [])
    } catch {
      setError('Erro ao carregar transferências.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.from_account_id) { setError('Selecione a conta de origem.'); return }
    if (!form.to_account_id) { setError('Selecione a conta de destino.'); return }
    if (form.from_account_id === form.to_account_id) { setError('Conta de origem e destino não podem ser iguais.'); return }
    if (!form.amount) { setError('Valor é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const amount_cents = Math.round(
        parseFloat(form.amount.replace(/\./g, '').replace(',', '.')) * 100
      )
      await transfersAPI.create({
        from_account_id: form.from_account_id,
        to_account_id: form.to_account_id,
        amount_cents,
        date: form.date,
        notes: form.notes || null
      })
      setShowModal(false)
      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transferência?')) return
    try {
      await transfersAPI.delete(id)
      loadData()
    } catch { alert('Erro ao excluir transferência.') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transferências</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Movimentações entre suas contas</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova transferência
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{acc.name}</p>
              <p className={`text-sm font-bold ${(acc.current_balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(acc.current_balance || 0)}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-4xl mb-3">🔀</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma transferência registrada</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Mova dinheiro entre suas contas</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            Fazer primeira transferência
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {transfers.map((transfer, index) => (
            <div
              key={transfer.id}
              className={`flex items-center justify-between p-4 ${index !== transfers.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm">
                  🔀
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {transfer.from_account?.name} → {transfer.to_account?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(transfer.date)}</p>
                    {transfer.notes && <span className="text-xs text-gray-400 dark:text-gray-500">· {transfer.notes}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(transfer.amount_cents)}
                </p>
                <button
                  onClick={() => handleDelete(transfer.id)}
                  className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Nova transferência</h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta de origem</label>
                <select
                  value={form.from_account_id}
                  onChange={e => setForm({ ...form, from_account_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione a conta de origem</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} — {formatCurrency(acc.current_balance || 0)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta de destino</label>
                <select
                  value={form.to_account_id}
                  onChange={e => setForm({ ...form, to_account_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione a conta de destino</option>
                  {accounts.filter(acc => acc.id !== form.from_account_id).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} — {formatCurrency(acc.current_balance || 0)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Pagamento de aluguel..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                {saving ? 'Transferindo...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}