import { useEffect, useMemo, useState } from 'react'
import { addFavorite, getFavoriteProducts, removeFavorite } from '../api/favorites'
import { getConversations, sendConversationMessage, startConversation } from '../api/messages'
import { formatRelativeTime, getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import { categories, conditions, products } from '../data/products'
import MessagesView from '../sections/MessagesView'
import ProductDetailView from '../sections/ProductDetailView'
import PostItemSection from '../sections/PostItemSection'

const sortOptions = ['Newest First', 'Price: Low to High', 'Price: High to Low']
const sidebarCategories = ['All', ...categories.filter((item) => item !== 'All')]
const LISTING_CACHE_KEY = 'secondloop_posted_listings'
const SERVER_LISTING_CACHE_KEY = 'secondloop_server_listings'

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
    <path key="1" d="M12 5v14" />,
    <path key="2" d="M5 12h14" />,
    <rect key="3" x="4" y="4" width="16" height="16" rx="3" />,
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

function saveServerListings(listings) {
  try {
    localStorage.setItem(SERVER_LISTING_CACHE_KEY, JSON.stringify(listings.slice(0, 50)))
  } catch {
    localStorage.removeItem(SERVER_LISTING_CACHE_KEY)
  }
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

function MarketplacePage({ onLogout, onRequireAuth, user }) {
  const [listings, setListings] = useState(() =>
    mergeListings(
      getCachedListings(SERVER_LISTING_CACHE_KEY),
      getCachedListings(),
      products,
    ),
  )
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
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notice, setNotice] = useState('')
  const isGuest = !user

  function requireAuthAction() {
    setIsTopMenuOpen(false)
    setNotice('Please sign in or register to use this feature.')
    onRequireAuth?.('register')
  }

  async function refreshListingsFromServer() {
    const savedProducts = await getProducts()
    saveServerListings(savedProducts)

    setListings(mergeListings(savedProducts, getCachedListings(), products))
    return savedProducts
  }

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

        setListings(mergeListings(savedProducts, getCachedListings(), products))

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
        || product.sellerId === user?.id
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
    user?.name,
  ])
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
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
        await refreshListingsFromServer()
      } catch {
        setNotice('Your item was posted. It is shown locally, but the server list could not refresh yet.')
      }
    }
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
    if (isGuest) {
      requireAuthAction()
      return
    }

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
    setIsPostFormOpen(true)
    window.setTimeout(() => {
      document.getElementById('post-item')?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function toggleCondition(value) {
    if (isGuest) {
      requireAuthAction()
      return
    }

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

    if (!product?.apiId) {
      return
    }

    const request = isFavorite
      ? removeFavorite(product.apiId)
      : addFavorite(product.apiId)

    request.catch(() => {
      setFavoriteIds((current) =>
        isFavorite
          ? [...current, productId]
          : current.filter((id) => id !== productId),
      )
      setNotice('Could not update your wishlist. Please try again.')
    })
  }

  function updateCategory(value) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    setSelectedProduct(null)
    setCategory(value)
    setCurrentPage(1)
  }

  function openProductDetail(product) {
    if (isGuest) {
      requireAuthAction()
      return
    }

    setSelectedProduct(product)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBackToDashboard() {
    setSelectedProduct(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showDashboardView(view) {
    if (isGuest) {
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
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <a className="dashboard-brand" href="#top">
          <span className="dashboard-logo">B</span>
          <span>
            SecondHand
            <small>Buy. Sell. Save.</small>
          </span>
        </a>

        <label className="dashboard-search">
          <span>Search</span>
          <input
            placeholder="Search for items, categories or brands..."
            readOnly={isGuest}
            type="search"
            value={query}
            onFocus={() => {
              if (isGuest) {
                requireAuthAction()
              }
            }}
            onChange={(event) => {
              if (isGuest) {
                requireAuthAction()
                return
              }

              setQuery(event.target.value)
              setCurrentPage(1)
            }}
          />
        </label>

        <div className="dashboard-actions">
          {isGuest ? (
            <button className="top-auth-button" type="button" onClick={requireAuthAction}>
              Sign in/register
            </button>
          ) : (
            <>
              <button type="button" onClick={scrollToPostItem}>
                <AppIcon name="post" />
                Post Item
              </button>
              <button className="account-button" type="button" onClick={onLogout}>
                <AppIcon name="account" />
                {user?.name || 'John Doe'}
              </button>
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
                    Sign in/register
                  </button>
                ) : (
                  <>
                    <strong>{user?.name || 'John Doe'}</strong>
                    <button type="button" onClick={() => showDashboardView('messages')}>
                      <AppIcon name="message" />
                      Messages
                    </button>
                    <button type="button" onClick={() => showDashboardView('favorites')}>
                      <AppIcon name="favorite" />
                      Wishlist
                    </button>
                    <button type="button" onClick={scrollToPostItem}>
                      <AppIcon name="post" />
                      Post Item
                    </button>
                    <button type="button" onClick={onLogout}>
                      Logout
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
          isFavorite={favoriteIds.includes(selectedProduct.id)}
          product={selectedProduct}
          relatedProducts={listings.filter((item) => item.id !== selectedProduct.id)}
          onBack={goBackToDashboard}
          onMessage={handleMessage}
          onShowDetail={openProductDetail}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="side-menu" aria-label="Dashboard menu">
            <button
              className={activeView === 'home' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('home')}
            >
              <AppIcon name="home" />
              Home
            </button>
            <button
              className={activeView === 'messages' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('messages')}
            >
              <AppIcon name="message" />
              My Messages
            </button>
            <button
              className={activeView === 'favorites' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('favorites')}
            >
              <AppIcon name="favorite" />
              My Favorites
            </button>
            <button
              className={activeView === 'listings' ? 'active' : ''}
              type="button"
              onClick={() => showDashboardView('listings')}
            >
              <AppIcon name="listing" />
              My Listings
            </button>
          </nav>

          {activeView !== 'messages' && (
            <>
              <div className="sidebar-block">
                <h3>Categories</h3>
                {sidebarCategories.map((item) => (
                  <button
                    className={`category-filter-button ${category === item ? 'active' : ''}`}
                    key={item}
                    type="button"
                    onClick={() => updateCategory(item)}
                  >
                    <CategoryIcon category={item} />
                    {item === 'All' ? 'All Categories' : item}
                  </button>
                ))}
              </div>

              <div className="sidebar-block">
                <h3>Filters</h3>
                <p>Price Range</p>
                <div className="price-filter">
                  <input
                    min="0"
                    placeholder="Min"
                    readOnly={isGuest}
                    type="number"
                    value={minPrice}
                    onFocus={() => {
                      if (isGuest) {
                        requireAuthAction()
                      }
                    }}
                    onChange={(event) => {
                      if (isGuest) {
                        requireAuthAction()
                        return
                      }

                      setMinPrice(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                  <span>to</span>
                  <input
                    min="0"
                    placeholder="Max"
                    readOnly={isGuest}
                    type="number"
                    value={maxPrice}
                    onFocus={() => {
                      if (isGuest) {
                        requireAuthAction()
                      }
                    }}
                    onChange={(event) => {
                      if (isGuest) {
                        requireAuthAction()
                        return
                      }

                      setMaxPrice(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <p>Condition</p>
                <div className="condition-list">
                  {conditions.map((item) => (
                    <label key={item}>
                      <input
                        checked={conditionFilters.includes(item)}
                        type="checkbox"
                        onChange={() => toggleCondition(item)}
                      />
                      <span>{item === 'All' ? 'All Conditions' : item}</span>
                    </label>
                  ))}
                </div>

                <button
                  className="filter-button"
                  type="button"
                  onClick={() => {
                    if (isGuest) {
                      requireAuthAction()
                      return
                    }

                    setNotice('Filters applied.')
                  }}
                >
                  Apply Filters
                </button>
                <button className="reset-button" type="button" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            </>
          )}
        </aside>

        <main className="dashboard-main" id="top">
          {activeView !== 'messages' && (
            <section className="dashboard-promo" aria-label="Marketplace promotions">
              <div className="promo-hero">
                <div>
                  <span className="promo-kicker">SecondHand deals</span>
                  <h1>Save more on pre-owned finds</h1>
                  <p>Claim marketplace perks, browse trusted sellers, and post your first item in minutes.</p>
                  <div className="promo-trust-row">
                    <span>Buyer protection tips</span>
                    <span>Local seller chat</span>
                    <span>Fresh listings daily</span>
                  </div>
                </div>
                <div className="promo-media">
                  <span className="promo-tag promo-tag-top">Up to 60% less</span>
                  <img
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85"
                    alt="Second-hand sofa promotion"
                  />
                  <span className="promo-tag promo-tag-bottom">Verified chat</span>
                </div>
              </div>

              <div className="promo-cards" aria-label="New user marketplace offers">
                <article className="promo-card promo-card-primary">
                  <span>New user exclusive</span>
                  <h2>Start buying and selling today</h2>
                  <button type="button" onClick={isGuest ? requireAuthAction : scrollToPostItem}>
                    {isGuest ? 'Sign in & claim all' : 'Post your first item'}
                  </button>
                </article>
                <article className="promo-card">
                  <strong>10% off</strong>
                  <span>Electronics picks</span>
                  <button type="button" onClick={() => updateCategory('Electronics')}>
                    Claim
                  </button>
                </article>
                <article className="promo-card">
                  <strong>5% off</strong>
                  <span>Home & Living finds</span>
                  <button type="button" onClick={() => updateCategory('Home & Living')}>
                    Claim
                  </button>
                </article>
                <article className="promo-card">
                  <strong>Free boost</strong>
                  <span>First seller listing</span>
                  <button type="button" onClick={scrollToPostItem}>
                    Claim
                  </button>
                </article>
              </div>
            </section>
          )}

          {notice && (
            <div className="dashboard-notice">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice('')}>
                Close
              </button>
            </div>
          )}

          {activeView !== 'messages' && (
            <section className="dashboard-toolbar" aria-label="Browse controls">
              <label className="sort-control">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onMouseDown={(event) => {
                    if (isGuest) {
                      event.preventDefault()
                      requireAuthAction()
                    }
                  }}
                  onChange={(event) => {
                    if (isGuest) {
                      requireAuthAction()
                      return
                    }

                    setSortBy(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
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

          {activeView !== 'messages' && (
            <section className="dashboard-grid" aria-label="Product listings">
              {paginatedProducts.map((product) => (
                <ProductCard
                  isFavorite={favoriteIds.includes(product.id)}
                key={product.id}
                product={product}
                onMessage={handleMessage}
                onShowDetail={openProductDetail}
                onToggleFavorite={toggleFavorite}
              />
              ))}
            </section>
          )}

          {activeView !== 'messages' && !filteredProducts.length && (
            <section className="plain-panel">
              <h2>No items found</h2>
              <p>Try changing your search, category, price, or condition filters.</p>
            </section>
          )}

          {activeView !== 'messages' && (
            <div className="pagination-row" aria-label="Pagination">
              <button
                disabled={currentPage === 1}
                type="button"
                onClick={() => {
                  if (isGuest) {
                    requireAuthAction()
                    return
                  }

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
                    if (isGuest) {
                      requireAuthAction()
                      return
                    }

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
                  if (isGuest) {
                    requireAuthAction()
                    return
                  }

                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }}
              >
                &gt;
              </button>
            </div>
          )}

          {isPostFormOpen && (
            <PostItemSection
              onCancel={() => setIsPostFormOpen(false)}
              onCreateListing={handleCreateListing}
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
