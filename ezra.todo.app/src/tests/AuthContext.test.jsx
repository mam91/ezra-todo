import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx'
import client from '../api/client.js'

vi.mock('../api/client.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

function AuthConsumer({ onRender }) {
  const auth = useAuth()
  onRender(auth)
  return (
    <div>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <button onClick={() => auth.login('test@example.com', 'password123')}>Login</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  )
}

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('starts with no user when localStorage is empty', () => {
    let capturedAuth
    renderWithProviders(<AuthConsumer onRender={(a) => { capturedAuth = a }} />)

    expect(screen.getByTestId('user-email').textContent).toBe('none')
    expect(capturedAuth.user).toBeNull()
  })

  it('login sets user from response', async () => {
    const mockResponse = {
      data: {
        email: 'test@example.com',
        userId: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
        expiresAt: new Date().toISOString(),
      },
    }
    client.post.mockResolvedValueOnce(mockResponse)

    renderWithProviders(<AuthConsumer onRender={() => {}} />)

    await act(async () => {
      await userEvent.click(screen.getByText('Login'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('test@example.com')
    })

    expect(JSON.parse(localStorage.getItem('user'))).toEqual({
      id: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
      email: 'test@example.com',
    })
    expect(client.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('logout clears user and localStorage, calls backend', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'f6a7b8c9-d0e1-2345-f012-456789012345', email: 'user@example.com' }))
    client.post.mockResolvedValueOnce({})

    renderWithProviders(<AuthConsumer onRender={() => {}} />)

    await act(async () => {
      await userEvent.click(screen.getByText('Logout'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-email').textContent).toBe('none')
    })

    expect(localStorage.getItem('user')).toBeNull()
    expect(client.post).toHaveBeenCalledWith('/api/auth/logout')
  })

  it('restores user from localStorage on mount', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'a7b8c9d0-e1f2-3456-0123-567890123456', email: 'saved@example.com' }))

    renderWithProviders(<AuthConsumer onRender={() => {}} />)

    expect(screen.getByTestId('user-email').textContent).toBe('saved@example.com')
  })

  it('shows login failure error when API returns error', async () => {
    const apiError = { response: { status: 401, data: { error: 'Invalid credentials.' } } }
    client.post.mockRejectedValueOnce(apiError)

    let capturedAuth
    renderWithProviders(<AuthConsumer onRender={(a) => { capturedAuth = a }} />)

    await act(async () => {
      try {
        await capturedAuth.login('bad@example.com', 'wrongpass')
      } catch {
        // expected to throw
      }
    })

    expect(localStorage.getItem('user')).toBeNull()
    expect(screen.getByTestId('user-email').textContent).toBe('none')
  })
})
