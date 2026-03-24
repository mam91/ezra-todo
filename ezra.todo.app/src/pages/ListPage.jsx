import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import client from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import TodoList from '../components/TodoList.jsx'

export default function ListPage() {
  const { listId } = useParams()

  const [list, setList] = useState(null)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingList, setEditingList] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  const fetchListData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, todosRes] = await Promise.all([
        client.get(`/api/lists/${listId}`),
        client.get(`/api/lists/${listId}/todos`),
      ])
      setList(listRes.data)
      setTodos(todosRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load list.')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchListData()
  }, [fetchListData])

  const handleTodoCreated = (newTodo) => {
    setTodos((prev) => [...prev, newTodo])
  }

  const handleTodoUpdate = (updated) => {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleTodoDelete = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const startEditing = () => {
    setEditTitle(list.title)
    setEditingList(true)
  }

  const cancelEditing = () => {
    setEditingList(false)
  }

  const saveList = async () => {
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      const res = await client.put(`/api/lists/${listId}`, {
        title: editTitle.trim(),
      })
      setList(res.data)
      setEditingList(false)
      setSidebarRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to update list:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleListKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveList() }
    if (e.key === 'Escape') cancelEditing()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} refreshKey={sidebarRefreshKey} />

        <main className="flex-1 md:ml-64 p-6 space-y-6 max-w-3xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchListData}
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* List header */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {editingList ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleListKeyDown}
                        placeholder="List title"
                        maxLength={200}
                        className="flex-1 min-w-0 text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
                      />
                      <button
                        onClick={saveList}
                        disabled={saving || !editTitle.trim()}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
                        aria-label="Save list"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        aria-label="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="text-2xl font-bold text-gray-900 truncate">{list.title}</h1>
                      <button
                        onClick={startEditing}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        aria-label="Rename list"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Todo list */}
              <TodoList
                todos={todos}
                listId={listId}
                onUpdate={handleTodoUpdate}
                onDelete={handleTodoDelete}
                onAdd={handleTodoCreated}
                canEdit={true}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
