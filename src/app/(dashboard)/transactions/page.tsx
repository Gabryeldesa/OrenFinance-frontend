'use client'

import { useState, useEffect } from 'react'
import { transactionsAPI, accountsAPI, categoriesAPI, cardsAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

const PAYMENT_METHODS: Record<string, string> = {
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  cash: 'Dinheiro',
  boleto: 'Boleto',
  ted: 'TED',
  doc: 'DOC',
  other: 'Outro'
}

interface Transaction {
  id: string
  description: string
  amount_cents: number
  type: string
  date: string
  category_id: string | null
  account_id: string | null
  credit_card_id: string | null
  payment_method: string | null
  is_confirmed: boolean
  categories?: { name: string; color: string; icon: string }
  accounts?: { name: string }
  credit_cards?: { name: string }
}

interface Account { id: string; name: string }
interface Card { id: string; name: string }
interface Category { id: string; name: string; type: string; color: string }

interface TransactionForm {
  description: string
  amount: string
  type: string
  date: string
  category_id: string
  account_id: string
  credit_card_id: string
  payment_method: string
  notes: string
  is_confirmed: boolean
}

const emptyForm: TransactionForm = {
  description: '',
  amount: '',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
  category_id: '',
  account_id: '',
  credit_card_id: '',
  payment_method: 'pix',
  notes: '',
  is_confirmed: true
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TransactionForm>(emptyForm)
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  const isCredit = form.payment_method === 'credit_card'

  const loadData = async () => {
    try {
      const [txRes, accRes, catRes, cardsRes] = await Promise.all([
        transactionsAPI.list({ month: filterMonth, type: filterType }),
        accountsAPI.list(),
        categoriesAPI.list(),
        cardsAPI.list()
      ])
      setTransactions(txRes.data || [])
      setAccounts(accRes.data || [])
      setCategories(catRes.data || [])
      setCards(cardsRes.data || [])
    } catch {
      setError('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filterMonth, filterType])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditing(tx)
    setForm({
      description: tx.description,
      amount: (tx.amount_cents / 100).toFixed(2).replace('.', ','),
      type: tx.type,
      date: tx.date,
      category_id: tx.category_id || '',
      account_id: tx.account_id || '',
      credit_card_id: tx.credit_card_id || '',
      payment_method: tx.payment_method || 'pix',
      notes: '',
      is_confirmed: tx.is_confirmed
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Descrição é obrigatória.'); return }
    if (!form.amount) { setError('Valor é obrigatório.'); return }
    if (isCredit && !form.credit_card_id) { setError('Selecione um cartão.'); return }
    if (!isCredit && !form.account_id) { setError('Selecione uma conta.'); return }
    setSaving(true)
    setError('')
    try {
      const amount_cents = Math.round(
        parseFloat(form.amount.replace(/\./g, '').replace(',', '.')) * 100
      )
      const body = {
        description: form.description.trim(),
        amount_cents,
        type: form.type,
        date: form.date,
        category_id: form.category_id || null,
        account_id: isCredit ? null : form.account_id,
        credit_card_id: isCredit ? form.credit_card_id : null,
        payment_method: form.payment_method,
        notes: form.notes || null,
        is_confirmed: form.is_confirmed
      }
      if (editing) {
        await transactionsAPI.update(editing.id, body)
      } else {
        await transactionsAPI.create(body)
      }
      setShowModal(false)
      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return
    try {
      await transactionsAPI.delete(id)
      loadData()
    } catch {
      alert('Erro ao excluir transação.')
    }
  }

  const filteredCategories = categories.filter(c => c.type === form.type || c.type === 'both')
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount_cents, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount_cents, 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Controle suas receitas e despesas</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova transação
        </button>
      </div>

      {/* Cards de resumo — fundo adaptado ao tema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Receitas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Despesas</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo do mês</p>
          <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filtros — inputs com dark mode via className (sem style fixo branco) */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          <option value="">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma transação encontrada</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            Adicionar primeira transação
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-4 ${
                index !== transactions.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${
                  tx.type === 'income' ? 'bg-green-500' : tx.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</p>
                    {tx.categories && <span className="text-xs text-gray-400 dark:text-gray-500">· {tx.categories.name}</span>}
                    {tx.accounts && <span className="text-xs text-gray-400 dark:text-gray-500">· {tx.accounts.name}</span>}
                    {tx.credit_cards && <span className="text-xs text-gray-400 dark:text-gray-500">· 💳 {tx.credit_cards.name}</span>}
                    {!tx.is_confirmed && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`text-sm font-bold ${
                  tx.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : tx.type === 'expense'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(tx)}
                    className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editing ? 'Editar transação' : 'Nova transação'}
            </h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Tipo */}
              <div className="flex gap-2">
                {['expense', 'income'].map(type => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type, category_id: '' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === type
                        ? type === 'income' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {type === 'income' ? '↑ Receita' : '↓ Despesa'}
                  </button>
                ))}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Almoço, Salário..."
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Forma de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de pagamento</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({ ...form, payment_method: e.target.value, account_id: '', credit_card_id: '' })}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Cartão ou Conta */}
              {isCredit ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cartão de crédito</label>
                  <select
                    value={form.credit_card_id}
                    onChange={e => setForm({ ...form, credit_card_id: e.target.value })}
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um cartão</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta</label>
                  <select
                    value={form.account_id}
                    onChange={e => setForm({ ...form, account_id: e.target.value })}
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Confirmada */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_confirmed"
                  checked={form.is_confirmed}
                  onChange={e => setForm({ ...form, is_confirmed: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_confirmed" className="text-sm text-gray-700 dark:text-gray-300">
                  Transação confirmada
                </label>
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
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}