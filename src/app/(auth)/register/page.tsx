'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function OrenLogo({ size = 40, dark = false }: { size?: number; dark?: boolean }) {
  const color = dark ? '#60a5fa' : '#2563eb'
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" stroke={color} strokeWidth="2.5" fill="none"/>
      <circle cx="18" cy="18" r="9" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M9 27 Q13 9 18 18 Q23 27 27 9" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function PasswordStrength({ password, isDark }: { password: string; isDark: boolean }) {
  if (!password) return null
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasLength = password.length >= 8

  return (
    <div className="mt-2 space-y-1">
      <div className={`flex items-center gap-2 text-xs ${hasLength ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span>{hasLength ? '✓' : '○'}</span> Mínimo 8 caracteres
      </div>
      <div className={`flex items-center gap-2 text-xs ${hasLetter ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span>{hasLetter ? '✓' : '○'}</span> Pelo menos uma letra
      </div>
      <div className={`flex items-center gap-2 text-xs ${hasNumber ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span>{hasNumber ? '✓' : '○'}</span> Pelo menos um número
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = (saved as 'light' | 'dark') || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
    if (!/[a-zA-Z]/.test(pwd)) return 'A senha deve conter pelo menos uma letra.'
    if (!/[0-9]/.test(pwd)) return 'A senha deve conter pelo menos um número.'
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: 'https://oren-finance-frontend.vercel.app/login'
        }
      })
      if (error) { setError('Erro ao criar conta. Tente novamente.'); return }
      setDone(true)
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'
  if (!mounted) return null

  if (done) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-sm border p-8 text-center transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Confirme seu e-mail</h1>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Enviamos um link de confirmação para:</p>
            <p className="text-blue-500 font-medium text-sm mb-6">{email}</p>
            <p className={`text-xs mb-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Clique no link do e-mail para ativar sua conta. Verifique também a caixa de spam.
            </p>
            <Link href="/login" className="block w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center">
              Ir para o login
            </Link>
          </div>
          <p className={`text-center text-xs mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>© 2026 Oren Finance · Todos os direitos reservados</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-2.5 rounded-xl border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div className="w-full max-w-md">
        <div className={`rounded-2xl shadow-sm border p-8 transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <OrenLogo size={52} dark={isDark} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Criar conta</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Comece a controlar suas finanças</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                required
                style={{ color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                className="w-full px-4 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{ color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                className="w-full px-4 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  style={{ color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                  className="w-full px-4 py-2.5 pr-11 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <PasswordStrength password={password} isDark={isDark} />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirmar senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  style={{ color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#374151' : '#ffffff', borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                  className="w-full px-4 py-2.5 pr-11 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 mt-1.5">As senhas não coincidem.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-500 hover:underline font-medium">Entrar</Link>
          </p>
        </div>
        <p className={`text-center text-xs mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>© 2026 Oren Finance · Todos os direitos reservados</p>
      </div>
    </div>
  )
}