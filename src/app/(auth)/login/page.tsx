'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('E-mail ou senha incorretos. Tente novamente.'); return }
      router.push('/dashboard')
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'
  if (!mounted) return null

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Botão de tema */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-2.5 rounded-xl border transition-colors ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
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
        <div className={`rounded-2xl shadow-sm border p-8 transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>

          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <OrenLogo size={52} dark={isDark} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Oren Finance
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Entre na sua conta
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  color: isDark ? '#f9fafb' : '#111827',
                  backgroundColor: isDark ? '#374151' : '#ffffff',
                  borderColor: isDark ? '#4b5563' : '#d1d5db'
                }}
                className="w-full px-4 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Senha
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    color: isDark ? '#f9fafb' : '#111827',
                    backgroundColor: isDark ? '#374151' : '#ffffff',
                    borderColor: isDark ? '#4b5563' : '#d1d5db'
                  }}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-500 hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>

        <p className={`text-center text-xs mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          © 2026 Oren Finance · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}