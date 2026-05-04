'use client'

import { useState, useEffect, useMemo } from 'react'
import { goalsAPI, accountsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

interface Goal {
  id: string
  name: string
  target_amount_cents: number
  current_amount_cents: number
  deadline: string | null
  is_completed: boolean
}

interface Account {
  id: string
  name: string
}

interface GoalForm {
  name: string
  target_amount: string
  current_amount: string
  deadline: string
}

const emptyForm: GoalForm = {
  name: '',
  target_amount: '0,00',
  current_amount: '0,00',
  deadline: '',
}

function parseCents(value: string): number {
  const n = parseFloat(value.replace(/\./g, '').replace(',', '.')) * 100
  return isNaN(n) ? 0 : Math.round(n)
}

function parseReais(value: string): number {
  const n = parseFloat(value.replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState<Goal | null>(null)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Simulação
  const [simMonthly, setSimMonthly] = useState('')
  const [simMonths, setSimMonths] = useState('')

  // Aporte
  const [depositAmount, setDepositAmount] = useState('')
  const [depositAccountId, setDepositAccountId] = useState('')
  const [depositSaving, setDepositSaving] = useState(false)
  const [depositError, setDepositError] = useState('')

  const load = async () => {
    try {
      const [goalsRes, accRes] = await Promise.all([
        goalsAPI.list(),
        accountsAPI.list()
      ])
      setGoals(goalsRes.data || [])
      setAccounts(accRes.data || [])
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
    setSimMonthly('')
    setSimMonths('')
    setError('')
    setShowModal(true)
  }

  const openEdit = (goal: Goal) => {
    setEditing(goal)
    setForm({
      name: goal.name,
      target_amount: (goal.target_amount_cents / 100).toFixed(2).replace('.', ','),
      current_amount: (goal.current_amount_cents / 100).toFixed(2).replace('.', ','),
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
    })
    setSimMonthly('')
    setSimMonths('')
    setError('')
    setShowModal(true)
  }

  const openDeposit = (goal: Goal) => {
    setShowDepositModal(goal)
    setDepositAmount('')
    setDepositAccountId(accounts[0]?.id || '')
    setDepositError('')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name.trim(),
        target_amount_cents: parseCents(form.target_amount),
        current_amount_cents: parseCents(form.current_amount),
        deadline: form.deadline || null,
      }
      if (editing) {
        await goalsAPI.update(editing.id, body)
      } else {
        await goalsAPI.create(body)
      }
      setShowModal(false)
      load()
    } catch {
      setError('Erro ao salvar meta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount) { setDepositError('Informe o valor do aporte.'); return }
    const amount_cents = parseCents(depositAmount)
    if (amount_cents <= 0) { setDepositError('Valor deve ser maior que zero.'); return }

    setDepositSaving(true)
    setDepositError('')
    try {
      await goalsAPI.deposit(showDepositModal!.id, {
        amount_cents,
        account_id: depositAccountId || null
      })
      setShowDepositModal(null)
      load()
    } catch {
      setDepositError('Erro ao registrar aporte.')
    } finally {
      setDepositSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta meta?')) return
    try {
      await goalsAPI.delete(id)
      load()
    } catch {
      alert('Erro ao excluir meta.')
    }
  }

  const sim = useMemo(() => {
    const target = parseCents(form.target_amount)
    const current = parseCents(form.current_amount)
    const remaining = Math.max(target - current, 0)
    if (remaining === 0) return null

    const remainingReais = remaining / 100
    const monthlyReais = parseReais(simMonthly)
    const months = parseInt(simMonths)

    let byMonthly: { months: number; years: number; extraMonths: number } | null = null
    let byTime: { monthly: number } | null = null
    let byDeadline: { monthly: number; months: number } | null = null

    if (monthlyReais > 0) {
      const totalMonths = Math.ceil(remainingReais / monthlyReais)
      byMonthly = {
        months: totalMonths,
        years: Math.floor(totalMonths / 12),
        extraMonths: totalMonths % 12
      }
    }

    if (months > 0) {
      byTime = { monthly: remainingReais / months }
    }

    if (form.deadline) {
      const now = new Date()
      const deadline = new Date(form.deadline + 'T00:00:00')
      const diffMonths = Math.max(
        (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()),
        1
      )
      byDeadline = { monthly: remainingReais / diffMonths, months: diffMonths }
    }

    return { remaining, remainingReais, byMonthly, byTime, byDeadline }
  }, [form.target_amount, form.current_amount, form.deadline, simMonthly, simMonths])

  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe seus objetivos financeiros</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova meta
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Nenhuma meta cadastrada</p>
          <button onClick={openCreate} className="mt-4 text-blue-600 text-sm hover:underline">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Em andamento ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => openEdit(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onDeposit={() => openDeposit(goal)}
                  />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Concluídas ({completed.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => openEdit(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onDeposit={() => openDeposit(goal)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editing ? 'Editar meta' : 'Nova meta'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
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
                  placeholder="Ex: Viagem, Reserva de emergência..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor alvo (R$)</label>
                <input
                  type="text"
                  value={form.target_amount}
                  onChange={e => setForm({ ...form, target_amount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor atual (R$)</label>
                <input
                  type="text"
                  value={form.current_amount}
                  onChange={e => setForm({ ...form, current_amount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo (opcional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Simulação */}
            {sim && (
              <div className="mt-5 bg-blue-50 rounded-xl p-4 space-y-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Simulação — faltam {formatCurrency(sim.remaining)}
                </p>

                {sim.byDeadline && (
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">
                      💡 Para atingir no prazo ({sim.byDeadline.months} meses)
                    </p>
                    <p className="text-sm font-bold text-blue-700">
                      {formatCurrency(Math.ceil(sim.byDeadline.monthly * 100))} / mês
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Se eu guardar por mês:
                  </label>
                  <input
                    type="text"
                    value={simMonthly}
                    onChange={e => { setSimMonthly(e.target.value); setSimMonths('') }}
                    placeholder="Ex: 500,00"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {sim.byMonthly && (
                    <div className="mt-2 bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500">Você vai atingir a meta em:</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">
                        {sim.byMonthly.years > 0 && `${sim.byMonthly.years} ano${sim.byMonthly.years > 1 ? 's' : ''} `}
                        {sim.byMonthly.extraMonths > 0 && `${sim.byMonthly.extraMonths} mês${sim.byMonthly.extraMonths > 1 ? 'es' : ''}`}
                        {sim.byMonthly.years === 0 && sim.byMonthly.extraMonths === 0 && 'menos de 1 mês'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{sim.byMonthly.months} meses no total</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Se eu quero atingir em (meses):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={simMonths}
                    onChange={e => { setSimMonths(e.target.value); setSimMonthly('') }}
                    placeholder="Ex: 12"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {sim.byTime && (
                    <div className="mt-2 bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500">Você vai precisar guardar por mês:</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">
                        {formatCurrency(Math.ceil(sim.byTime.monthly * 100))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

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

      {/* Modal de aporte */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '384px', padding: '24px' }}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Registrar aporte</h2>
            <p className="text-sm text-gray-500 mb-5">
              Meta: <strong>{showDepositModal.name}</strong>
            </p>

            {depositError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {depositError}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{formatCurrency(showDepositModal.current_amount_cents)}</span>
                <span>{formatCurrency(showDepositModal.target_amount_cents)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(Math.round((showDepositModal.current_amount_cents / showDepositModal.target_amount_cents) * 100), 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Faltam {formatCurrency(Math.max(showDepositModal.target_amount_cents - showDepositModal.current_amount_cents, 0))}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor do aporte (R$)</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descontar de qual conta? <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  value={depositAccountId}
                  onChange={e => setDepositAccountId(e.target.value)}
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Não descontar de nenhuma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDepositModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositSaving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {depositSaving ? 'Salvando...' : '+ Aportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete, onDeposit }: {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
  onDeposit: () => void
}) {
  const percent = goal.target_amount_cents > 0
    ? Math.min(Math.round((goal.current_amount_cents / goal.target_amount_cents) * 100), 100)
    : 0

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{goal.name}</p>
          {goal.deadline && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        {goal.is_completed && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            ✓ Concluída
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{formatCurrency(goal.current_amount_cents)}</span>
          <span>{formatCurrency(goal.target_amount_cents)}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor: goal.is_completed ? '#22c55e' : '#3b82f6'
            }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{percent}%</p>
      </div>

      <div className="flex gap-2">
        {!goal.is_completed && (
          <button
            onClick={onDeposit}
            className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Aportar
          </button>
        )}
        <button onClick={onEdit} className="py-2 px-3 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Editar
        </button>
        <button onClick={onDelete} className="py-2 px-3 text-xs border border-red-100 dark:border-red-900/30 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Excluir
        </button>
      </div>
    </div>
  )
}