 'use client'

import { useState } from 'react'

type CalcId =
  | 'compound' | 'simple' | 'monthly_to_annual' | 'annual_to_monthly'
  | 'vacation' | 'vacation_prop' | 'net_salary' | 'overtime'
  | 'investment' | 'thirteenth' | 'fgts'

interface Calculator {
  id: CalcId
  label: string
  icon: string
  description: string
}

const CALCULATORS: Calculator[] = [
  { id: 'compound',         icon: '', label: 'Juros compostos',        description: 'Calcule o montante com juros sobre juros' },
  { id: 'simple',           icon: '', label: 'Juros simples',           description: 'Calcule juros sem capitalização' },
  { id: 'monthly_to_annual',icon: '', label: 'Mensal → Anual',          description: 'Converta taxa mensal em anual equivalente' },
  { id: 'annual_to_monthly',icon: '', label: 'Anual → Mensal',          description: 'Converta taxa anual em mensal equivalente' },
  { id: 'vacation',         icon: '', label: 'Férias',                  description: 'Calcule o valor das férias com 1/3' },
  { id: 'vacation_prop',    icon: '', label: 'Férias proporcionais',     description: 'Férias proporcional aos meses trabalhados' },
  { id: 'net_salary',       icon: '', label: 'Salário líquido',          description: 'Desconte INSS e IRRF do salário bruto' },
  { id: 'overtime',         icon: '', label: 'Hora extra',               description: 'Calcule o valor das horas extras' },
  { id: 'investment',       icon: '', label: 'Investimento',             description: 'Simule aportes mensais com juros compostos' },
  { id: 'thirteenth',       icon: '', label: 'Décimo terceiro',          description: 'Calcule o 13º salário proporcional' },
  { id: 'fgts',             icon: '', label: 'FGTS',                     description: 'Estime o saldo do FGTS acumulado' },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtPct = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + '%'

// INSS 2024
function calcINSS(bruto: number): number {
  const faixas = [
    { ate: 1412.00,  aliq: 0.075 },
    { ate: 2666.68,  aliq: 0.09  },
    { ate: 4000.03,  aliq: 0.12  },
    { ate: 7786.02,  aliq: 0.14  },
  ]
  let inss = 0
  let base = bruto
  let anterior = 0
  for (const f of faixas) {
    if (base <= 0) break
    const faixa = Math.min(bruto, f.ate) - anterior
    inss += faixa * f.aliq
    anterior = f.ate
    if (bruto <= f.ate) break
  }
  return Math.min(inss, 908.86)
}

// IRRF 2024
function calcIRRF(baseCalculo: number): number {
  if (baseCalculo <= 2259.20) return 0
  if (baseCalculo <= 2826.65) return baseCalculo * 0.075 - 169.44
  if (baseCalculo <= 3751.05) return baseCalculo * 0.15  - 381.44
  if (baseCalculo <= 4664.68) return baseCalculo * 0.225 - 662.77
  return baseCalculo * 0.275 - 896.00
}

function inputClass() {
  return 'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-700'}`}>
      <p className={`text-xs mb-1 ${highlight ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>
}

function Input({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '0'}
        className={inputClass() + ' bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}
      />
    </div>
  )
}

// ── Calculadoras ────────────────────────────────────────────────────────────

function CompoundCalc() {
  const [pv, setPv] = useState('')
  const [rate, setRate] = useState('')
  const [n, setN] = useState('')
  const fv = pv && rate && n
    ? Number(pv) * Math.pow(1 + Number(rate) / 100, Number(n))
    : null
  return (
    <div className="space-y-4">
      <Input label="Capital inicial (R$)" value={pv} onChange={setPv} placeholder="1000" />
      <Input label="Taxa de juros (% ao período)" value={rate} onChange={setRate} placeholder="1" />
      <Input label="Número de períodos" value={n} onChange={setN} hint="Meses, anos — o que combinar com a taxa" placeholder="12" />
      {fv !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Montante final" value={fmt(fv)} highlight />
          <ResultCard label="Juros ganhos" value={fmt(fv - Number(pv))} />
          <ResultCard label="Capital inicial" value={fmt(Number(pv))} />
        </div>
      )}
    </div>
  )
}

