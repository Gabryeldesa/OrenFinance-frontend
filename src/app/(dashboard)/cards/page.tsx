'use client'

import { useState, useEffect } from 'react'
import { cardsAPI, accountsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

interface Card {
  id: string
  name: string
  limit_cents: number
  closing_day: number
  due_day: number
  color: string
  account_id: string | null
  used_limit_cents: number
  available_limit_cents: number
  current_invoice: Invoice | null
}

interface Invoice {
  id: string
  reference_month: string
  due_date: string
  closing_date: string
  total_cents: number
  status: string
  paid_at: string | null
}

interface Account {
  id: string
  name: string
}

interface CardForm {
  name: string
  limit: string
  closing_day: string
  due_day: string
  account_id: string
}

const emptyForm: CardForm = {
  name: '',
  limit: '',
  closing_day: '10',
  due_day: '17',
  account_id: ''
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:    { label: 'Aberta',   color: 'text-blue-600 bg-blue-50' },
  closed:  { label: 'Fechada',  color: 'text-yellow-600 bg-yellow-50' },
  paid:    { label: 'Paga',     color: 'text-green-600 bg-green-50' },
  preview: { label: 'Prevista', color: 'text-purple-600 bg-purple-50' }
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showInvoices, setShowInvoices] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CardForm>(emptyForm)

  const loadData = async () => {
    try {
      const [cardsRes, accRes] = await Promise.all([
        cardsAPI.list(),
        accountsAPI.list()
      ])
      setCards(cardsRes.data || [])
      setAccounts(accRes.data || [])
    } catch {
      setError('Erro ao carregar cartões.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (card: Card) => {
    setEditing(card)
    setForm({
      name: card.name,
      limit: (card.limit_cents / 100).toFixed(2).replace('.', ','),
      closing_day: String(card.closing_day),
      due_day: String(card.due_day),
      account_id: card.account_id || ''
    })
    setError('')
    setShowModal(true)
  }

  const openInvoices = async (cardId: string) => {
    setShowInvoices(cardId)
    setLoadingInvoices(true)
    try {
      const res = await cardsAPI.getInvoices(cardId)
      setInvoices(res.data || [])
    } catch {
      setError('Erro ao carregar faturas.')
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handlePayInvoice = async (cardId: string, invoiceId: string) => {
    if (!confirm('Confirmar pagamento desta fatura?')) return
    try {
      await cardsAPI.payInvoice(cardId, invoiceId)
      openInvoices(cardId)
      loadData()
    } catch {
      alert('Erro ao pagar fatura.')
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    if (!form.limit) { setError('Limite é obrigatório.'); return }
    if (!form.closing_day || !form.due_day) { setError('Dias de fechamento e vencimento são obrigatórios.'); return }

    setSaving(true)
    setError('')

    try {
      const limit_cents = Math.round(
        parseFloat(form.limit.replace(/\./g, '').replace(',', '.')) * 100
      )

      const body = {
        name: form.name.trim(),
        limit_cents,
        closing_day: parseInt(form.closing_day),
        due_day: parseInt(form.due_day),
        account_id: form.account_id || null
      }

      if (editing) {
        await cardsAPI.update(editing.id, body)
      } else {
        await cardsAPI.create(body)
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
    if (!confirm('Excluir este cartão?')) return
    try {
      await cardsAPI.delete(id)
      loadData()
    } catch {
      alert('Erro ao excluir cartão.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus cartões e faturas</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Novo cartão
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-gray-500 font-medium">Nenhum cartão cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Adicione seu primeiro cartão de crédito</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 text-sm hover:underline">
            Adicionar cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => {
            const usedPercent = card.limit_cents > 0
              ? Math.round((card.used_limit_cents / card.limit_cents) * 100)
              : 0

            return (
              <div key={card.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 bg-blue-600 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-lg">{card.name}</p>
                    <span className="text-white/70 text-xs">💳</span>
                  </div>
                  <p className="text-white/70 text-xs mb-1">Limite disponível</p>
                  <p className="text-2xl font-bold">{formatCurrency(card.available_limit_cents)}</p>
                  <p className="text-white/70 text-xs mt-1">de {formatCurrency(card.limit_cents)} no total</p>
                </div>

                <div className="px-5 pt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Utilizado: {formatCurrency(card.used_limit_cents)}</span>
                    <span>{usedPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span>Fecha dia <strong className="text-gray-700 dark:text-gray-300">{card.closing_day}</strong></span>
                    <span>Vence dia <strong className="text-gray-700 dark:text-gray-300">{card.due_day}</strong></span>
                  </div>

                  {card.current_invoice && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Fatura atual</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(card.current_invoice.total_cents)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Vence {new Date(card.current_invoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[card.current_invoice.status]?.color} dark:bg-opacity-20`}>
                          {STATUS_LABELS[card.current_invoice.status]?.label}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openInvoices(card.id)}
                      className="flex-1 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Ver faturas
                    </button>
                    <button
                      onClick={() => openEdit(card)}
                      className="py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="py-2 px-3 text-xs border border-red-100 dark:border-red-900/30 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de faturas */}
      {showInvoices && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Faturas</h2>
              <button onClick={() => setShowInvoices(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {loadingInvoices ? (
              <div className="text-center py-8 text-gray-400 text-sm">Carregando faturas...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhuma fatura encontrada</div>
            ) : (
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(invoice.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          Vence {new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total_cents)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[invoice.status]?.color || 'text-gray-600 bg-gray-50'}`}>
                          {STATUS_LABELS[invoice.status]?.label || invoice.status}
                        </span>
                      </div>
                    </div>

                    {invoice.status === 'preview' ? (
                      <p className="text-xs text-purple-400 mt-2 italic">
                        Parcela futura — será registrada automaticamente quando o mês chegar
                      </p>
                    ) : invoice.status !== 'paid' && invoice.total_cents > 0 ? (
                      <button
                        onClick={() => handlePayInvoice(showInvoices, invoice.id)}
                        className="w-full mt-2 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Marcar como paga
                      </button>
                    ) : invoice.status === 'paid' && invoice.paid_at ? (
                      <p className="text-xs text-gray-400 mt-2">
                        Paga em {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editing ? 'Editar cartão' : 'Novo cartão'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cartão</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Nubank, Itaú Platinum..."
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
                <input
                  type="text"
                  value={form.limit}
                  onChange={e => setForm({ ...form, limit: e.target.value })}
                  placeholder="0,00"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia de fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.closing_day}
                    onChange={e => setForm({ ...form, closing_day: e.target.value })}
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.due_day}
                    onChange={e => setForm({ ...form, due_day: e.target.value })}
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta para débito (opcional)</label>
                <select
                  value={form.account_id}
                  onChange={e => setForm({ ...form, account_id: e.target.value })}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem conta vinculada</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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