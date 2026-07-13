import { useState } from 'react'
import ProductCard from '../components/ProductCard'

function ProductDetailView({
  isFavorite,
  onBack,
  onMessage,
  onShowDetail,
  onToggleFavorite,
  product,
  relatedProducts,
}) {
  const gallery = product.images?.length ? product.images : [product.image]
  const [activeImage, setActiveImage] = useState(gallery[0])

  return (
    <main className="product-detail-page">
      <button className="detail-back-button" type="button" onClick={onBack}>
        Back to products
      </button>

      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onBack}>
          Home
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
            <img src={activeImage} alt={product.title} />
            <button
              aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`favorite-button detail-favorite ${isFavorite ? 'active' : ''}`}
              type="button"
              onClick={() => onToggleFavorite(product.id)}
            >
              heart
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
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>

        <article className="detail-info">
          <p className="detail-category">{product.category}</p>
          <h1>{product.title}</h1>
          <div className="detail-price-row">
            <strong>${product.price}</strong>
            <span>In Stock</span>
          </div>
          <p className="detail-location">
            {product.location} - {product.duration}
          </p>

          <div className="detail-section">
            <h2>Description</h2>
            <p>{product.description}</p>
          </div>

          <div className="detail-section">
            <h2>Details</h2>
            <dl className="detail-list">
              <div>
                <dt>Condition</dt>
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
            <h2>Usage</h2>
            <p>{product.usage}</p>
          </div>

          <div className="detail-section">
            <h2>Posted</h2>
            <p>{product.posted}</p>
          </div>
        </article>

        <aside className="detail-sidebar">
          <section className="seller-card">
            <h2>Seller Information</h2>
            <div className="seller-profile">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
                alt={product.seller}
              />
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
            <button type="button" onClick={() => onMessage(product)}>
              Message Seller
            </button>
            <button type="button" onClick={() => onToggleFavorite(product.id)}>
              {isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </section>

          <section className="safety-card">
            <h2>Safety Tips</h2>
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
        <h2>You may also like</h2>
        {relatedProducts.length ? (
          <div className="related-grid">
            {relatedProducts.slice(0, 4).map((item) => (
              <ProductCard
                isFavorite={false}
                key={item.id}
                product={item}
                onMessage={onMessage}
                onShowDetail={onShowDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <p className="empty-related">
            More items will appear here after sellers post their listings.
          </p>
        )}
      </section>
    </main>
  )
}

export default ProductDetailView
