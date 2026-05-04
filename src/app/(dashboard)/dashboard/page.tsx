'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { transactionsAPI, accountsAPI, getInsights } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import React from 'react'

interface Transaction {
  id: string
  description: string
  amount_cents: number
  type: string
  date: string
  categories?: { name: string; color: string }
  accounts?: { name: string }
}

interface Account {
  id: string
  name: string
  current_balance: number
  color: string
}

interface Insight {
  tipo: 'alerta' | 'positivo' | 'info'
  icone: string
  titulo: string
  descricao: string
  valor_cents: number | null
}

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  alerta: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  positivo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    const load = async () => {
      try {
        const [txRes, accRes, insRes] = await Promise.all([
          transactionsAPI.list({ month: currentMonth }),
          accountsAPI.list(),
          getInsights(),
        ])
        setTransactions(txRes.data || [])
        setAccounts(accRes.data || [])
        setInsights(insRes.data || [])
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount_cents, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount_cents, 0)
  const balance = totalIncome - totalExpense
  const totalAccountBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0)
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const byCategory = transactions
    .filter(t => t.type === 'expense' && t.categories)
    .reduce((acc, t) => {
      const name = t.categories!.name
      const color = t.categories!.color || '#6366f1'
      acc[name] = { total: (acc[name]?.total || 0) + t.amount_cents, color }
      return acc
    }, {} as Record<string, { total: number; color: string }>)

  const categoryList = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).slice(0, 5)

  const insightClasses = {
    alerta: {
      card: 'border-l-[3px] border-l-red-400 border border-gray-100 dark:border-gray-700',
      iconeBg: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      badge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      label: 'Atenção',
      valor: 'text-red-600 dark:text-red-400',
    },
    positivo: {
      card: 'border-l-[3px] border-l-green-500 border border-gray-100 dark:border-gray-700',
      iconeBg: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      badge: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      label: 'Ótimo',
      valor: 'text-green-600 dark:text-green-400',
    },
    info: {
      card: 'border-l-[3px] border-l-blue-400 border border-gray-100 dark:border-gray-700',
      iconeBg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      label: 'Info',
      valor: 'text-blue-600 dark:text-blue-400',
    },
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral das suas finanças</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral das suas finanças</p>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Receitas do mês</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Despesas do mês</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo do mês</p>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo em contas</p>
          <p className={`text-xl font-bold ${totalAccountBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalAccountBalance)}
          </p>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Insights do mês</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, idx) => {
              const s = insightClasses[ins.tipo]
              return (
                <div key={idx} className={`bg-white dark:bg-gray-800 rounded-r-xl p-4 flex gap-3 items-start ${s.card}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconeBg}`}>
                    {INSIGHT_ICONS[ins.tipo] || INSIGHT_ICONS.info}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ins.titulo}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ins.descricao}</p>
                    {ins.valor_cents != null && (
                      <p className={`text-sm font-semibold mt-1.5 ${s.valor}`}>{formatCurrency(ins.valor_cents)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Transações recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Transações recentes</h2>
            <Link href="/transactions" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver todas</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma transação este mês</p>
              <Link href="/transactions" className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline block">Adicionar transação</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-8 rounded-full ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{tx.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(tx.date)}{tx.categories && ` · ${tx.categories.name}`}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por categoria */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Gastos por categoria</h2>
          {categoryList.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum gasto categorizado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryList.map(([name, { total, color }]) => {
                const percent = totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{formatCurrency(total)} ({percent}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contas */}
      {accounts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Suas contas</h2>
            <Link href="/accounts" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Gerenciar</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {accounts.map(acc => (
              <div key={acc.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{acc.name}</p>
                <p className={`text-sm font-bold ${(acc.current_balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(acc.current_balance || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}