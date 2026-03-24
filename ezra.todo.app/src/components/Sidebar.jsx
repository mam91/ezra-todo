import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import client from '../api/client.js'

export default function Sidebar({ isOpen, onClose, refreshKey }) {
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchLists = useCallback(async () => {
    try {
      setError(null)
      const res = await client.get('/api/lists')
      setLists(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lists.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists, refreshKey])

  const handleDelete = async (listId) => {
    try {
      await client.delete(`/api/lists/${listId}`)
      setLists((prev) => prev.filter((l) => l.id !== listId))
      setDeleteConfirm(null)
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete list.')
    }
  }

  const handleListCreated = (newList) => {
    setLists((prev) => [...prev, newList])
    setCreatingNew(false)
    navigate(`/lists/${newList.id}`)
  }

  const sidebarClass = `
    fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-white border-r border-gray-200 pt-14
    transform transition-transform duration-200 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0
  `

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClass}>
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {loading && (
            <p className="text-sm text-gray-400 px-2">Loading lists…</p>
          )}
          {error && (
            <p className="text-sm text-red-500 px-2">{error}</p>
          )}

          {!loading && (
            <ListSection
              title="My Lists"
              lists={lists}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              onDelete={handleDelete}
              onClose={onClose}
              creatingNew={creatingNew}
              onCreateSave={handleListCreated}
              onCreateCancel={() => setCreatingNew(false)}
            />
          )}
        </div>

        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={() => setCreatingNew(true)}
            disabled={creatingNew}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New List
          </button>
        </div>
      </aside>
    </>
  )
}

function NewListRow({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await client.post('/api/lists', {
        title: title.trim(),
      })
      onSave(res.data)
    } catch (err) {
      console.error('Failed to create list:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <li className="relative flex items-center min-w-0">
      <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 min-w-0">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="List title"
          maxLength={200}
          className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
        />
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="p-1 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-30"
          aria-label="Save list"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          onClick={onCancel}
          className="p-1 rounded text-gray-400 hover:text-gray-600"
          aria-label="Cancel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  )
}

function ListSection({ title, lists, deleteConfirm, setDeleteConfirm, onDelete, onClose, creatingNew, onCreateSave, onCreateCancel }) {
  return (
    <div>
      <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      {lists.length === 0 && !creatingNew && (
        <p className="px-2 text-sm text-gray-400 italic">None yet</p>
      )}
      <ul className="space-y-0.5">
        {lists.map((list) => (
          <li key={list.id} className="group relative flex items-center">
            <NavLink
              to={`/lists/${list.id}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex-1 flex items-center gap-2 px-2 py-2 rounded-md text-sm truncate transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="truncate">{list.title}</span>
            </NavLink>

            {deleteConfirm === list.id ? (
              <div className="flex items-center gap-1 pr-1">
                <button
                  onClick={() => onDelete(list.id)}
                  className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(list.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                aria-label="Delete list"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </li>
        ))}
        {creatingNew && (
          <NewListRow onSave={onCreateSave} onCancel={onCreateCancel} />
        )}
      </ul>
    </div>
  )
}
