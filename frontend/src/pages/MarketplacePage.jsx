import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { updateProfile } from '../api/auth'
import { addFavorite, getFavoriteProducts, removeFavorite } from '../api/favorites'
import {
  getConversations,
  markConversationRead,
  sendConversationMessage,
  startConversation,
} from '../api/messages'
import { deleteProduct, formatRelativeTime, getProducts } from '../api/products'
import vendoraLogo from '../assets/Vendora_img.png'
import ProductCard from '../components/ProductCard'
import ProfileCropper from '../components/ProfileCropper'
import { categories, conditions, products } from '../data/products'
import MessagesView from '../sections/MessagesView'
import ProductDetailView from '../sections/ProductDetailView'
import PostItemSection from '../sections/PostItemSection'

const sortOptions = ['Newest First', 'Most liked', 'Price: Low to High', 'Price: High to Low']
const sidebarCategories = ['All', ...categories.filter((item) => item !== 'All')]
const LISTING_CACHE_KEY = 'secondloop_posted_listings'
const SERVER_LISTING_CACHE_KEY = 'secondloop_server_listings_v2'
const PRODUCTS_PER_PAGE = 25

const categoryIconPaths = {
  All: [
    <path key="1" d="M4 4h6v6H4z" />,
    <path key="2" d="M14 4h6v6h-6z" />,
    <path key="3" d="M4 14h6v6H4z" />,
    <path key="4" d="M14 14h6v6h-6z" />,
  ],
  Electronics: [
    <rect key="1" x="3" y="5" width="18" height="12" rx="2" />,
    <path key="2" d="M8 21h8" />,
    <path key="3" d="M12 17v4" />,
  ],
  'Phones & Tablets': [
    <rect key="1" x="7" y="2.5" width="10" height="19" rx="2" />,
    <path key="2" d="M10 18h4" />,
  ],
  Laptops: [
    <path key="1" d="M5 5h14v10H5z" />,
    <path key="2" d="M3 19h18" />,
    <path key="3" d="M8 15l-1.5 4" />,
    <path key="4" d="M16 15l1.5 4" />,
  ],
  'Home & Living': [
    <path key="1" d="M3 11.5 12 4l9 7.5" />,
    <path key="2" d="M5.5 10.5V20h13v-9.5" />,
    <path key="3" d="M10 20v-6h4v6" />,
  ],
  Furniture: [
    <path key="1" d="M5 11h14a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2Z" />,
    <path key="2" d="M7 11V8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3" />,
    <path key="3" d="M5 17v3" />,
    <path key="4" d="M19 17v3" />,
  ],
  Fashion: [
    <path key="1" d="M9 4h6l2 3 3 1.5-2 4-2-1V20H8v-8.5l-2 1-2-4L7 7z" />,
    <path key="2" d="M9 4a3 3 0 0 0 6 0" />,
  ],
  Handmade: [
    <path key="1" d="M4 14.5h3.5l2.8 2.8a3 3 0 0 0 2.1.9H16a2 2 0 0 0 2-2v-.2" />,
    <path key="2" d="M7.5 14.5V9.2a1.7 1.7 0 0 1 3.4 0V13" />,
    <path key="3" d="M10.9 12.2V8a1.7 1.7 0 0 1 3.4 0v4.4" />,
    <path key="4" d="M14.3 12V9.5a1.7 1.7 0 0 1 3.4 0v5.7" />,
    <path key="5" d="M6 19.5h9.5c2.8 0 5-2.2 5-5V12" />,
    <path key="6" d="M19 4l.6 1.4L21 6l-1.4.6L19 8l-.6-1.4L17 6l1.4-.6z" />,
  ],
  Stationery: [
    <path key="1" d="M4 20h16" />,
    <path key="2" d="M8 16 18.5 5.5a2.1 2.1 0 0 1 3 3L11 19l-4 1z" />,
    <path key="3" d="m16.5 7.5 3 3" />,
    <path key="4" d="M5 8h6" />,
    <path key="5" d="M5 12h3" />,
  ],
  Toy: [
    <rect key="1" x="5" y="8" width="14" height="10" rx="2" />,
    <path key="2" d="M8 8V6h3v2" />,
    <path key="3" d="M13 8V6h3v2" />,
    <path key="4" d="M8 13h8" />,
  ],
  Sports: [
    <circle key="1" cx="12" cy="12" r="8.5" />,
    <path key="2" d="M5 10c3 1 5 1 7-1s4-2 7-1" />,
    <path key="3" d="M7 18c1-4 3-7 7-9" />,
    <path key="4" d="M16 20c-1-4-3-7-7-9" />,
  ],
  General: [
    <path key="1" d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />,
    <path key="2" d="m4 7.5 8 4.5 8-4.5" />,
    <path key="3" d="M12 12v9" />,
  ],
}

function CategoryIcon({ category }) {
  return (
    <svg
      aria-hidden="true"
      className="category-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {categoryIconPaths[category] || categoryIconPaths.General}
    </svg>
  )
}

