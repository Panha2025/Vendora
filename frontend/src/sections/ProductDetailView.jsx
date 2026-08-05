import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

function ProfileAvatar({ image, name }) {
  const initials = String(name || 'Seller')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'S'

  return (
    <span className="seller-avatar-circle" aria-hidden="true">
      {image ? (
        <img src={image} alt="" decoding="async" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  )
}

function ProductDetailView({
  canEdit,
  isFavorite,
  onBack,
  onDelete,
  onEdit,
  onMessage,
  onShowDetail,
  onToggleFavorite,
  product,
  relatedProducts,
  t,
}) {
  const gallery = product.images?.filter(Boolean).length
    ? product.images.filter(Boolean)
    : []
  const [activeImage, setActiveImage] = useState(gallery[0])

  useEffect(() => {
    setActiveImage(gallery[0])
  }, [gallery[0], product.id])

  return (
    <main className="product-detail-page">
      <button className="detail-back-button" type="button" onClick={onBack}>
        {t('backToProducts')}
      </button>

      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onBack}>
          {t('home')}
        </button>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <strong>{product.title}</strong>
      </nav>

      <section className="product-detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            {product.featured && <span className="featured-badge">Featured</span>}
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.title}
                decoding="async"
                fetchPriority="high"
                loading="eager"
              />
            ) : (
              <span className="product-image-empty detail-empty-image">No image</span>
            )}
            <button
              aria-label={isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
              className={`favorite-button detail-favorite ${isFavorite ? 'active' : ''}`}
              type="button"
              onClick={() => onToggleFavorite(product.id)}
            >
              <svg
                aria-hidden="true"
                className="favorite-icon"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z" />
              </svg>
            </button>
          </div>

          <div className="detail-thumbnails">
            {gallery.map((image) => (
              <button
                className={image === activeImage ? 'active' : ''}
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt="" decoding="async" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <article className="detail-info">
          <p className="detail-category">{product.category}</p>
          <h1>{product.title}</h1>
          <div className="detail-price-row">
            <strong>${product.price}</strong>
            <span>{t('inStock')}</span>
          </div>
          <p className="detail-location">
            {product.location} - {product.duration}
          </p>

          <div className="detail-section">
            <h2>{t('description')}</h2>
            <p>{product.description || t('noDescription')}</p>
          </div>

          <div className="detail-section">
            <h2>{t('details')}</h2>
            <dl className="detail-list">
              <div>
                <dt>{t('condition')}</dt>
                <dd>{product.condition}</dd>
              </div>
              {Object.entries(product.details || {}).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="detail-section">
            <h2>{t('usage')}</h2>
            <p>{product.usage}</p>
          </div>

          <div className="detail-section">
            <h2>{t('posted')}</h2>
            <p>{product.posted}</p>
          </div>
        </article>

        <aside className="detail-sidebar">
          <section className="seller-card">
            <h2>{t('sellerInformation')}</h2>
            <div className="seller-profile">
              <ProfileAvatar image={product.sellerAvatar} name={product.seller} />
              <div>
                <strong>{product.seller}</strong>
                <span>{product.sellerSince}</span>
                <span>{product.sellerRating}</span>
              </div>
            </div>
            {(product.details?.Phone || product.details?.Telegram) && (
              <div className="seller-contact">
                {product.details?.Phone && (
                  <span>
                    Phone: <strong>{product.details.Phone}</strong>
                  </span>
                )}
                {product.details?.Telegram && (
                  <span>
                    Telegram: <strong>{product.details.Telegram}</strong>
                  </span>
                )}
              </div>
            )}
          {!canEdit && (
            <button type="button" onClick={() => onMessage(product)}>
              {t('messageSeller')}
            </button>
          )}
          {canEdit && (
            <>
              <button type="button" onClick={() => onEdit(product)}>
                {t('editListing')}
              </button>
              <button
                className="danger-action"
                type="button"
                onClick={() => onDelete(product)}
              >
                Delete Listing
              </button>
            </>
          )}
          <button type="button" onClick={() => onToggleFavorite(product.id)}>
            {isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
          </button>
          </section>

          <section className="safety-card">
            <h2>{t('safetyTips')}</h2>
            <ul>
              <li>Meet in a safe public place</li>
              <li>Check the item before buying</li>
              <li>Pay after inspecting the item</li>
              <li>Report suspicious activity</li>
            </ul>
            <button type="button">Learn more</button>
          </section>
        </aside>
      </section>

      <section className="related-section">
        <h2>{t('youMayAlsoLike')}</h2>
        {relatedProducts.length ? (
          <div className="related-grid">
            {relatedProducts.slice(0, 4).map((item) => (
              <ProductCard
                canEdit={false}
                isFavorite={false}
                key={item.id}
                product={item}
                t={t}
                onEdit={onEdit}
                onMessage={onMessage}
                onShowDetail={onShowDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <p className="empty-related">
            More {product.category} items will appear here after sellers post their listings.
          </p>
        )}
      </section>
    </main>
  )
}

export default ProductDetailView
