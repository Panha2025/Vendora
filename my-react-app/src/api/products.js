const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'secondloop_token'

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function formatRelativeTime(dateValue) {
  if (!dateValue) {
    return 'Just posted'
  }

  const postedAt = new Date(dateValue)

  if (Number.isNaN(postedAt.getTime())) {
    return 'Just posted'
  }

  const seconds = Math.max(0, Math.floor((Date.now() - postedAt.getTime()) / 1000))

  if (seconds < 60) {
    return 'Just now'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return postedAt.toLocaleDateString()
}

export function mapApiProduct(product) {
  const images = product.images?.length ? product.images : []
  const seller = product.seller?.name || 'Seller'
  const postedAt = product.created_at || new Date().toISOString()
  const postedDate = new Date(postedAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return {
    id: `api-${product.id}`,
    apiId: product.id,
    title: product.title,
    category: product.category,
    condition: product.condition,
    location: product.location,
    price: Number(product.price),
    seller,
    sellerId: product.user_id,
    sellerSince: 'Marketplace seller',
    sellerRating: 'New seller',
    duration: formatRelativeTime(postedAt),
    createdAt: postedAt,
    status: product.status,
    posted: postedDate,
    usage: product.usage_duration || 'Not specified',
    description: product.description,
    image: images[0],
    images,
    details: {
      Category: product.category,
      ...(product.seller_phone ? { Phone: product.seller_phone } : {}),
      ...(product.seller_telegram ? { Telegram: product.seller_telegram } : {}),
    },
  }
}

export async function getProducts() {
  const token = getAuthToken()

  if (!token || token.startsWith('demo-')) {
    return []
  }

  const response = await fetch(`${API_URL}/products`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not load products')
  }

  const productList = data.products?.data || data.products || []

  return productList.map(mapApiProduct)
}

export async function createProduct(product, imageFiles = []) {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token || token.startsWith('demo-')) {
    return { product, demo: true }
  }

  const formData = new FormData()

  Object.entries(product).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })

  imageFiles.slice(0, 5).forEach((file) => {
    formData.append('images[]', file)
  })

  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Could not post item')
  }

  return {
    product: mapApiProduct(data.product),
  }
}
