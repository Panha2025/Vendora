import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteAdminProduct,
  deleteAdminUser,
  getAdminOverview,
  renameAdminCategory,
} from '../api/admin'

const moneyFormatter = new Intl.NumberFormat(undefined, {
  currency: 'USD',
  maximumFractionDigits: 2,
  style: 'currency',
})

const statCards = [
  { key: 'users', labelKey: 'users', tone: 'blue' },
  { key: 'products', labelKey: 'products', tone: 'green' },
  { key: 'conversations', labelKey: 'chats', tone: 'violet' },
  { key: 'messages', labelKey: 'messages', tone: 'amber' },
  { key: 'unread_messages', labelKey: 'unread', tone: 'red' },
]

function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function AdminPage({ language, onLanguageChange, onLogout, t, user }) {
  const [overview, setOverview] = useState(null)
  const [activeTab, setActiveTab] = useState('products')
  const [query, setQuery] = useState('')
  const [categoryEdits, setCategoryEdits] = useState({})
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const refreshAdminOverview = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const data = await getAdminOverview()
      setOverview(data)
      setNotice('')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    getAdminOverview()
      .then((data) => {
        if (!isActive) {
          return
        }

        setOverview(data)
        setNotice('')
      })
      .catch((error) => {
        if (isActive) {
          setNotice(error.message)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const products = overview?.products || []
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return products
    }

    return products.filter((product) =>
      `${product.title} ${product.category} ${product.status} ${product.seller?.name || ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [overview?.products, query])

  const filteredUsers = useMemo(() => {
    const users = overview?.users || []
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return users
    }

    return users.filter((account) =>
      `${account.name} ${account.email} ${account.phone || ''} ${account.role}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [overview?.users, query])

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(`Remove "${product.title}" from the marketplace?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminProduct(product.id)
      setNotice(`Removed product: ${product.title}`)
      await refreshAdminOverview()
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function handleDeleteUser(account) {
    const confirmed = window.confirm(`Remove user "${account.name}" and their data?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteAdminUser(account.id)
      setNotice(`Removed user: ${account.name}`)
      await refreshAdminOverview()
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function handleRenameCategory(category) {
    const nextCategory = (categoryEdits[category] || '').trim()

    if (!nextCategory) {
      setNotice('Type a new category name first.')
      return
    }

    try {
      const result = await renameAdminCategory(category, nextCategory)
      setNotice(`${result.updated_products || 0} product boxes moved to ${nextCategory}.`)
      setCategoryEdits((current) => ({ ...current, [category]: '' }))
      await refreshAdminOverview()
    } catch (error) {
      setNotice(error.message)
    }
  }

  const stats = overview?.stats || {}

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div>
          <span className="admin-kicker">{t('secondHandAdmin')}</span>
          <h1>{t('adminTitle')}</h1>
        </div>
        <div className="admin-account">
          <label className="language-select admin-language-select">
            <span>{t('language')}</span>
            <select
              aria-label={t('language')}
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
            >
              <option value="en">&#x1F1FA;&#x1F1F8; English</option>
              <option value="km">&#x1F1F0;&#x1F1ED; Khmer</option>
              <option value="zh">&#x1F1E8;&#x1F1F3; &#x4E2D;&#x6587;</option>
            </select>
          </label>
          <span>{user?.name || 'Admin'}</span>
          <button type="button" onClick={onLogout}>
            {t('logout')}
          </button>
        </div>
      </header>

      <main className="admin-shell">
        <section className="admin-hero">
          <div>
            <p>{t('adminDashboard')}</p>
            <h2>{t('adminHeroText')}</h2>
          </div>
          <div className="admin-hero-visual" aria-hidden="true">
            <span className="admin-orbit one" />
            <span className="admin-orbit two" />
            <span className="admin-signal-card">
              <b>{stats.available_products || 0}</b>
              live listings
            </span>
            <span className="admin-signal-card secondary">
              <b>{stats.admins || 0}</b>
              admins
            </span>
          </div>
          <button type="button" onClick={refreshAdminOverview}>
            {t('refreshData')}
          </button>
        </section>

        {notice && (
          <div className="admin-notice">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')}>
              Close
            </button>
          </div>
        )}

        <section className="admin-stats" aria-label="Marketplace stats">
          {statCards.map((item, index) => (
            <article
              className={`admin-stat-card ${item.tone}`}
              key={item.key}
              style={{ '--stat-delay': `${index * 70}ms` }}
            >
              <span>{t(item.labelKey)}</span>
              <strong>{stats[item.key] || 0}</strong>
              <em />
            </article>
          ))}
        </section>

        <section className="admin-workspace">
          <div className="admin-tabs" aria-label="Admin sections">
            <button
              className={activeTab === 'products' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('products')}
            >
              {t('products')}
            </button>
            <button
              className={activeTab === 'users' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('users')}
            >
              {t('users')}
            </button>
            <button
              className={activeTab === 'categories' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('categories')}
            >
              {t('categories')}
            </button>
            <button
              className={activeTab === 'activity' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('activity')}
            >
              {t('activity')}
            </button>
          </div>

          <div className="admin-tools">
            <input
              placeholder={t('searchAdminData')}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="admin-empty">Loading admin data...</div>
          ) : (
            <>
              {activeTab === 'products' && (
                <div className="admin-table">
                  <div className="admin-table-head products">
                    <span>{t('products')}</span>
                    <span>{t('sellerInformation')}</span>
                    <span>{t('status')}</span>
                    <span>{t('price')}</span>
                    <span>{t('action')}</span>
                  </div>
                  {filteredProducts.map((product, index) => (
                    <div
                      className="admin-table-row products"
                      key={product.id}
                      style={{ '--row-delay': `${index * 26}ms` }}
                    >
                      <span>
                        <strong>{product.title}</strong>
                        <small>{product.category} - {formatDate(product.created_at)}</small>
                      </span>
                      <span>{product.seller?.name || 'Seller'}</span>
                      <span className={`admin-status ${String(product.status).toLowerCase()}`}>
                        {product.status}
                      </span>
                      <span>{formatMoney(product.price)}</span>
                      <button type="button" onClick={() => handleDeleteProduct(product)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="admin-table">
                  <div className="admin-table-head users">
                    <span>{t('users')}</span>
                    <span>{t('role')}</span>
                    <span>{t('products')}</span>
                    <span>{t('chats')}</span>
                    <span>{t('action')}</span>
                  </div>
                  {filteredUsers.map((account, index) => (
                    <div
                      className="admin-table-row users"
                      key={account.id}
                      style={{ '--row-delay': `${index * 26}ms` }}
                    >
                      <span>
                        <strong>{account.name}</strong>
                        <small>{account.email} {account.phone ? `- ${account.phone}` : ''}</small>
                      </span>
                      <span className={`admin-role ${account.role}`}>{account.role}</span>
                      <span>{account.products_count || 0}</span>
                      <span>
                        {(account.buyer_conversations_count || 0)
                          + (account.seller_conversations_count || 0)}
                      </span>
                      <button
                        disabled={account.role === 'admin' || account.id === user?.id}
                        type="button"
                        onClick={() => handleDeleteUser(account)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="admin-category-grid">
                  {(overview?.categories || []).map((item, index) => (
                    <article
                      key={item.category}
                      style={{ '--row-delay': `${index * 40}ms` }}
                    >
                      <span>{item.category}</span>
                      <strong>{item.products_count}</strong>
                      <small>active product boxes</small>
                      <div className="admin-category-edit">
                        <input
                          placeholder="Rename category"
                          value={categoryEdits[item.category] || ''}
                          onChange={(event) =>
                            setCategoryEdits((current) => ({
                              ...current,
                              [item.category]: event.target.value,
                            }))}
                        />
                        <button type="button" onClick={() => handleRenameCategory(item.category)}>
                          Rename
                        </button>
                      </div>
                    </article>
                  ))}
                  {!overview?.categories?.length && (
                    <div className="admin-empty">No categories yet.</div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="admin-table">
                  <div className="admin-table-head activity">
                    <span>{t('activity')}</span>
                    <span>{t('products')}</span>
                    <span>{t('messages')}</span>
                    <span>{t('updated')}</span>
                  </div>
                  {(overview?.conversations || []).map((conversation, index) => (
                    <div
                      className="admin-table-row activity"
                      key={conversation.id}
                      style={{ '--row-delay': `${index * 26}ms` }}
                    >
                      <span>
                        <strong>{conversation.buyer?.name || 'Buyer'}</strong>
                        <small>with {conversation.seller?.name || 'Seller'}</small>
                      </span>
                      <span>{conversation.product?.title || 'Deleted product'}</span>
                      <span>{conversation.messages_count || 0}</span>
                      <span>{formatDate(conversation.updated_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminPage
