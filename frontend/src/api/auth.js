const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const AUTH_KEY = 'secondloop_user'
const TOKEN_KEY = 'secondloop_token'

function isGitHubPagesDemo() {
  return window.location.hostname.endsWith('github.io')
}

function createDemoSession(payload) {
  return {
    token: `demo-${Date.now()}`,
    user: {
      id: `demo-${Date.now()}`,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'Demo Seller',
      role: 'user',
    },
  }
}

function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

function consumeOAuthRedirectSession() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('oauth_token')
  const encodedUser = params.get('oauth_user')

  if (!token || !encodedUser) {
    return null
  }

  try {
    const user = JSON.parse(atob(decodeURIComponent(encodedUser)))
    saveSession({ token, user })
    window.history.replaceState({}, document.title, window.location.pathname)
    return user
  } catch {
    return null
  }
}

async function sendAuthRequest(endpoint, payload) {
  let response

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    if (isGitHubPagesDemo()) {
      return createDemoSession(payload)
    }

    throw new Error('Cannot connect to the server. Please start the backend.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const firstFieldError = data.errors
      ? Object.values(data.errors).flat().at(0)
      : null
    const message = firstFieldError || data.message || 'Authentication failed'

    throw new Error(getFriendlyAuthError(message))
  }

  return data
}

function getFriendlyAuthError(message) {
  const lowerMessage = String(message).toLowerCase()

  if (
    lowerMessage.includes('could not find driver')
    || lowerMessage.includes('connection:')
    || lowerMessage.includes('database')
    || lowerMessage.includes('sql')
    || lowerMessage.includes('pdo')
  ) {
    return 'The server is not ready yet. Please try again in a moment.'
  }

  return message
}

export function getStoredUser() {
  const oauthUser = consumeOAuthRedirectSession()

  if (oauthUser) {
    return oauthUser
  }

  const token = localStorage.getItem(TOKEN_KEY)

  if (token?.startsWith('social-')) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(AUTH_KEY)
    return null
  }

  const user = localStorage.getItem(AUTH_KEY)
  return user ? JSON.parse(user) : null
}

export async function loginUser(payload) {
  const session = await sendAuthRequest('/login', payload)
  saveSession(session)
  return session
}

export async function registerUser(payload) {
  const session = await sendAuthRequest('/register', payload)
  saveSession(session)
  return session
}

export async function socialLoginUser(provider) {
  const normalizedProvider = provider.toLowerCase()
  const response = await fetch(`${API_URL}/auth/${normalizedProvider}/redirect`, {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || `${provider} login is not configured yet.`)
  }

  window.location.assign(data.url)
  return new Promise(() => {})
}

export async function logoutUser() {
  const token = localStorage.getItem(TOKEN_KEY)

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(AUTH_KEY)

  if (token && !token.startsWith('demo-')) {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null)
  }
}