function SimpleCalc() {
  const [pv, setPv] = useState('')
  const [rate, setRate] = useState('')
  const [n, setN] = useState('')
  const juros = pv && rate && n ? Number(pv) * (Number(rate) / 100) * Number(n) : null
  return (
    <div className="space-y-4">
      <Input label="Capital inicial (R$)" value={pv} onChange={setPv} placeholder="1000" />
      <Input label="Taxa de juros (% ao período)" value={rate} onChange={setRate} placeholder="1" />
      <Input label="Número de períodos" value={n} onChange={setN} placeholder="12" />
      {juros !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Montante final" value={fmt(Number(pv) + juros)} highlight />
          <ResultCard label="Juros totais" value={fmt(juros)} />
        </div>
      )}
    </div>
  )
}

function MonthlyToAnnual() {
  const [rate, setRate] = useState('')
  const annual = rate ? (Math.pow(1 + Number(rate) / 100, 12) - 1) * 100 : null
  return (
    <div className="space-y-4">
      <Input label="Taxa mensal (%)" value={rate} onChange={setRate} placeholder="1" />
      {annual !== null && (
        <ResultCard label="Taxa anual equivalente" value={fmtPct(annual)} highlight />
      )}
    </div>
  )
}

function AnnualToMonthly() {
  const [rate, setRate] = useState('')
  const monthly = rate ? (Math.pow(1 + Number(rate) / 100, 1 / 12) - 1) * 100 : null
  return (
    <div className="space-y-4">
      <Input label="Taxa anual (%)" value={rate} onChange={setRate} placeholder="12" />
      {monthly !== null && (
        <ResultCard label="Taxa mensal equivalente" value={fmtPct(monthly)} highlight />
      )}
    </div>
  )
}

function VacationCalc() {
  const [salary, setSalary] = useState('')
  const s = Number(salary)
  const ferias = s ? s + s / 3 : null
  return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      {ferias !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Total de férias (com 1/3)" value={fmt(ferias)} highlight />
          <ResultCard label="1/3 constitucional" value={fmt(s / 3)} />
          <ResultCard label="Salário base" value={fmt(s)} />
        </div>
      )}
    </div>
  )
}

function VacationProp() {
  const [salary, setSalary] = useState('')
  const [months, setMonths] = useState('')
  const s = Number(salary)
  const m = Number(months)
  const prop = s && m ? (s / 12) * m : null
  const total = prop ? prop + prop / 3 : null
  return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      <Input label="Meses trabalhados" value={months} onChange={setMonths} hint="Máximo 12 meses" placeholder="8" />
      {total !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Total (com 1/3)" value={fmt(total)} highlight />
          <ResultCard label="Férias proporcionais" value={fmt(prop!)} />
          <ResultCard label="1/3 constitucional" value={fmt(prop! / 3)} />
        </div>
      )}
    </div>
  )
}

function NetSalary() {
  const [salary, setSalary] = useState('')
  const bruto = Number(salary)
  if (!bruto) return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
    </div>
  )
  const inss = calcINSS(bruto)
  const baseIR = bruto - inss
  const irrf = Math.max(0, calcIRRF(baseIR))
  const liquido = bruto - inss - irrf
  return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      <div className="grid grid-cols-1 gap-3 pt-2">
        <ResultCard label="Salário líquido" value={fmt(liquido)} highlight />
        <ResultCard label="Desconto INSS" value={fmt(inss)} />
        <ResultCard label="Desconto IRRF" value={fmt(irrf)} />
        <ResultCard label="Base de cálculo IR" value={fmt(baseIR)} />
      </div>
    </div>
  )
}

function Overtime() {
  const [salary, setSalary] = useState('')
  const [hours, setHours] = useState('')
  const [pct, setPct] = useState('50')
  const s = Number(salary)
  const h = Number(hours)
  const p = Number(pct)
  const valorHora = s ? s / 220 : null
  const valorExtra = valorHora ? valorHora * (1 + p / 100) * h : null
  return (
    <div className="space-y-4">
      <Input label="Salário mensal (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      <Input label="Horas extras realizadas" value={hours} onChange={setHours} placeholder="10" />
      <div>
        <Label>Adicional (%)</Label>
        <select
          value={pct}
          onChange={e => setPct(e.target.value)}
          className={inputClass() + ' bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}
        >
          <option value="50">50% — dias úteis</option>
          <option value="100">100% — domingos e feriados</option>
        </select>
      </div>
      {valorExtra !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Valor a receber" value={fmt(valorExtra)} highlight />
          <ResultCard label="Valor da hora normal" value={fmt(valorHora!)} />
          <ResultCard label="Valor da hora extra" value={fmt(valorHora! * (1 + p / 100))} />
        </div>
      )}
    </div>
  )
}

