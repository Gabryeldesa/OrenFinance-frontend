'use client'

import { useState, useEffect, useRef } from 'react'
import { accountsAPI, categoriesAPI, fetchAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface ImportTransaction {
  date: string
  description: string
  amount_cents: number
  type: string
  docto: string
  isDuplicate: boolean
  selected: boolean
  category_id: string | null
  category_name: string | null
}

interface Account { id: string; name: string }
interface Category { id: string; name: string; type: string }

const BANK_NAMES: Record<string, string> = {
  bradesco: 'Bradesco', bb: 'Banco do Brasil', nubank: 'Nubank',
  inter: 'Inter', c6: 'C6 Bank', itau: 'Itaú', santander: 'Santander',
  caixa: 'Caixa Econômica Federal'
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [transactions, setTransactions] = useState<ImportTransaction[]>([])
  const [bank, setBank] = useState('')
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([accountsAPI.list(), categoriesAPI.list()]).then(([accRes, catRes]) => {
      setAccounts(accRes.data || [])
      setCategories(catRes.data || [])
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setError('') }
  }

  const handlePreview = async () => {
    if (!file) { setError('Selecione um arquivo CSV.'); return }
    if (!accountId) { setError('Selecione uma conta.'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/import/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error?.message || 'Erro ao processar arquivo.'); return }
      setBank(data.data.bank)
      setTransactions(data.data.transactions)
      setStep('review')
    } catch {
      setError('Erro ao enviar arquivo.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAll = (selected: boolean) => {
    setTransactions(prev => prev.map(tx => ({ ...tx, selected: tx.isDuplicate ? false : selected })))
  }

  const toggleOne = (index: number) => {
    setTransactions(prev => prev.map((tx, i) => i === index ? { ...tx, selected: !tx.selected } : tx))
  }

  const updateCategory = (index: number, categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    setTransactions(prev => prev.map((tx, i) =>
      i === index ? { ...tx, category_id: categoryId || null, category_name: cat?.name || null } : tx
    ))
  }

  const handleImport = async () => {
    const selected = transactions.filter(tx => tx.selected)
    if (selected.length === 0) { setError('Selecione pelo menos uma transação.'); return }
    setImporting(true)
    setError('')
    try {
      const res = await fetchAPI('/api/import/confirm', {
        method: 'POST',
        body: JSON.stringify({ transactions, account_id: accountId })
      })
      setImportedCount(res.data.imported)
      setStep('done')
    } catch {
      setError('Erro ao importar transações.')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setTransactions([])
    setBank('')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const selectedCount = transactions.filter(tx => tx.selected).length
  const duplicateCount = transactions.filter(tx => tx.isDuplicate).length
  const bankName = BANK_NAMES[bank] || bank
  const getCategoriesForType = (type: string) => categories.filter(c => c.type === type || c.type === 'both')

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importar Extrato</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Importe seu extrato CSV do Bradesco, Nubank ou Banco do Brasil</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {['Upload', 'Revisar', 'Concluído'].map((label, i) => {
          const done = (step === 'review' && i === 0) || (step === 'done' && i <= 1)
          const active = step === ['upload', 'review', 'done'][i]
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${active ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta de destino</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecione a conta</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
            <p className="text-xs ext-gray-t400 dark:text-gray-500 mt-1">As transações importadas serão vinculadas a esta conta</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo CSV do extrato</label>
            <div
              className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-3xl mb-2">📂</div>
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB — clique para trocar</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Clique para selecionar o arquivo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Apenas arquivos .csv</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-2">Como exportar o extrato:</p>
            <p><strong>Nubank:</strong> App → Extrato → Exportar → CSV</p>
            <p><strong>Bradesco:</strong> App → Extrato → Exportar → CSV</p>
            <p><strong>Banco do Brasil:</strong> Internet Banking → Extrato → Salvar como CSV</p>
            <p><strong>Inter:</strong> App → Extrato → Exportar planilha</p>
            <p><strong>Itaú:</strong> Internet Banking → Extrato → Exportar → OFX/CSV</p>
            <p><strong>C6 Bank:</strong> App → Extrato → Exportar CSV</p>
          </div>

          <button
            onClick={handlePreview}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Analisando arquivo...' : 'Analisar extrato'}
          </button>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Banco detectado: <span className="text-blue-600 dark:text-blue-400">{bankName}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {transactions.length} transações encontradas
                  {duplicateCount > 0 && ` · ${duplicateCount} já existem (desmarcadas)`}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  💡 Categorias sugeridas automaticamente — ajuste se necessário
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Selecionar todas</button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button onClick={() => toggleAll(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:underline">Desmarcar todas</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="max-h-[520px] overflow-y-auto">
              {transactions.map((tx, index) => (
                <div
                  key={index}
                  className={`p-3 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors ${
                    tx.isDuplicate ? 'opacity-40' : tx.selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={tx.selected}
                      disabled={tx.isDuplicate}
                      onChange={() => !tx.isDuplicate && toggleOne(index)}
                      className="w-4 h-4 text-blue-600 rounded shrink-0"
                    />
                    <div className={`w-1.5 h-8 rounded-full shrink-0 ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(tx.date)}
                        {tx.isDuplicate && <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">já importada</span>}
                      </p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                    </p>
                  </div>

                  {!tx.isDuplicate && (
                    <div className="mt-2 ml-11">
                      <select
                        value={tx.category_id || ''}
                        onChange={e => updateCategory(index, e.target.value)}
                        style={{ color: '#111827', backgroundColor: tx.category_id ? '#f0fdf4' : '#ffffff' }}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sem categoria</option>
                        {getCategoriesForType(tx.type).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {tx.category_name && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✨ Sugerido automaticamente</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importando...' : `Importar ${selectedCount} transação(ões)`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importação concluída!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{importedCount} transação(ões) importada(s) com sucesso</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Importar outro extrato
            </button>
            <a
              href="/transactions"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Ver transações
            </a>
          </div>
        </div>
      )}
    </div>
  )
}