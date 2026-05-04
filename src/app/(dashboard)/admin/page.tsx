'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

interface User {
  id: string
  email: string
  name: string
  is_admin: boolean
  is_blocked: boolean
  created_at: string
  last_sign_in: string | null
}

interface UserData {
  accounts: Array<{ id: string; name: string; current_balance: number }>
  transactions: Array<{ id: string; description: string; amount_cents: number; type: string; date: string; categories?: { name: string } }>
  goals: Array<{ id: string; name: string; target_amount_cents: number; current_amount_cents: number }>
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const res = await adminAPI.getUsers()
      setUsers(res.data || [])
    } catch {
      setError('Acesso negado ou erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openUser = async (user: User) => {
    setSelectedUser(user)
    setUserData(null)
    setLoadingData(true)
    try {
      const res = await adminAPI.getUserData(user.id)
      setUserData(res.data)
    } catch {
      setUserData(null)
    } finally {
      setLoadingData(false)
    }
  }

  const handleImpersonate = (user: User) => {
    localStorage.setItem('impersonate_id', user.id)
    localStorage.setItem('impersonate_email', user.email)
    window.location.href = '/dashboard'
  }

  const handleBlock = async (user: User) => {
    const action = user.is_blocked ? 'desbloquear' : 'bloquear'
    if (!confirm(`Deseja ${action} o usuário ${user.email}?`)) return
    try {
      await adminAPI.blockUser(user.id, !user.is_blocked)
      load()
      if (selectedUser?.id === user.id) setSelectedUser({ ...user, is_blocked: !user.is_blocked })
    } catch { alert('Erro ao atualizar usuário.') }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Excluir permanentemente o usuário ${user.email}? Esta ação não pode ser desfeita.`)) return
    try {
      await adminAPI.deleteUser(user.id)
      setSelectedUser(null)
      setUserData(null)
      load()
    } catch { alert('Erro ao excluir usuário.') }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Admin</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie todos os usuários do sistema</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista de usuários */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Usuários ({users.length})
            </h2>
            {loading ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Carregando...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">Nenhum usuário</p>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => openUser(user)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                        {user.email}
                      </p>
                      <div className="flex gap-1 ml-2 shrink-0">
                        {user.is_admin && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                            Admin
                          </span>
                        )}
                        {user.is_blocked && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do usuário */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione um usuário para ver os detalhes</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{selectedUser.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ID: {selectedUser.id}</p>
                    {selectedUser.last_sign_in && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Último acesso: {new Date(selectedUser.last_sign_in).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => handleImpersonate(selectedUser)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      Acessar como este usuário
                    </button>
                    {!selectedUser.is_admin && (
                      <>
                        <button
                          onClick={() => handleBlock(selectedUser)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedUser.is_blocked
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200'
                              : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200'
                          }`}
                        >
                          {selectedUser.is_blocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                        <button
                          onClick={() => handleDelete(selectedUser)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {loadingData ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Carregando dados...</p>
                </div>
              ) : userData && (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Contas ({userData.accounts.length})
                    </h3>
                    {userData.accounts.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-500 text-xs">Nenhuma conta</p>
                    ) : (
                      <div className="space-y-2">
                        {userData.accounts.map(acc => (
                          <div key={acc.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{acc.name}</p>
                            <p className={`text-sm font-medium ${(acc.current_balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(acc.current_balance || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Metas ({userData.goals.length})
                    </h3>
                    {userData.goals.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-500 text-xs">Nenhuma meta</p>
                    ) : (
                      <div className="space-y-2">
                        {userData.goals.map(goal => {
                          const percent = goal.target_amount_cents > 0
                            ? Math.min(Math.round((goal.current_amount_cents / goal.target_amount_cents) * 100), 100)
                            : 0
                          return (
                            <div key={goal.id} className="py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                              <div className="flex justify-between text-sm mb-1">
                                <p className="text-gray-800 dark:text-gray-200">{goal.name}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{percent}%</p>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Últimas transações ({userData.transactions.length})
                    </h3>
                    {userData.transactions.length === 0 ? (
                      <p className="text-gray-400 dark:text-gray-500 text-xs">Nenhuma transação</p>
                    ) : (
                      <div className="space-y-2">
                        {userData.transactions.map(tx => (
                          <div key={tx.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                            <div>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{tx.description}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                {tx.categories && ` · ${tx.categories.name}`}
                              </p>
                            </div>
                            <p className={`text-sm font-medium ml-4 shrink-0 ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}