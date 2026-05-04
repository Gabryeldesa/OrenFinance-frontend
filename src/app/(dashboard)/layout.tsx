'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchAPI, alertsAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

// ── Logo SVG ──────────────────────────────────────────────
function OrenLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" stroke="#2563eb" strokeWidth="2.5" fill="none"/>
      <circle cx="18" cy="18" r="9" stroke="#2563eb" strokeWidth="1.8" fill="none"/>
      <path d="M9 27 Q13 9 18 18 Q23 27 27 9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function OrenLogoDark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" stroke="#60a5fa" strokeWidth="2.5" fill="none"/>
      <circle cx="18" cy="18" r="9" stroke="#60a5fa" strokeWidth="1.8" fill="none"/>
      <path d="M9 27 Q13 9 18 18 Q23 27 27 9" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ── Ícones SVG profissionais ──────────────────────────────
const Icons = {
  dashboard:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  transactions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  accounts:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  cards:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  transfers:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  categories:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  goals:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  recurring:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  reports:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  import:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  calendar:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  calculator:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>,
  admin:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  sun:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  bell:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  settings:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

const menuItems = [
  { href: '/dashboard',    label: 'Dashboard',      icon: Icons.dashboard },
  { href: '/transactions', label: 'Transações',     icon: Icons.transactions },
  { href: '/accounts',     label: 'Contas',         icon: Icons.accounts },
  { href: '/cards',        label: 'Cartões',        icon: Icons.cards },
  { href: '/transfers',    label: 'Transferências', icon: Icons.transfers },
  { href: '/categories',   label: 'Categorias',     icon: Icons.categories },
  { href: '/goals',        label: 'Metas',          icon: Icons.goals },
  { href: '/recurring',    label: 'Recorrentes',    icon: Icons.recurring },
  { href: '/reports',      label: 'Relatórios',     icon: Icons.reports },
  { href: '/import',       label: 'Importar',       icon: Icons.import },
  { href: '/calendar',     label: 'Calendário',     icon: Icons.calendar },
  { href: '/calculator',   label: 'Calculadora',    icon: Icons.calculator },
]

interface Alert {
  id: string
  type: 'danger' | 'warning' | 'info' | 'success'
  category: string
  title: string
  message: string
  value_cents?: number
  link: string
}

const ALERT_COLORS: Record<string, { dot: string; text: string }> = {
  danger:  { dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-400' },
  warning: { dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  info:    { dot: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-400' },
  success: { dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const alreadyDark = document.documentElement.classList.contains('dark')
    setTheme(alreadyDark ? 'dark' : 'light')
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserName(session.user.user_metadata?.full_name || session.user.email || '')
      const impId = localStorage.getItem('impersonate_id')
      const impEmail = localStorage.getItem('impersonate_email')
      setImpersonating(impId ? (impEmail || impId) : null)
      try {
        const res = await fetchAPI('/api/admin/check')
        if (res.data?.is_admin) setIsAdmin(true)
      } catch { setIsAdmin(false) }
      setLoading(false)
    }
    checkAuth()
  }, [mounted, router])

  useEffect(() => {
    if (loading || !mounted) return
    alertsAPI.list().then(res => setAlerts(res.data || [])).catch(() => {})
  }, [loading, mounted])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setShowAlerts(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const stopImpersonating = () => {
    localStorage.removeItem('impersonate_id')
    localStorage.removeItem('impersonate_email')
    setImpersonating(null)
    window.location.href = '/admin'
  }

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const dangerCount = alerts.filter(a => a.type === 'danger').length
  const warningCount = alerts.filter(a => a.type === 'warning').length
  const badgeCount = alerts.length
  const badgeColor = dangerCount > 0 ? 'bg-red-500' : warningCount > 0 ? 'bg-yellow-500' : 'bg-blue-500'

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <OrenLogo size={40} />
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">Carregando...</div>
        </div>
      </div>
    )
  }

  const allMenuItems = [
    ...menuItems,
    ...(isAdmin && !impersonating ? [{ href: '/admin', label: 'Admin', icon: Icons.admin }] : [])
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <span>⚠️ Navegando como <strong>{impersonating}</strong></span>
          <button onClick={stopImpersonating} className="bg-white text-amber-600 px-3 py-1 rounded font-medium hover:bg-amber-50">
            Sair da conta
          </button>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex-col fixed h-full ${impersonating ? 'top-10' : 'top-0'}`}>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <OrenLogoDark size={34} /> : <OrenLogo size={34} />}
              <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                Oren Finance
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Sininho */}
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setShowAlerts(prev => !prev)}
                  className="relative p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  {Icons.bell}
                  {badgeCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 ${badgeColor} text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold`}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </button>

                {showAlerts && (
                  <div className="fixed left-64 top-16 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Alertas {badgeCount > 0 && <span className="text-gray-400 font-normal">({badgeCount})</span>}
                      </p>
                      {badgeCount > 0 && (
                        <button onClick={() => setAlerts([])} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          Limpar todos
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-gray-400">Tudo em ordem!</p>
                          <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">Nenhum alerta no momento</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                          {alerts.map(alert => {
                            const colors = ALERT_COLORS[alert.type]
                            return (
                              <Link key={alert.id} href={alert.link} onClick={() => setShowAlerts(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold ${colors.text}`}>{alert.title}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{alert.message}</p>
                                  {alert.value_cents !== undefined && (
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{formatCurrency(alert.value_cents)}</p>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tema */}
              <button onClick={toggleTheme}
                className="p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                {theme === 'dark' ? Icons.sun : Icons.moon}
              </button>

              {/* Configurações */}
              <Link href="/settings"
                className={`p-1.5 rounded-lg transition-colors ${
                  pathname === '/settings'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}>
                {Icons.settings}
              </Link>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {allMenuItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}>
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{userName}</p>
            <button
              onClick={async () => {
                localStorage.removeItem('impersonate_id')
                localStorage.removeItem('impersonate_email')
                await supabase.auth.signOut()
                router.push('/login')
              }}
              title="Sair"
              className="shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {Icons.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className={`flex-1 md:ml-64 ${impersonating ? 'mt-10' : ''}`}>

        {/* Navbar mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-10">
          <div className="flex">
            {menuItems.slice(0, 5).map(item => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}