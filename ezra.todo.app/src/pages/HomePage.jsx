import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import ListForm from '../components/ListForm.jsx'

export default function HomePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showListForm, setShowListForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function redirectIfLists() {
      try {
        const res = await client.get('/api/lists')
        if (res.data && res.data.length > 0) {
          navigate(`/lists/${res.data[0].id}`, { replace: true })
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    redirectIfLists()
  }, [navigate])

  const handleListCreated = (newList) => {
    navigate(`/lists/${newList.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-6xl">📋</div>
            <h2 className="text-xl font-semibold text-gray-800">No lists yet</h2>
            <p className="text-sm text-gray-500">
              Create your first list to start tracking todos.
            </p>

            {showListForm ? (
              <ListForm
                onSave={handleListCreated}
                onCancel={() => setShowListForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowListForm(true)}
                className="mt-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Create my first list
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
