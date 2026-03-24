import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client.js'

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [errorMsg, setErrorMsg] = useState(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No confirmation token provided.')
      return
    }

    if (calledRef.current) return
    calledRef.current = true

    async function confirm() {
      try {
        await client.get(`/api/auth/confirm-email?token=${encodeURIComponent(token)}`)
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setErrorMsg(err.response?.data?.error || 'Confirmation failed. The link may have expired.')
      }
    }
    confirm()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-gray-600">Confirming your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900">Email confirmed!</h2>
            <p className="text-sm text-gray-600">
              Your account is now active. You can sign in to start using Ezra Todos.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl">❌</div>
            <h2 className="text-xl font-bold text-gray-900">Confirmation failed</h2>
            <p className="text-sm text-gray-600">{errorMsg}</p>
            <Link
              to="/login"
              className="inline-block mt-2 text-sm text-indigo-600 hover:underline font-medium"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
