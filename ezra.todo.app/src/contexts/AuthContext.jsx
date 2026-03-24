import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  })

  const login = useCallback(async (email, password) => {
    const response = await client.post('/api/auth/login', { email, password })
    const { email: userEmail, userId } = response.data
    const userObj = { id: userId, email: userEmail }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    return response.data
  }, [])

  const register = useCallback(async (email, password) => {
    const response = await client.post('/api/auth/register', { email, password })
    return response.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await client.post('/api/auth/logout')
    } catch {
      // Clear local state even if the server call fails
    }
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const value = { user, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
