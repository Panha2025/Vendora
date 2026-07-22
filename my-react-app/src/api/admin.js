const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const AUTH_KEY = 'secondloop_user'
const TOKEN_KEY = 'secondloop_token'

function getAdminHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    throw new Error('Please log in as admin first.')
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function sendAdminRequest(endpoint, options = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAdminHeaders(),
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new Error('Cannot connect to the server. Please start the backend.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(AUTH_KEY)
      throw new Error('Your admin session expired. Please log in again.')
    }

    throw new Error(data.message || 'Admin action failed.')
  }

  return data
}

export function getAdminOverview() {
  return sendAdminRequest('/admin/overview')
}

export function deleteAdminProduct(productId) {
  return sendAdminRequest(`/admin/products/${productId}`, {
    method: 'DELETE',
  })
}

export function deleteAdminUser(userId) {
  return sendAdminRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export function renameAdminCategory(category, newCategory) {
  return sendAdminRequest(`/admin/categories/${encodeURIComponent(category)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_category: newCategory }),
  })
}