const appIconPaths = {
  account: [
    <path key="1" d="M20 21a8 8 0 0 0-16 0" />,
    <circle key="2" cx="12" cy="8" r="4" />,
  ],
  camera: [
    <path key="1" d="M8.8 6.5 10.2 5h3.6l1.4 1.5H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h2.8Z" />,
    <circle key="2" cx="12" cy="12.6" r="3.1" />,
  ],
  favorite: [
    <path key="1" d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />,
  ],
  home: [
    <path key="1" d="M3 11.5 12 4l9 7.5" />,
    <path key="2" d="M5.5 10.5V20h13v-9.5" />,
    <path key="3" d="M10 20v-6h4v6" />,
  ],
  listing: [
    <path key="1" d="M6 3h9l3 3v15H6z" />,
    <path key="2" d="M15 3v4h4" />,
    <path key="3" d="M9 11h6" />,
    <path key="4" d="M9 15h6" />,
  ],
  message: [
    <path key="1" d="M4 5h16v11H8l-4 4z" />,
    <path key="2" d="M8 9h8" />,
    <path key="3" d="M8 12h5" />,
  ],
  post: [
    <path key="1" d="M4 5h8.5L20 12.5 12.5 20 4 11.5z" />,
    <circle key="2" cx="8" cy="9" r="1.4" />,
    <path key="3" d="M13.5 10.5v5" />,
    <path key="4" d="M11 13h5" />,
  ],
  settings: [
    <circle key="1" cx="12" cy="12" r="3" />,
    <path key="2" d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7.1 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />,
  ],
  logout: [
    <path key="1" d="M10 17l5-5-5-5" />,
    <path key="2" d="M15 12H3" />,
    <path key="3" d="M21 4v16" />,
  ],
  theme: [
    <path key="1" d="M12 3a7 7 0 1 0 7 7 5 5 0 0 1-7-7Z" />,
  ],
}

function AppIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      className="app-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {appIconPaths[name]}
    </svg>
  )
}

function UserAvatar({ user, label = user?.name || 'User' }) {
  const initials = String(label)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

  return (
    <span className="user-avatar-circle" aria-hidden="true">
      {user?.avatar ? (
        <img src={user.avatar} alt="" decoding="async" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  )
}

function AccountSettingsSection({ onUserUpdate, user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: null,
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [avatarCropTarget, setAvatarCropTarget] = useState(null)

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateAvatar(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      return
    }

    setAvatarCropTarget({
      file,
      preview: URL.createObjectURL(file),
    })
    event.target.value = ''
  }

  function saveAvatarCrop(file) {
    const preview = URL.createObjectURL(file)

    setForm((current) => ({ ...current, avatar: file }))
    setAvatarPreview((currentPreview) => {
      if (currentPreview && currentPreview !== user?.avatar) {
        URL.revokeObjectURL(currentPreview)
      }

      return preview
    })
    setAvatarCropTarget((current) => {
      if (current?.preview) {
        URL.revokeObjectURL(current.preview)
      }

      return null
    })
  }

  function cancelAvatarCrop() {
    setAvatarCropTarget((current) => {
      if (current?.preview) {
        URL.revokeObjectURL(current.preview)
      }

      return null
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const nextUser = await updateProfile(form)
      onUserUpdate?.(nextUser)
      setForm((current) => ({ ...current, avatar: null }))
      setAvatarPreview(nextUser.avatar || '')
      setMessage('Settings updated.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="settings-panel" aria-label="Account settings">
      <div className="settings-header">
        <div>
          <span>Account Settings</span>
          <h2>Profile details</h2>
        </div>
        <UserAvatar user={{ ...user, avatar: avatarPreview }} />
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-avatar-field">
          <span>Profile picture</span>
          <div className="settings-avatar-upload-control">
            <div className={`avatar-preview-circle settings-avatar-preview ${avatarPreview ? '' : 'avatar-empty-placeholder'}`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" />
              ) : (
                <AppIcon name="camera" />
              )}
            </div>
            <div>
              <strong>Upload profile photo</strong>
              <small>Use a clear square photo. You can crop it before saving.</small>
            </div>
          </div>
          <input
            accept="image/png,image/jpeg,image/jpg,image/webp"
            name="avatar"
            type="file"
            onChange={updateAvatar}
          />
        </label>

        <div className="settings-grid">
          <label>
            <span>Full name</span>
            <input name="name" value={form.name} onChange={updateField} required />
          </label>
          <label>
            <span>Phone number</span>
            <input name="phone" type="tel" value={form.phone} onChange={updateField} required />
          </label>
          <label>
            <span>Email address</span>
            <input value={user?.email || ''} disabled readOnly />
          </label>
        </div>

        {message && <p className="settings-message">{message}</p>}
        <button className="settings-save-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {avatarCropTarget && (
        <ProfileCropper
          fileName={avatarCropTarget.file.name}
          source={avatarCropTarget.preview}
          onCancel={cancelAvatarCrop}
          onSave={saveAvatarCrop}
        />
      )}
    </section>
  )
}

function getCachedListings(cacheKey = LISTING_CACHE_KEY) {
  const cachedListings = localStorage.getItem(cacheKey)

  if (!cachedListings) {
    return []
  }

  try {
    return JSON.parse(cachedListings)
  } catch {
    localStorage.removeItem(cacheKey)
    return []
  }
}

function saveCachedListing(listing) {
  try {
    const currentListings = getCachedListings()
    const withoutDuplicate = currentListings.filter((item) => item.id !== listing.id)

    localStorage.setItem(
      LISTING_CACHE_KEY,
      JSON.stringify([listing, ...withoutDuplicate].slice(0, 30)),
    )
  } catch {
    localStorage.removeItem(LISTING_CACHE_KEY)
  }
}

function removeCachedListing(listing) {
  try {
    const cacheKeys = [LISTING_CACHE_KEY, SERVER_LISTING_CACHE_KEY]
    const listingKey = listing.apiId ? `api-${listing.apiId}` : String(listing.id)

    cacheKeys.forEach((cacheKey) => {
      const currentListings = getCachedListings(cacheKey)
      const nextListings = currentListings.filter((item) => {
        const itemKey = item.apiId ? `api-${item.apiId}` : String(item.id)

        return itemKey !== listingKey
      })

      localStorage.setItem(cacheKey, JSON.stringify(nextListings))
    })
  } catch {
    localStorage.removeItem(LISTING_CACHE_KEY)
    localStorage.removeItem(SERVER_LISTING_CACHE_KEY)
  }
}

function saveServerListings(listings) {
  try {
    localStorage.setItem(SERVER_LISTING_CACHE_KEY, JSON.stringify(listings))
  } catch {
    localStorage.removeItem(SERVER_LISTING_CACHE_KEY)
  }
}

function getInstantListings() {
  return mergeListings(
    getCachedListings(),
    getCachedListings(SERVER_LISTING_CACHE_KEY),
  )
}

function mergeListings(...listingGroups) {
  const seen = new Set()

  return listingGroups.flat().filter((listing) => {
    const key = listing.apiId ? `api-${listing.apiId}` : String(listing.id)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  }).map((listing) => ({
    ...listing,
    duration: listing.createdAt ? formatRelativeTime(listing.createdAt) : listing.duration,
  }))
}

function getProductSortValue(product) {
  if (product.apiId) {
    return Number(product.apiId)
  }

  return Number(product.id) || 0
}

function isSameUserId(firstId, secondId) {
  return firstId != null && secondId != null && String(firstId) === String(secondId)
}

function translateCategory(t, item) {
  const categoryKeys = {
    All: 'allCategories',
    Electronics: 'categoryElectronics',
    'Phones & Tablets': 'categoryPhones',
    Laptops: 'categoryLaptops',
    'Home & Living': 'categoryHomeLiving',
    Furniture: 'categoryFurniture',
    Fashion: 'categoryFashion',
    Handmade: 'categoryHandmade',
    Stationery: 'categoryStationery',
    Toy: 'categoryToy',
    Sports: 'categorySports',
    General: 'categoryGeneral',
  }

  return t(categoryKeys[item]) || item
}

function translateCondition(t, item) {
  const conditionKeys = {
    All: 'allConditions',
    New: 'conditionNew',
    Used: 'conditionUsed',
  }

  return t(conditionKeys[item]) || item
}

function translateSort(t, item) {
  const sortKeys = {
    'Newest First': 'sortNewest',
    'Most liked': 'mostLiked',
    'Price: Low to High': 'sortLowHigh',
    'Price: High to Low': 'sortHighLow',
  }

  return t(sortKeys[item]) || item
}

function createConversation(product) {
  return {
    id: `conversation-${product.id}`,
    lastMessage: `Hi, is this ${product.title} still available?`,
    messages: [
      {
        id: `${product.id}-seller-1`,
        sender: 'seller',
        text: `Hi, is this ${product.title} still available?`,
        time: '10:30 AM',
      },
      {
        id: `${product.id}-me-1`,
        sender: 'me',
        text: "Yes, it's still available!",
        time: '10:32 AM',
      },
      {
        id: `${product.id}-seller-2`,
        sender: 'seller',
        text: 'Great! How long have you used it?',
        time: '10:33 AM',
      },
    ],
    product,
    seller: product.seller,
    time: '10:30 AM',
    unread: 1,
  }
}

function MarketplacePage({
  language,
  onLanguageChange,
  onLogout,
  onRequireAuth,
  onUserUpdate,
  t,
  user,
}) {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('secondloop_theme') || 'light',
  )
  const [listings, setListings] = useState(getInstantListings)
  const [conversations, setConversations] = useState(() =>
    products.length ? [createConversation(products[0])] : [],
  )
  const [activeConversationId, setActiveConversationId] = useState(() =>
    products.length ? `conversation-${products[0].id}` : null,
  )
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [conditionFilters, setConditionFilters] = useState(['All'])
  const [maxPrice, setMaxPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [sortBy, setSortBy] = useState('Newest First')
  const [activeView, setActiveView] = useState('home')
  const [currentPage, setCurrentPage] = useState(1)
  const [favoriteIds, setFavoriteIds] = useState([])
  const [isPostFormOpen, setIsPostFormOpen] = useState(false)
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false)
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [notice, setNotice] = useState('')
  const accountMenuRef = useRef(null)
  const isGuest = !user

  useEffect(() => {
    localStorage.setItem('secondloop_theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return undefined
    }

    function closeAccountMenu(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }
    }

    function closeAccountMenuOnScroll() {
      setIsAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeAccountMenu)
    window.addEventListener('scroll', closeAccountMenuOnScroll, true)

    return () => {
      document.removeEventListener('pointerdown', closeAccountMenu)
      window.removeEventListener('scroll', closeAccountMenuOnScroll, true)
    }
  }, [isAccountMenuOpen])

  function requireAuthAction() {
    setIsTopMenuOpen(false)
    setNotice('Please sign in or register to use this feature.')
    onRequireAuth?.('register')
  }

  const refreshListingsFromServer = useCallback(async ({ keepListings = [] } = {}) => {
    const savedProducts = await getProducts()
    saveServerListings(savedProducts)

    setListings(mergeListings(keepListings, savedProducts))
    return savedProducts
  }, [])

  const refreshConversations = useCallback(async ({ keepActive = true } = {}) => {
    if (isGuest) {
      return []
    }

    const savedConversations = await getConversations()

    setConversations(savedConversations)
    setActiveConversationId((currentId) => {
      if (keepActive && savedConversations.some((conversation) => conversation.id === currentId)) {
        return currentId
      }

      return savedConversations[0]?.id || null
    })

    return savedConversations
  }, [isGuest])

  useEffect(() => {
    let isActive = true

    Promise.allSettled(
      user
        ? [getProducts(), getFavoriteProducts(), getConversations()]
        : [getProducts(), Promise.resolve([]), Promise.resolve([])],
    )
      .then(([productsResult, favoritesResult, conversationsResult]) => {
        if (!isActive) {
          return
        }

        const savedProducts =
          productsResult.status === 'fulfilled' ? productsResult.value : []
        const savedFavorites =
          favoritesResult.status === 'fulfilled' ? favoritesResult.value : []
        const savedConversations =
          conversationsResult.status === 'fulfilled' ? conversationsResult.value : []

        if (productsResult.status === 'fulfilled') {
          saveServerListings(savedProducts)
        }

        if (productsResult.status === 'fulfilled') {
          setListings(mergeListings(savedProducts))
        }

        if (savedFavorites.length) {
          setFavoriteIds(savedFavorites.map((product) => product.id))
        }

        if (savedConversations.length) {
          setConversations(savedConversations)
          setActiveConversationId(savedConversations[0].id)
        }

        if (productsResult.status === 'rejected') {
          setNotice('Saved products could not load from the server, so local saved boxes are shown.')
        }
      })

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    if (isGuest || activeView !== 'messages') {
      return undefined
    }

    let isActive = true

    const refresh = () => {
      refreshConversations()
        .then(() => {
          if (isActive) {
            setNotice('')
          }
        })
        .catch(() => {
          if (isActive) {
            setNotice('Messages could not refresh. Please check the backend connection.')
          }
        })
    }

    refresh()
    const intervalId = window.setInterval(refresh, 3000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [activeView, isGuest, refreshConversations])

  const filteredProducts = useMemo(() => {
    const filtered = listings.filter((product) => {
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery = `${product.title} ${product.category} ${product.seller}`
        .toLowerCase()
        .includes(normalizedQuery)
      const matchesCategory = category === 'All' || product.category === category
      const matchesCondition =
        conditionFilters.includes('All')
        || conditionFilters.includes(product.condition)
      const matchesMinPrice = !minPrice || product.price >= Number(minPrice)
      const matchesMaxPrice = !maxPrice || product.price <= Number(maxPrice)
      const matchesFavoriteView =
        activeView !== 'favorites' || favoriteIds.includes(product.id)
      const matchesListingView =
        activeView !== 'listings'
        || isSameUserId(product.sellerId, user?.id)
        || product.seller === (user?.name || 'Seller')

      return (
        matchesQuery
        && matchesCategory
        && matchesCondition
        && matchesMinPrice
        && matchesMaxPrice
        && matchesFavoriteView
        && matchesListingView
      )
    })

    return filtered.sort((first, second) => {
      if (sortBy === 'Price: Low to High') {
        return first.price - second.price
      }

      if (sortBy === 'Price: High to Low') {
        return second.price - first.price
      }

      if (sortBy === 'Most liked') {
        return (second.favoriteCount || 0) - (first.favoriteCount || 0)
      }

      return getProductSortValue(second) - getProductSortValue(first)
    })
  }, [
    activeView,
    category,
    conditionFilters,
    favoriteIds,
    listings,
    maxPrice,
    minPrice,
    query,
    sortBy,
    user?.id,
    user?.name,
  ])
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  )
  const unreadMessageCount = conversations.reduce(
    (total, conversation) => total + Number(conversation.unread || 0),
    0,
  )

  async function handleCreateListing(listing) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    saveCachedListing(listing)
    setListings((current) => [listing, ...current])
    setActiveView('listings')
    setCurrentPage(1)
    setIsPostFormOpen(false)
    setNotice('Your item was posted and added to My Listings.')

    if (listing.apiId) {
      saveServerListings(mergeListings([listing], getCachedListings(SERVER_LISTING_CACHE_KEY)))

      try {
        await refreshListingsFromServer({ keepListings: [listing] })
      } catch {
        setNotice('Your item was posted. It is shown locally, but the server list could not refresh yet.')
      }
    }
  }

  function isOwnListing(product) {
    return Boolean(user && isSameUserId(product.sellerId, user.id))
  }

  function handleEditListing(product) {
    if (!isOwnListing(product)) {
      setNotice('Only the seller can edit this item.')
      return
    }

    setIsTopMenuOpen(false)
    setSelectedProduct(null)
    setEditingProduct(product)
    setIsPostFormOpen(true)
    window.setTimeout(() => {
      document.getElementById('post-item')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function handleUpdateListing(updatedProduct) {
    setListings((current) =>
      current.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product,
      ),
    )
    setSelectedProduct((current) =>
      current?.id === updatedProduct.id ? updatedProduct : current,
    )
    setEditingProduct(null)
    setIsPostFormOpen(false)
    setActiveView('listings')
    setNotice('Your listing was updated.')

    if (updatedProduct.apiId) {
      saveServerListings(mergeListings([updatedProduct], getCachedListings(SERVER_LISTING_CACHE_KEY)))
      refreshListingsFromServer({ keepListings: [updatedProduct] }).catch(() => null)
    }
  }

  async function handleDeleteListing(product) {
    if (!isOwnListing(product)) {
      setNotice('Only the seller can delete this item.')
      return
    }

    const confirmed = window.confirm(`Delete "${product.title}" from your listings?`)

    if (!confirmed) {
      return
    }

    try {
      if (product.apiId) {
        await deleteProduct(product.apiId)
      }

      removeCachedListing(product)
      setListings((current) => current.filter((item) => item.id !== product.id))
      setFavoriteIds((current) => current.filter((itemId) => itemId !== product.id))
      setSelectedProduct((current) => (current?.id === product.id ? null : current))
      setNotice('Your listing was deleted.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  function handleProfileUpdate(nextUser) {
    onUserUpdate?.(nextUser)
    setListings((current) =>
      current.map((product) =>
        isSameUserId(product.sellerId, nextUser.id)
          ? {
              ...product,
              seller: nextUser.name,
              sellerAvatar: nextUser.avatar,
              details: {
                ...(product.details || {}),
                Phone: nextUser.phone || product.details?.Phone,
              },
            }
          : product,
      ),
    )
    setSelectedProduct((current) =>
      current && isSameUserId(current.sellerId, nextUser.id)
        ? {
            ...current,
            seller: nextUser.name,
            sellerAvatar: nextUser.avatar,
            details: {
              ...(current.details || {}),
              Phone: nextUser.phone || current.details?.Phone,
            },
          }
        : current,
    )
  }

  async function handleMessage(product) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    const conversationId = `conversation-${product.id}`

    if (product.apiId) {
      try {
        const savedConversation = await startConversation(
          product.apiId,
          `Hi, is this ${product.title} still available?`,
        )

        setConversations((current) => {
          const withoutCurrent = current.filter(
            (conversation) => conversation.id !== savedConversation.id,
          )

          return [savedConversation, ...withoutCurrent]
        })
        setActiveConversationId(savedConversation.id)
        setSelectedProduct(null)
        setActiveView('messages')
        setNotice('')
        refreshConversations({ keepActive: true }).catch(() => null)
        return
      } catch {
        setNotice('Could not start this message. Please try again.')
        return
      }
    }

    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === conversationId)

      if (exists) {
        return current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unread: 0 }
            : conversation,
        )
      }

      return [{ ...createConversation(product), unread: 0 }, ...current]
    })

    setActiveConversationId(conversationId)
    setSelectedProduct(null)
    setActiveView('messages')
    setNotice('')
  }

  function handleOpenConversation(conversationId) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    setActiveConversationId(conversationId)
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: 0 }
          : conversation,
      ),
    )

    const conversation = conversations.find((item) => item.id === conversationId)

    if (conversation?.apiId) {
      markConversationRead(conversation.apiId)
        .then((savedConversation) => {
          setConversations((current) =>
            current.map((item) =>
              item.id === savedConversation.id ? savedConversation : item,
            ),
          )
        })
        .catch(() => null)
    }
  }

  async function handleSendMessage(conversationId, text) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    const existingConversation = conversations.find(
      (conversation) => conversation.id === conversationId,
    )

    if (existingConversation?.apiId) {
      try {
        const savedConversation = await sendConversationMessage(
          existingConversation.apiId,
          text,
        )

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === savedConversation.id
              ? savedConversation
              : conversation,
          ),
        )
        refreshConversations({ keepActive: true }).catch(() => null)
      } catch {
        setNotice('Could not send this message. Please try again.')
      }

      return
    }

    const now = new Date()
    const time = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: text,
              messages: [
                ...conversation.messages,
                {
                  id: `${conversationId}-${now.getTime()}`,
                  sender: 'me',
                  text,
                  time,
                },
              ],
              time,
              unread: 0,
            }
          : conversation,
      ),
    )
  }

  function resetFilters() {
    setSelectedProduct(null)
    setCategory('All')
    setConditionFilters(['All'])
    setCurrentPage(1)
    setMaxPrice('')
    setMinPrice('')
    setQuery('')
    setSortBy('Newest First')
  }

  function scrollToPostItem() {
    if (isGuest) {
      requireAuthAction()
      return
    }

    setIsTopMenuOpen(false)
    setSelectedProduct(null)
    setEditingProduct(null)
    setIsPostFormOpen(true)
    window.setTimeout(() => {
      document.getElementById('post-item')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function focusMarketplaceSearch() {
    setActiveView('home')
    setSelectedProduct(null)
    window.setTimeout(() => {
      document.getElementById('marketplace-search')?.focus()
      document.getElementById('browse-products')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function toggleCondition(value) {
    setCurrentPage(1)
    setConditionFilters((current) => {
      if (value === 'All') {
        return ['All']
      }

      const withoutAll = current.filter((item) => item !== 'All')
      const next = withoutAll.includes(value)
        ? withoutAll.filter((item) => item !== value)
        : [...withoutAll, value]

      return next.length ? next : ['All']
    })
  }

  function toggleFavorite(productId) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    const product = listings.find((item) => item.id === productId)
    const isFavorite = favoriteIds.includes(productId)

    setFavoriteIds((current) =>
      isFavorite
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
    setListings((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              favoriteCount: Math.max(
                0,
                Number(item.favoriteCount || 0) + (isFavorite ? -1 : 1),
              ),
            }
          : item,
      ),
    )
    setSelectedProduct((current) =>
      current?.id === productId
        ? {
            ...current,
            favoriteCount: Math.max(
              0,
              Number(current.favoriteCount || 0) + (isFavorite ? -1 : 1),
            ),
          }
        : current,
    )

    if (!product?.apiId) {
      return
    }

    const request = isFavorite
      ? removeFavorite(product.apiId)
      : addFavorite(product.apiId)

    request
      .then((data) => {
        if (data.favorite_count == null) {
          return
        }

        const favoriteCount = Number(data.favorite_count || 0)

        setListings((current) =>
          current.map((item) =>
            item.id === productId ? { ...item, favoriteCount } : item,
          ),
        )
        setSelectedProduct((current) =>
          current?.id === productId ? { ...current, favoriteCount } : current,
        )
      })
      .catch(() => {
      setFavoriteIds((current) =>
        isFavorite
          ? [...current, productId]
          : current.filter((id) => id !== productId),
      )
      setListings((current) =>
        current.map((item) =>
          item.id === productId
            ? {
                ...item,
                favoriteCount: Math.max(
                  0,
                  Number(item.favoriteCount || 0) + (isFavorite ? 1 : -1),
                ),
              }
            : item,
        ),
      )
      setNotice('Could not update your wishlist. Please try again.')
    })
  }

  function updateCategory(value) {
    setSelectedProduct(null)
    setCategory(value)
    setCurrentPage(1)
  }

  function openProductDetail(product) {
    setSelectedProduct(product)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBackToDashboard() {
    setSelectedProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showDashboardView(view) {
    if (isGuest && view !== 'home') {
      requireAuthAction()
      return
    }

    setIsTopMenuOpen(false)
    setSelectedProduct(null)
    setActiveView(view)
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`dashboard-shell ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <header className="dashboard-topbar">
        <a className="dashboard-brand" href="#top" aria-label="Vendora home">
          <span className="dashboard-logo" aria-hidden="true">
            <img className="vendora-logo" src={vendoraLogo} alt="" />
          </span>
          <span>
            Vendora
            <small>{t('buySellSave')}</small>
          </span>
        </a>

        <label className="dashboard-search">
          <span>{t('search')}</span>
          <input
            id="marketplace-search"
            placeholder={t('searchPlaceholder')}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setCurrentPage(1)
            }}
          />
        </label>

        <div className="dashboard-actions">
          <label className="language-select compact-language-select">
            <span>{t('language')}</span>
            <select
              aria-label={t('language')}
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
            >
              <option value="en">English</option>
              <option value="km">ខ្មែរ</option>
              <option value="zh">中文</option>
            </select>
          </label>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          >
            <AppIcon name="theme" />
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
          {isGuest ? (
            <button className="top-auth-button" type="button" onClick={requireAuthAction}>
              {t('signInRegister')}
            </button>
          ) : (
            <>
              <button type="button" onClick={scrollToPostItem}>
                <AppIcon name="post" />
                {t('postItem')}
              </button>
              <div
                className="account-menu-wrap"
                ref={accountMenuRef}
              >
                <button
                  aria-expanded={isAccountMenuOpen}
                  className="account-button"
                  type="button"
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                >
                  <UserAvatar user={user} />
                  {user?.name || 'John Doe'}
                </button>
                {isAccountMenuOpen && (
                  <div className="account-menu-panel">
                    <button className="account-menu-settings" type="button" onClick={() => showDashboardView('settings')}>
                      <AppIcon name="settings" />
                      Settings
                    </button>
                    <button className="account-menu-logout" type="button" onClick={onLogout}>
                      <AppIcon name="logout" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="responsive-top-controls">
          <div className="mobile-top-menu">
            <button
              aria-expanded={isTopMenuOpen}
              className="mobile-menu-toggle"
              type="button"
              onClick={() => setIsTopMenuOpen((open) => !open)}
            >
              Menu
            </button>
            {isTopMenuOpen && (
              <div className="mobile-menu-panel">
                {isGuest ? (
                  <button className="top-auth-button" type="button" onClick={requireAuthAction}>
                    {t('signInRegister')}
                  </button>
                ) : (
                  <>
                    <strong>{user?.name || 'John Doe'}</strong>
                    <button type="button" onClick={() => showDashboardView('messages')}>
                      <AppIcon name="message" />
                      {t('messages')}
                      {unreadMessageCount > 0 && (
                        <span className="notification-badge">{unreadMessageCount}</span>
                      )}
                    </button>
                    <button type="button" onClick={() => showDashboardView('favorites')}>
                      <AppIcon name="favorite" />
                      {t('wishlist')}
                    </button>
                    <button type="button" onClick={() => showDashboardView('settings')}>
                      <AppIcon name="settings" />
                      Settings
                    </button>
                    <button type="button" onClick={scrollToPostItem}>
                      <AppIcon name="post" />
                      {t('postItem')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    >
                      <AppIcon name="theme" />
                      {theme === 'dark' ? t('lightMode') : t('darkMode')}
                    </button>
                    <label className="language-select">
                      <span>{t('language')}</span>
                      <select
                        aria-label={t('language')}
                        value={language}
                        onChange={(event) => onLanguageChange(event.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="km">ខ្មែរ</option>
                        <option value="zh">中文</option>
                      </select>
                    </label>
                    <button type="button" onClick={onLogout}>
                      {t('logout')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {selectedProduct ? (
        <ProductDetailView
          canEdit={isOwnListing(selectedProduct)}
          isFavorite={favoriteIds.includes(selectedProduct.id)}
          product={selectedProduct}
          relatedProducts={listings.filter(
            (item) =>
              item.id !== selectedProduct.id
              && item.category === selectedProduct.category,
          )}
          onBack={goBackToDashboard}
          onDelete={handleDeleteListing}
          onEdit={handleEditListing}
          onMessage={handleMessage}
          onShowDetail={openProductDetail}
          onToggleFavorite={toggleFavorite}
          t={t}
        />
      ) : (
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="side-menu" aria-label="Dashboard menu">
            <button
              className={activeView === 'home' ? 'active' : ''}
              type="button"
                    onClick={() => {
                      showDashboardView('home')
                      setIsMobileOptionsOpen(false)
                    }}
            >
              <AppIcon name="home" />
              {t('home')}
            </button>
            <button
              className={activeView === 'messages' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('messages')}
            >
              <AppIcon name="message" />
              {t('myMessages')}
              {unreadMessageCount > 0 && (
                <span className="notification-badge">{unreadMessageCount}</span>
              )}
            </button>
            <button
              className={activeView === 'favorites' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('favorites')}
            >
              <AppIcon name="favorite" />
              {t('myFavorites')}
            </button>
            <button
              className={activeView === 'listings' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('listings')}
            >
              <AppIcon name="listing" />
              {t('myListings')}
            </button>
            <button
              className={activeView === 'settings' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('settings')}
            >
              <AppIcon name="settings" />
              Settings
            </button>
          </nav>

          {activeView !== 'messages' && activeView !== 'settings' && (
            <>
              <div className="sidebar-block">
                <h3>{t('categories')}</h3>
                {sidebarCategories.map((item) => (
                  <button
                    className={`category-filter-button ${category === item ? 'active' : ''}`}
                    key={item}
                    type="button"
                    onClick={() => updateCategory(item)}
                  >
                    <CategoryIcon category={item} />
                    {translateCategory(t, item)}
                  </button>
                ))}
              </div>

              <div className="sidebar-block">
                <h3>{t('filters')}</h3>
                <p>{t('priceRange')}</p>
                <div className="price-filter">
                  <input
                    min="0"
                    placeholder="Min"
                    type="number"
                    value={minPrice}
                    onChange={(event) => {
                      setMinPrice(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                  <span>to</span>
                  <input
                    min="0"
                    placeholder="Max"
                    type="number"
                    value={maxPrice}
                    onChange={(event) => {
                      setMaxPrice(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <p>{t('condition')}</p>
                <div className="condition-list">
                  {conditions.map((item) => (
                    <label key={item}>
                      <input
                        checked={conditionFilters.includes(item)}
                        type="checkbox"
                        onChange={() => toggleCondition(item)}
                      />
                      <span>{translateCondition(t, item)}</span>
                    </label>
                  ))}
                </div>

                <button
                  className="filter-button"
                  type="button"
                  onClick={() => {
                    setNotice('Filters applied.')
                  }}
                >
                  {t('applyFilters')}
                </button>
                <button className="reset-button" type="button" onClick={resetFilters}>
                  {t('resetFilters')}
                </button>
              </div>
            </>
          )}
        </aside>

        <main className="dashboard-main" id="top">
          {activeView !== 'messages' && activeView !== 'settings' && (
            <section className="dashboard-promo" aria-label="Marketplace promotions">
              <div className="promo-hero">
                <div className="promo-copy">
                  <h1>{t('yourTechStartsHere')}</h1>
                  <div className="promo-trust-row">
                    <span>{t('verifiedSellers')}</span>
                    <span>{t('fastLocalChat')}</span>
                  </div>
                </div>
                <div className="promo-media">
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=88"
                    alt="Electronics marketplace"
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                  />
                </div>
                <div className="promo-search-card">
                  <div className="promo-search-row">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('Most liked')
                        setCurrentPage(1)
                        document.getElementById('browse-products')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      {t('mostLiked')}
                    </button>
                    <button type="button" onClick={() => setSortBy('Newest First')}>
                      {t('newArrivals')}
                    </button>
                    <button type="button" onClick={resetFilters}>
                      {t('allPrices')}
                    </button>
                    <button type="button" onClick={focusMarketplaceSearch}>
                      {t('search')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeView !== 'messages' && activeView !== 'settings' && (
            <section className="mobile-browse-options" aria-label="Mobile browse options">
              <button
                aria-expanded={isMobileOptionsOpen}
                className="mobile-options-toggle"
                type="button"
                onClick={() => setIsMobileOptionsOpen((open) => !open)}
              >
                {t('options')}
                <span>{isMobileOptionsOpen ? '-' : '+'}</span>
              </button>

              {isMobileOptionsOpen && (
                <div className="mobile-options-panel">
                  <nav className="side-menu" aria-label="Mobile dashboard menu">
                    <button
                      className={activeView === 'home' ? 'active' : ''}
                      type="button"
                      onClick={() => showDashboardView('home')}
                    >
                      <AppIcon name="home" />
                      {t('home')}
                    </button>
                    <button
                      className={activeView === 'messages' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        showDashboardView('messages')
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      <AppIcon name="message" />
                      {t('myMessages')}
                      {unreadMessageCount > 0 && (
                        <span className="notification-badge">{unreadMessageCount}</span>
                      )}
                    </button>
                    <button
                      className={activeView === 'favorites' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        showDashboardView('favorites')
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      <AppIcon name="favorite" />
                      {t('myFavorites')}
                    </button>
                    <button
                      className={activeView === 'listings' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        showDashboardView('listings')
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      <AppIcon name="listing" />
                      {t('myListings')}
                    </button>
                    <button
                      className={activeView === 'settings' ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        showDashboardView('settings')
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      <AppIcon name="settings" />
                      Settings
                    </button>
                  </nav>

                  <div className="sidebar-block">
                    <h3>{t('categories')}</h3>
                    {sidebarCategories.map((item) => (
                      <button
                        className={`category-filter-button ${category === item ? 'active' : ''}`}
                        key={item}
                        type="button"
                        onClick={() => {
                          updateCategory(item)
                          setIsMobileOptionsOpen(false)
                        }}
                      >
                        <CategoryIcon category={item} />
                        {translateCategory(t, item)}
                      </button>
                    ))}
                  </div>

                  <div className="sidebar-block">
                    <h3>{t('filters')}</h3>
                    <p>{t('priceRange')}</p>
                    <div className="price-filter">
                      <input
                        min="0"
                        placeholder="Min"
                        type="number"
                        value={minPrice}
                        onChange={(event) => {
                          setMinPrice(event.target.value)
                          setCurrentPage(1)
                        }}
                      />
                      <span>to</span>
                      <input
                        min="0"
                        placeholder="Max"
                        type="number"
                        value={maxPrice}
                        onChange={(event) => {
                          setMaxPrice(event.target.value)
                          setCurrentPage(1)
                        }}
                      />
                    </div>

                    <p>{t('condition')}</p>
                    <div className="condition-list">
                      {conditions.map((item) => (
                        <label key={item}>
                          <input
                            checked={conditionFilters.includes(item)}
                            type="checkbox"
                            onChange={() => toggleCondition(item)}
                          />
                          <span>{translateCondition(t, item)}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      className="filter-button"
                      type="button"
                      onClick={() => {
                        setNotice('Filters applied.')
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      {t('applyFilters')}
                    </button>
                    <button
                      className="reset-button"
                      type="button"
                      onClick={() => {
                        resetFilters()
                        setIsMobileOptionsOpen(false)
                      }}
                    >
                      {t('resetFilters')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {notice && (
            <div className="dashboard-notice">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice('')}>
                {t('close')}
              </button>
            </div>
          )}

          {activeView !== 'messages' && activeView !== 'settings' && (
            <section className="dashboard-toolbar" aria-label="Browse controls">
              <label className="sort-control">
                <span>{t('sortBy')}</span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>{translateSort(t, option)}</option>
                  ))}
                </select>
              </label>
            </section>
          )}

          {activeView === 'messages' && (
            <MessagesView
              activeConversationId={activeConversationId}
              conversations={conversations}
              onOpenConversation={handleOpenConversation}
              onSendMessage={handleSendMessage}
              onShowListing={openProductDetail}
            />
          )}

          {activeView === 'settings' && (
            <AccountSettingsSection
              onUserUpdate={handleProfileUpdate}
              user={user}
            />
          )}

          {activeView !== 'messages' && activeView !== 'settings' && (
            <section className="dashboard-grid" id="browse-products" aria-label="Product listings">
              {paginatedProducts.map((product) => (
                <ProductCard
                  canDelete={isOwnListing(product)}
                  isFavorite={favoriteIds.includes(product.id)}
                  key={product.id}
                  product={product}
                  t={t}
                  onDelete={handleDeleteListing}
                  onMessage={handleMessage}
                  onShowDetail={openProductDetail}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </section>
          )}

          {activeView !== 'messages' && activeView !== 'settings' && !filteredProducts.length && (
            <section className="plain-panel">
              <h2>{t('noItemsFound')}</h2>
              <p>Try changing your search, category, price, or condition filters.</p>
            </section>
          )}

          {activeView !== 'messages' && activeView !== 'settings' && (
            <div className="pagination-row" aria-label="Pagination">
              <button
                disabled={currentPage === 1}
                type="button"
                onClick={() => {
                  setCurrentPage((page) => Math.max(1, page - 1))
                }}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  className={currentPage === index + 1 ? 'active' : ''}
                  key={index + 1}
                  type="button"
                  onClick={() => {
                    setCurrentPage(index + 1)
                  }}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                type="button"
                onClick={() => {
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }}
              >
                &gt;
              </button>
            </div>
          )}

          {isPostFormOpen && (
            <PostItemSection
              editingProduct={editingProduct}
              onCancel={() => {
                setEditingProduct(null)
                setIsPostFormOpen(false)
              }}
              onCreateListing={handleCreateListing}
              onUpdateListing={handleUpdateListing}
              user={user}
            />
          )}
        </main>
      </div>
      )}
    </div>
  )
}

export default MarketplacePage
