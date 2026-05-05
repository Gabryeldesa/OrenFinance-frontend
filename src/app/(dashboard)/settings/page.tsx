'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { settingsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Profile {
  name: string
  email: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>({ name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [successProfile, setSuccessProfile] = useState(false)
  const [successPassword, setSuccessPassword] = useState(false)
  const [errorProfile, setErrorProfile] = useState('')
  const [errorPassword, setErrorPassword] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setErrorProfile('Sessão expirada. Faça login novamente.'); setLoading(false); return }
        const res = await settingsAPI.getProfile()
        setProfile({ name: res.data.name, email: res.data.email })
      } catch {
        setErrorProfile('Erro ao carregar perfil.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setErrorProfile('')
    setSuccessProfile(false)
    try {
      await settingsAPI.updateProfile({ name: profile.name })
      setSuccessProfile(true)
      setTimeout(() => setSuccessProfile(false), 3000)
    } catch {
      setErrorProfile('Erro ao salvar perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.length < 6) { setErrorPassword('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== passwordConfirm) { setErrorPassword('As senhas não coincidem.'); return }
    setSavingPassword(true)
    setErrorPassword('')
    setSuccessPassword(false)
    try {
      await settingsAPI.changePassword(password)
      setPassword('')
      setPasswordConfirm('')
      setSuccessPassword(true)
      setTimeout(() => setSuccessPassword(false), 3000)
    } catch {
      setErrorPassword('Erro ao trocar senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza? Todos os seus dados serão excluídos permanentemente. Esta ação não pode ser desfeita.')) return
    if (!confirm('Última confirmação — excluir minha conta definitivamente?')) return
    try {
      await settingsAPI.deleteAccount()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      alert('Erro ao excluir conta.')
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Carregando...</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      <div className="space-y-6">

        {/* Perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Perfil</h2>

          {errorProfile && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {errorProfile}
            </div>
          )}
          {successProfile && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
              Perfil salvo com sucesso!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm cursor-not-allowed bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">O e-mail não pode ser alterado.</p>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>

        {/* Trocar senha */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Trocar senha</h2>

          {errorPassword && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {errorPassword}
            </div>
          )}
          {successPassword && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
              Senha alterada com sucesso!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingPassword ? 'Salvando...' : 'Trocar senha'}
          </button>
        </div>

        {/* Zona de perigo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/50 p-6">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Zona de perigo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Excluir sua conta remove permanentemente todos os seus dados — contas, transações, metas e categorias. Esta ação não pode ser desfeita.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Excluir minha conta
          </button>
        </div>

      </div>
    </div>
  )
}