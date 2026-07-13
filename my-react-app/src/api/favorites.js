import { mapApiProduct } from './products'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'secondloop_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getHeaders() {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export async function getFavoriteProducts() {
  const token = getToken()

  if (!token) {
    return []
  }

  const response = await fetch(`${API_URL}/favorites`, {
    headers: getHeaders(),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not load wishlist')
  }

  return (data.products || []).map(mapApiProduct)
}

export async function addFavorite(productId) {
  const response = await fetch(`${API_URL}/favorites/${productId}`, {
    method: 'POST',
    headers: getHeaders(),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not save wishlist item')
  }

  return data
}

export async function removeFavorite(productId) {
  const response = await fetch(`${API_URL}/favorites/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not remove wishlist item')
  }

  return data
}
