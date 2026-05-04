'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCalendar } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

type EventoTipo = 'transacao' | 'recorrente_prevista' | 'transferencia' | 'fatura' | 'meta'

interface Evento {
  id: string
  tipo: EventoTipo
  subtipo?: string
  descricao: string
  valor_cents: number | null
  categoria?: string | null
}

type EventosPorDia = Record<string, Evento[]>

function corEvento(e: Evento): string {
  if (e.tipo === 'fatura') return '#f59e0b'
  if (e.tipo === 'transferencia') return '#6366f1'
  if (e.tipo === 'meta') return '#8b5cf6'
  if (e.tipo === 'recorrente_prevista') return '#64748b'
  if (e.subtipo === 'income') return '#22c55e'
  return '#ef4444'
}

function iconeEvento(e: Evento): string {
  if (e.tipo === 'fatura') return '💳'
  if (e.tipo === 'transferencia') return '↔️'
  if (e.tipo === 'meta') return '⭐'
  if (e.tipo === 'recorrente_prevista') return '🔁'
  if (e.subtipo === 'income') return '⬆️'
  return '⬇️'
}

function labelTipo(e: Evento): string {
  if (e.tipo === 'fatura') return 'Fatura'
  if (e.tipo === 'transferencia') return 'Transferência'
  if (e.tipo === 'meta') return 'Meta'
  if (e.tipo === 'recorrente_prevista') return 'Previsto'
  if (e.subtipo === 'income') return 'Receita'
  return 'Despesa'
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function pad(n: number) { return String(n).padStart(2, '0') }
function monthKey(year: number, month: number) { return `${year}-${pad(month + 1)}` }
function dayKey(year: number, month: number, day: number) { return `${year}-${pad(month + 1)}-${pad(day)}` }

const ANOS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i)

export default function CalendarPage() {
  const today = new Date()
  const [ano, setAno] = useState(today.getFullYear())
  const [mes, setMes] = useState(today.getMonth())
  const [showPicker, setShowPicker] = useState(false)
  const [diaSelecionado, setDiaSelecionado] = useState<string>(
    dayKey(today.getFullYear(), today.getMonth(), today.getDate())
  )
  const [eventos, setEventos] = useState<EventosPorDia>({})
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregarEventos = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await getCalendar(monthKey(ano, mes))
      setEventos(res.data || {})
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar calendário')
    } finally {
      setCarregando(false)
    }
  }, [ano, mes])

  useEffect(() => { carregarEventos() }, [carregarEventos])

  function mesAnterior() {
    if (mes === 0) { setAno(a => a - 1); setMes(11) } else setMes(m => m - 1)
  }
  function proximoMes() {
    if (mes === 11) { setAno(a => a + 1); setMes(0) } else setMes(m => m + 1)
  }

  function selecionarMes(m: number) {
    setMes(m)
    setShowPicker(false)
  }

  function selecionarAno(a: number) {
    setAno(a)
  }

  const primeiroDia = new Date(ano, mes, 1).getDay()
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: ultimoDia }, (_, i) => i + 1),
  ]
  while (celulas.length % 7 !== 0) celulas.push(null)

  const eventosDia = eventos[diaSelecionado] || []
  const [diaNum] = diaSelecionado.split('-').slice(2).map(Number)

  const totalReceitas = eventosDia.filter(e => e.subtipo === 'income').reduce((s, e) => s + (e.valor_cents || 0), 0)
  const totalDespesas = eventosDia
    .filter(e => e.subtipo === 'expense' || (e.tipo === 'recorrente_prevista' && e.subtipo !== 'income'))
    .reduce((s, e) => s + (e.valor_cents || 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário Financeiro</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Visualize receitas, despesas, faturas, metas e transferências por dia
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* Grade mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

          {/* Navegação */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={mesAnterior}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg"
            >
              ‹
            </button>

            {/* Seletor de mês/ano */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(p => !p)}
                className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {MESES[mes]} {ano}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-4 w-72">

                  {/* Seletor de ano */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Ano</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selecionarAno(ano - 1)}
                        className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        ‹
                      </button>
                      <span className="flex-1 text-center font-bold text-gray-900 dark:text-white">{ano}</span>
                      <button
                        onClick={() => selecionarAno(ano + 1)}
                        className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Seletor de mês */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Mês</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MESES.map((m, i) => (
                        <button
                          key={m}
                          onClick={() => selecionarMes(i)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            i === mes
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {m.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botão hoje */}
                  <button
                    onClick={() => {
                      setAno(today.getFullYear())
                      setMes(today.getMonth())
                      setShowPicker(false)
                    }}
                    className="w-full mt-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Hoje
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={proximoMes}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg"
            >
              ›
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          {carregando ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">Carregando...</div>
          ) : (
            <div className="grid grid-cols-7" onClick={() => setShowPicker(false)}>
              {celulas.map((dia, i) => {
                if (dia === null) {
                  return (
                    <div
                      key={`vazio-${i}`}
                      className="min-h-[80px] border-r border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    />
                  )
                }
                const key = dayKey(ano, mes, dia)
                const evs = eventos[key] || []
                const isHoje = key === dayKey(today.getFullYear(), today.getMonth(), today.getDate())
                const isSelecionado = key === diaSelecionado

                return (
                  <div
                    key={key}
                    onClick={(e) => { e.stopPropagation(); setDiaSelecionado(key) }}
                    className={`min-h-[80px] border-r border-b border-gray-50 dark:border-gray-700 p-1.5 cursor-pointer transition-colors ${
                      isSelecionado
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : isHoje
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                      isHoje
                        ? 'bg-green-500 text-white font-bold'
                        : isSelecionado
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {dia}
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {evs.slice(0, 4).map((ev, idx) => (
                        <div
                          key={idx}
                          title={ev.descricao}
                          style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: corEvento(ev), flexShrink: 0 }}
                        />
                      ))}
                      {evs.length > 4 && (
                        <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 9, lineHeight: '8px' }}>
                          +{evs.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {[
              { cor: '#22c55e', label: 'Receita' },
              { cor: '#ef4444', label: 'Despesa' },
              { cor: '#64748b', label: 'Previsto' },
              { cor: '#f59e0b', label: 'Fatura' },
              { cor: '#6366f1', label: 'Transferência' },
              { cor: '#8b5cf6', label: 'Meta' },
            ].map(({ cor, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cor }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Lista do dia */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="font-bold text-base text-gray-900 dark:text-white">{diaNum} de {MESES[mes]}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {eventosDia.length === 0 ? 'Nenhum evento' : `${eventosDia.length} evento${eventosDia.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {eventosDia.length > 0 && (
            <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border-r border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400">RECEITAS</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">DESPESAS</p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDespesas)}</p>
              </div>
            </div>
          )}

          <div className="max-h-[520px] overflow-y-auto">
            {eventosDia.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum evento neste dia</p>
              </div>
            ) : (
              eventosDia.map((ev, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 px-5 py-3.5 ${idx < eventosDia.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: corEvento(ev) + '20' }}
                  >
                    {iconeEvento(ev)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.descricao}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: corEvento(ev) + '20', color: corEvento(ev) }}
                      >
                        {labelTipo(ev)}
                      </span>
                      {ev.categoria && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{ev.categoria}</span>
                      )}
                    </div>
                  </div>
                  {ev.valor_cents != null && (
                    <p
                      className="text-sm font-bold shrink-0"
                      style={{
                        color: ev.subtipo === 'income' ? '#16a34a' : ev.tipo === 'transferencia' ? '#6366f1' : '#dc2626'
                      }}
                    >
                      {formatCurrency(ev.valor_cents)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}