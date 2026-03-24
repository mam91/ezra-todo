import { useState } from 'react'
import client from '../api/client.js'
import TodoItem from './TodoItem.jsx'

const FILTERS = ['All', 'Active', 'Completed']

function NewTodoRow({ listId, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await client.post(`/api/lists/${listId}/todos`, {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      onSave(res.data)
    } catch (err) {
      console.error('Failed to create todo:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border bg-white border-indigo-200 ring-1 ring-indigo-100">
      {/* Placeholder checkbox */}
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200" />

      {/* Inline inputs */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="w-full text-sm font-medium text-gray-800 placeholder-gray-300 bg-transparent border-none outline-none"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          className="w-full text-xs text-gray-500 placeholder-gray-300 bg-transparent border-none outline-none"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-xs text-gray-400 bg-transparent border-none outline-none"
        />
      </div>

      {/* Save / Cancel */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
          aria-label="Save todo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Cancel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function TodoList({ todos, listId, onUpdate, onDelete, onAdd, canEdit }) {
  const [filter, setFilter] = useState('All')
  const [addingNew, setAddingNew] = useState(false)

  const filtered = todos.filter((t) => {
    if (filter === 'Active') return !t.isCompleted
    if (filter === 'Completed') return t.isCompleted
    return true
  })

  const completedCount = todos.filter((t) => t.isCompleted).length
  const progressPct = todos.length > 0 ? (completedCount / todos.length) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {completedCount}/{todos.length} done
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 && !addingNew ? (
        <div className="py-10 text-center text-sm text-gray-400">
          {filter === 'All' ? 'No todos yet.' : `No ${filter.toLowerCase()} todos.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              listId={listId}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Inline new todo row */}
      {addingNew && (
        <NewTodoRow
          listId={listId}
          onSave={(newTodo) => { onAdd(newTodo); setAddingNew(false) }}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Add button */}
      {canEdit && !addingNew && (
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add todo
        </button>
      )}
    </div>
  )
}
