'use client'

import { useState, useEffect } from 'react'
import { categoriesAPI, accountsAPI, cardsAPI, fetchAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

interface RecurringRule {
  id: string
  description: string
  amount_cents: number
  type: string
  day_of_month: number
  is_active: boolean
  credit_card_id: string | null
  total_installments: number | null
  current_installment: number | null
  categories?: { name: string; color: string }
  accounts?: { name: string }
  credit_cards?: { name: string }
}

interface Category { id: string; name: string; type: string }
interface Account { id: string; name: string }
interface Card { id: string; name: string }

const emptyForm = {
  description: '',
  amount: '',
  type: 'expense',
  category_id: '',
  account_id: '',
  credit_card_id: '',
  day_of_month: '5',
  is_installment: false,
  total_installments: '',
}

export default function RecurringPage() {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RecurringRule | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isCard = !!form.credit_card_id

  const load = async () => {
    try {
      const [rulesRes, catRes, accRes, cardsRes] = await Promise.all([
        fetchAPI('/api/recurring'),
        categoriesAPI.list(),
        accountsAPI.list(),
        cardsAPI.list()
      ])
      setRules(rulesRes.data || [])
      setCategories(catRes.data?.all || catRes.data || [])
      setAccounts(accRes.data || [])
      setCards(cardsRes.data || [])
    } catch {
      setError('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (rule: RecurringRule) => {
    setEditing(rule)
    setForm({
      description: rule.description,
      amount: (rule.amount_cents / 100).toFixed(2).replace('.', ','),
      type: rule.type,
      category_id: '',
      account_id: '',
      credit_card_id: rule.credit_card_id || '',
      day_of_month: String(rule.day_of_month),
      is_installment: !!rule.total_installments,
      total_installments: rule.total_installments ? String(rule.total_installments) : '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Descrição é obrigatória.'); return }
    if (!form.amount) { setError('Valor é obrigatório.'); return }
    if (!form.day_of_month) { setError('Dia do mês é obrigatório.'); return }
    if (form.is_installment && !form.total_installments) { setError('Informe o número de parcelas.'); return }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        description: form.description.trim(),
        amount_cents: Math.round(parseFloat(form.amount.replace(/\./g, '').replace(',', '.')) * 100),
        type: form.type,
        category_id: form.category_id || null,
        account_id: form.credit_card_id ? null : (form.account_id || null),
        credit_card_id: form.credit_card_id || null,
        day_of_month: parseInt(form.day_of_month),
        total_installments: form.is_installment ? parseInt(form.total_installments) : null,
      }
      if (editing) {
        await fetchAPI(`/api/recurring/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await fetchAPI('/api/recurring', { method: 'POST', body: JSON.stringify(body) })
      }
      setShowModal(false)
      load()
    } catch {
      setError('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return
    try {
      await fetchAPI(`/api/recurring/${id}`, { method: 'DELETE' })
      load()
    } catch { alert('Erro ao excluir.') }
  }

  const handleToggle = async (rule: RecurringRule) => {
    try {
      await fetchAPI(`/api/recurring/${rule.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !rule.is_active }) })
      load()
    } catch { alert('Erro ao atualizar.') }
  }

  const handleApply = async () => {
    if (!confirm('Isso vai criar as transações recorrentes do mês atual que ainda não foram lançadas. Continuar?')) return
    setApplying(true)
    try {
      const res = await fetchAPI('/api/recurring/apply', { method: 'POST' })
      setSuccessMsg(res.data?.message || 'Transações criadas!')
      setTimeout(() => setSuccessMsg(''), 4000)
      load()
    } catch { alert('Erro ao aplicar recorrentes.') }
    finally { setApplying(false) }
  }

  const filteredCategories = categories.filter(c => c.type === form.type || c.type === 'both')
  const active = rules.filter(r => r.is_active)
  const inactive = rules.filter(r => !r.is_active)

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
  const selectClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recorrentes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Despesas fixas e compras parceladas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={applying}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {applying ? 'Aplicando...' : '▶ Aplicar este mês'}
          </button>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nova regra
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : rules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma regra cadastrada</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            Criar primeira regra
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Ativas ({active.length})
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {active.map((rule, index) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    isLast={index === active.length - 1}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => handleDelete(rule.id)}
                    onToggle={() => handleToggle(rule)}
                  />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Pausadas / Concluídas ({inactive.length})
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden opacity-60">
                {inactive.map((rule, index) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    isLast={index === inactive.length - 1}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => handleDelete(rule.id)}
                    onToggle={() => handleToggle(rule)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editing ? 'Editar regra' : 'Nova regra recorrente'}
            </h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Netflix, Aluguel..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.is_installment ? 'Valor de cada parcela (R$)' : 'Valor (R$)'}
                </label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Todo dia (do mês)</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={form.day_of_month}
                  onChange={e => setForm({ ...form, day_of_month: e.target.value })}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use até o dia 28 para funcionar em todos os meses</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <input
                  type="checkbox"
                  id="is_installment"
                  checked={form.is_installment}
                  onChange={e => setForm({ ...form, is_installment: e.target.checked, total_installments: '' })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_installment" className="text-sm text-gray-700 dark:text-gray-300">
                  É uma compra parcelada
                </label>
              </div>

              {form.is_installment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={form.total_installments}
                    onChange={e => setForm({ ...form, total_installments: e.target.value })}
                    placeholder="Ex: 12"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cartão de crédito</label>
                <select
                  value={form.credit_card_id}
                  onChange={e => setForm({ ...form, credit_card_id: e.target.value, account_id: '' })}
                  className={selectClass}
                >
                  <option value="">Nenhum cartão</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>{card.name}</option>
                  ))}
                </select>
              </div>

              {!isCard && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta</label>
                  <select
                    value={form.account_id}
                    onChange={e => setForm({ ...form, account_id: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Sem conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}
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

function RuleRow({ rule, isLast, onEdit, onDelete, onToggle }: {
  rule: RecurringRule
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const isInstallment = !!rule.total_installments
  return (
    <div className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-8 rounded-full ${rule.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.description}</p>
            {isInstallment && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                {rule.current_installment}/{rule.total_installments}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400 dark:text-gray-500">Todo dia {rule.day_of_month}</p>
            {rule.categories && <span className="text-xs text-gray-400 dark:text-gray-500">· {rule.categories.name}</span>}
            {rule.accounts && <span className="text-xs text-gray-400 dark:text-gray-500">· {rule.accounts.name}</span>}
            {rule.credit_cards && <span className="text-xs text-gray-400 dark:text-gray-500">· 💳 {rule.credit_cards.name}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className={`text-sm font-bold ${rule.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount_cents)}
        </p>
        <div className="flex gap-2">
          <button onClick={onToggle} className="text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
            {rule.is_active ? 'Pausar' : 'Ativar'}
          </button>
          <button onClick={onEdit} className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Editar</button>
          <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Excluir</button>
        </div>
      </div>
    </div>
  )
}