function Investment() {
  const [monthly, setMonthly] = useState('')
  const [rate, setRate] = useState('')
  const [n, setN] = useState('')
  const pmt = Number(monthly)
  const r = Number(rate) / 100
  const periods = Number(n)
  const fv = pmt && r && periods
    ? pmt * ((Math.pow(1 + r, periods) - 1) / r) * (1 + r)
    : null
  const total = pmt && periods ? pmt * periods : null
  return (
    <div className="space-y-4">
      <Input label="Aporte mensal (R$)" value={monthly} onChange={setMonthly} placeholder="500" />
      <Input label="Taxa de juros mensal (%)" value={rate} onChange={setRate} placeholder="1" hint="Ex: Selic ÷ 12" />
      <Input label="Período (meses)" value={n} onChange={setN} placeholder="24" />
      {fv !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Montante acumulado" value={fmt(fv)} highlight />
          <ResultCard label="Total investido" value={fmt(total!)} />
          <ResultCard label="Juros ganhos" value={fmt(fv - total!)} />
        </div>
      )}
    </div>
  )
}

function Thirteenth() {
  const [salary, setSalary] = useState('')
  const [months, setMonths] = useState('')
  const s = Number(salary)
  const m = Number(months)
  const value = s && m ? (s / 12) * m : null
  return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      <Input label="Meses trabalhados no ano" value={months} onChange={setMonths} hint="De 1 a 12" placeholder="12" />
      {value !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="13º proporcional (bruto)" value={fmt(value)} highlight />
          <ResultCard label="Por mês trabalhado" value={fmt(s / 12)} />
        </div>
      )}
    </div>
  )
}

function FGTSCalc() {
  const [salary, setSalary] = useState('')
  const [months, setMonths] = useState('')
  const s = Number(salary)
  const m = Number(months)
  const monthly = s ? s * 0.08 : null
  const total = monthly && m ? monthly * m : null
  return (
    <div className="space-y-4">
      <Input label="Salário bruto (R$)" value={salary} onChange={setSalary} placeholder="3000" />
      <Input label="Meses de contribuição" value={months} onChange={setMonths} placeholder="24" />
      {total !== null && (
        <div className="grid grid-cols-1 gap-3 pt-2">
          <ResultCard label="Saldo estimado do FGTS" value={fmt(total)} highlight />
          <ResultCard label="Depósito mensal (8%)" value={fmt(monthly!)} />
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">* Estimativa sem considerar rendimentos do FGTS</p>
        </div>
      )}
    </div>
  )
}

const COMPONENTS: Record<CalcId, React.FC> = {
  compound:         CompoundCalc,
  simple:           SimpleCalc,
  monthly_to_annual:MonthlyToAnnual,
  annual_to_monthly:AnnualToMonthly,
  vacation:         VacationCalc,
  vacation_prop:    VacationProp,
  net_salary:       NetSalary,
  overtime:         Overtime,
  investment:       Investment,
  thirteenth:       Thirteenth,
  fgts:             FGTSCalc,
}

export default function CalculatorPage() {
  const [selected, setSelected] = useState<CalcId | null>(null)
  const ActiveCalc = selected ? COMPONENTS[selected] : null
  const active = CALCULATORS.find(c => c.id === selected)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Financeira</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ferramentas para cálculos financeiros do dia a dia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Menu de calculadoras */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {CALCULATORS.map((calc, index) => (
              <button
                key={calc.id}
                onClick={() => setSelected(calc.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index !== CALCULATORS.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
                } ${
                  selected === calc.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-xl">{calc.icon}</span>
                <span className="text-sm font-medium">{calc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Área da calculadora */}
        <div className="md:col-span-2">
          {!selected ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <p className="text-4xl mb-3"></p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Selecione uma calculadora</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Escolha uma opção no menu ao lado</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{active?.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{active?.label}</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{active?.description}</p>
                </div>
              </div>
              {ActiveCalc && <ActiveCalc />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
