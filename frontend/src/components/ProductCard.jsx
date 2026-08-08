function ProductCard({
  canDelete = false,
  isFavorite,
  onDelete,
  onMessage,
  onShowDetail,
  onToggleFavorite,
  product,
  t = (key) => ({
    addToWishlist: 'Add to Wishlist',
    message: 'Message',
    moreDetail: 'More Detail',
    mostLiked: 'Most liked',
    removeFromWishlist: 'Remove from Wishlist',
    save: 'Save',
    saved: 'Saved',
  }[key] || key),
}) {
  return (
    <article className="dashboard-product-card">
      <button
        className="dashboard-product-image"
        type="button"
        onClick={() => onShowDetail(product)}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            decoding="async"
            loading="eager"
          />
        ) : (
          <span className="product-image-empty">No image</span>
        )}
        {product.status === 'Sold' && <span className="product-stock-badge">Out of stock</span>}
        {product.status === 'Reserved' && <span className="product-stock-badge reserved">Reserved</span>}
      </button>
      <div className="favorite-button-wrap">
        <button
          aria-label={isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
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

      <div className="dashboard-product-content">
        <button
          className="product-title-button"
          type="button"
          onClick={() => onShowDetail(product)}
        >
          {product.title}
        </button>
        <strong>${product.priceDisplay ?? product.price}</strong>

        <div className="dashboard-product-meta">
          <span>{product.location}</span>
          <span>{product.duration}</span>
        </div>

        <div className="dashboard-card-actions">
          <button type="button" onClick={() => onShowDetail(product)}>
            {t('moreDetail')}
          </button>
          {canDelete ? (
            <button
              className="danger-action"
              type="button"
              onClick={() => onDelete(product)}
            >
              Delete
            </button>
          ) : (
            <button type="button" onClick={() => onMessage(product)}>
              {t('message')}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
