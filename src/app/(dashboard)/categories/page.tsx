'use client'

import { useState, useEffect } from 'react'
import { categoriesAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  type: string
  color: string
  user_id: string | null
}

const emptyForm = { name: '', type: 'expense' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = async () => {
    try {
      const res = await categoriesAPI.list()
      setCategories(res.data || [])
    } catch {
      setError('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, type: cat.type })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await categoriesAPI.update(editing.id, form)
      } else {
        await categoriesAPI.create(form)
      }
      setShowModal(false)
      load()
    } catch {
      setError('Erro ao salvar categoria.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    try {
      await categoriesAPI.delete(id)
      load()
    } catch {
      alert('Erro ao excluir categoria.')
    }
  }

  const filtered = filterType
    ? categories.filter(c => c.type === filterType || c.type === 'both')
    : categories

  const income = filtered.filter(c => c.type === 'income' || c.type === 'both')
  const expense = filtered.filter(c => c.type === 'expense' || c.type === 'both')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize suas receitas e despesas</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nova categoria
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: 'Todas' },
          { value: 'expense', label: 'Despesas' },
          { value: 'income', label: 'Receitas' }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterType(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="space-y-6">
          {(!filterType || filterType === 'expense') && expense.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Despesas ({expense.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {expense.map(cat => (
                  <CategoryCard key={cat.id} cat={cat} onEdit={() => openEdit(cat)} onDelete={() => handleDelete(cat.id)} />
                ))}
              </div>
            </div>
          )}
          {(!filterType || filterType === 'income') && income.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Receitas ({income.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {income.map(cat => (
                  <CategoryCard key={cat.id} cat={cat} onEdit={() => openEdit(cat)} onDelete={() => handleDelete(cat.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editing ? 'Editar categoria' : 'Nova categoria'}
            </h2>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Alimentação, Salário..."
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <div className="flex gap-2">
                  {[
                    { value: 'expense', label: '↓ Despesa' },
                    { value: 'income', label: '↑ Receita' },
                    { value: 'both', label: '↕ Ambos' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        form.type === opt.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryCard({ cat, onEdit, onDelete }: { cat: Category; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{cat.name}</p>
      <div className="flex gap-3">
        <button onClick={onEdit} className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Editar</button>
        <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Excluir</button>
      </div>
    </div>
  )
}