'use client'

import { useState, useEffect } from 'react'
import { transactionsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts'

interface Transaction {
  id: string
  description: string
  amount_cents: number
  type: string
  date: string
  payment_method: string | null
  categories?: { name: string; color: string }
  accounts?: { name: string }
}

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#64748b'
]

const PAYMENTS: Record<string, string> = {
  pix: 'Pix', credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito',
  cash: 'Dinheiro', boleto: 'Boleto', ted: 'TED', doc: 'DOC', other: 'Outro'
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<{ mes: string; Receitas: number; Despesas: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  const load = async () => {
    setLoading(true)
    try {
      const [year, m] = month.split('-')
      const start = `${year}-${m}-01`
      const lastDay = new Date(Number(year), Number(m), 0).getDate()
      const end = `${year}-${m}-${lastDay}`
      const res = await transactionsAPI.list({ start, end, limit: '500' })
      setTransactions(res.data || [])

      const months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Number(year), Number(m) - 1 - i, 1)
        const y = d.getFullYear()
        const mo = String(d.getMonth() + 1).padStart(2, '0')
        const s = `${y}-${mo}-01`
        const last = new Date(y, d.getMonth() + 1, 0).getDate()
        const e = `${y}-${mo}-${last}`
        const label = d.toLocaleDateString('pt-BR', { month: 'short' })
        months.push({ s, e, label })
      }

      const monthlyResults = await Promise.all(
        months.map(async ({ s, e, label }) => {
          const r = await transactionsAPI.list({ start: s, end: e, limit: '500' })
          const txs: Transaction[] = r.data || []
          const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount_cents, 0)
          const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount_cents, 0)
          return { mes: label, Receitas: Math.round(income / 100), Despesas: Math.round(expense / 100) }
        })
      )
      setMonthlyData(monthlyResults)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [month])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount_cents, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount_cents, 0)
  const balance = totalIncome - totalExpense
  const expenses = transactions.filter(t => t.type === 'expense')
  const incomes = transactions.filter(t => t.type === 'income')
  const avgDaily = expenses.length > 0
    ? totalExpense / new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate()
    : 0
  const biggestExpense = [...expenses].sort((a, b) => b.amount_cents - a.amount_cents)[0]
  const biggestIncome = [...incomes].sort((a, b) => b.amount_cents - a.amount_cents)[0]

  const byCategory = expenses.filter(t => t.categories).reduce((acc, t) => {
    const name = t.categories!.name
    acc[name] = (acc[name] || 0) + t.amount_cents
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value / 100) }))

  const [year, m] = month.split('-')
  const daysInMonth = new Date(Number(year), Number(m), 0).getDate()
  const dailyBalance: { dia: string; Saldo: number }[] = []
  let running = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${m}-${String(d).padStart(2, '0')}`
    transactions.filter(t => t.date === dateStr).forEach(t => {
      if (t.type === 'income') running += t.amount_cents
      if (t.type === 'expense') running -= t.amount_cents
    })
    if (d % 5 === 0 || d === 1 || d === daysInMonth) {
      dailyBalance.push({ dia: `${d}/${m}`, Saldo: Math.round(running / 100) })
    }
  }

  const byPayment = expenses.reduce((acc, t) => {
    const key = PAYMENTS[t.payment_method || ''] || 'Outro'
    acc[key] = (acc[key] || 0) + t.amount_cents
    return acc
  }, {} as Record<string, number>)
  const paymentList = Object.entries(byPayment).sort((a, b) => b[1] - a[1])

  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Forma de Pagamento', 'Valor (R$)']
    const TYPES: Record<string, string> = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' }
    const rows = transactions.map(tx => [
      new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      tx.description,
      TYPES[tx.type] || tx.type,
      tx.categories?.name || '',
      tx.accounts?.name || '',
      PAYMENTS[tx.payment_method || ''] || tx.payment_method || '',
      tx.type === 'expense'
        ? `-${(tx.amount_cents / 100).toFixed(2).replace('.', ',')}`
        : (tx.amount_cents / 100).toFixed(2).replace('.', ',')
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financeiro_${month.replace('-', '_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const monthLabel = new Date(month + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 capitalize">{monthLabel}</p>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
          {transactions.length > 0 && (
            <button
              onClick={exportCSV}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ⬇ Exportar CSV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Receitas</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Despesas</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gasto médio/dia</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(Math.round(avgDaily))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {biggestExpense && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maior despesa do mês</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{biggestExpense.description}</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(biggestExpense.amount_cents)}</p>
          </div>
        )}
        {biggestIncome && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maior receita do mês</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{biggestIncome.description}</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(biggestIncome.amount_cents)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando gráficos...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma transação neste mês</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Receitas vs Despesas — últimos 6 meses</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
                  formatter={(value) => [`R$ ${Number(value ?? 0).toLocaleString('pt-BR')}`, '']}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pieData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Gastos por categoria</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
                      formatter={(value) => [`R$ ${Number(value ?? 0).toLocaleString('pt-BR')}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">R$ {item.value.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dailyBalance.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Evolução do saldo no mês</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyBalance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
                      formatter={(value) => [`R$ ${Number(value ?? 0).toLocaleString('pt-BR')}`, 'Saldo']}
                    />
                    <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {paymentList.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Gastos por forma de pagamento</h2>
              <div className="space-y-3">
                {paymentList.map(([name, total]) => {
                  const percent = totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatCurrency(total)} ({percent}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Despesas ({expenses.length})</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...expenses].sort((a, b) => b.amount_cents - a.amount_cents).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{tx.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {tx.categories && ` · ${tx.categories.name}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 ml-4 shrink-0">-{formatCurrency(tx.amount_cents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Receitas ({incomes.length})</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...incomes].sort((a, b) => b.amount_cents - a.amount_cents).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{tx.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          {tx.categories && ` · ${tx.categories.name}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 ml-4 shrink-0">+{formatCurrency(tx.amount_cents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}