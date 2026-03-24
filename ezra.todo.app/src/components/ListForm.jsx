import { useState } from 'react'
import client from '../api/client.js'

export default function ListForm({ list, onSave, onCancel }) {
  const isEdit = Boolean(list)
  const [title, setTitle] = useState(list?.title || '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let res
      if (isEdit) {
        res = await client.put(`/api/lists/${list.id}`, { title: title.trim() })
      } else {
        res = await client.post('/api/lists', { title: title.trim() })
      }
      onSave(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save list.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-semibold text-gray-700">{isEdit ? 'Rename List' : 'New List'}</p>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="List title"
          maxLength={200}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  )
}
