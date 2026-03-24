class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || 'Request failed')
    this.response = { status, data }
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(method, url, body) {
  const headers = { 'Content-Type': 'application/json' }

  const options = { method, headers, credentials: 'include' }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(`${BASE_URL}${url}`, options)

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const isAuthEndpoint = url.includes('/api/auth/')
    if (res.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw new ApiError(res.status, data)
  }

  return { data }
}

const client = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url),
}

export default client
