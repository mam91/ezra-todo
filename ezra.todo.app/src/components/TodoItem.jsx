import { useState } from 'react'
import client from '../api/client.js'

export default function TodoItem({ todo, listId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)

  // Edit state
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description || '')
  const [dueDate, setDueDate] = useState(todo.dueDate ? todo.dueDate.slice(0, 10) : '')
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    if (toggling) return
    onUpdate({ ...todo, isCompleted: !todo.isCompleted })
    setToggling(true)
    try {
      const res = await client.patch(`/api/lists/${listId}/todos/${todo.id}/complete`)
      onUpdate(res.data)
    } catch (err) {
      onUpdate(todo)
      console.error('Toggle failed:', err)
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    onDelete(todo.id)
    try {
      await client.delete(`/api/lists/${listId}/todos/${todo.id}`)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await client.put(`/api/lists/${listId}/todos/${todo.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      onUpdate(res.data)
      setEditing(false)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(todo.title)
    setDescription(todo.description || '')
    setDueDate(todo.dueDate ? todo.dueDate.slice(0, 10) : '')
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border bg-white border-indigo-200 ring-1 ring-indigo-100">
        {/* Checkbox (non-interactive while editing) */}
        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          todo.isCompleted ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'
        }`}>
          {todo.isCompleted && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

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
            onClick={handleCancel}
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

  const formattedDue = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const isOverdue = todo.dueDate && !todo.isCompleted && new Date(todo.dueDate) < new Date()

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      todo.isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        aria-label={todo.isCompleted ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          todo.isCompleted
            ? 'border-indigo-500 bg-indigo-500'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {todo.isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className={`mt-0.5 text-xs ${todo.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
            {todo.description}
          </p>
        )}
        {formattedDue && (
          <p className={`mt-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {isOverdue ? '⚠ Overdue: ' : 'Due: '}{formattedDue}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          aria-label="Edit todo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
            aria-label="Delete todo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
