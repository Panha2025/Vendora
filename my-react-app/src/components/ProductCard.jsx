function ProductCard({
  isFavorite,
  onMessage,
  onShowDetail,
  onToggleFavorite,
  product,
}) {
  return (
    <article className="dashboard-product-card">
      <button
        className="dashboard-product-image"
        type="button"
        onClick={() => onShowDetail(product)}
      >
        <img src={product.image} alt={product.title} />
      </button>
      <div className="favorite-button-wrap">
        <button
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          type="button"
          onClick={() => onToggleFavorite(product.id)}
        >
          {isFavorite ? 'Saved' : 'Save'}
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
        <strong>${product.price}</strong>

        <div className="dashboard-product-meta">
          <span>{product.location}</span>
          <span>{product.duration}</span>
        </div>

        <div className="dashboard-card-actions">
          <button type="button" onClick={() => onShowDetail(product)}>
            More Detail
          </button>
          <button type="button" onClick={() => onMessage(product)}>
            Message
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
