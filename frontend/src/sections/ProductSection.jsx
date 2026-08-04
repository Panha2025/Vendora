import ProductCard from '../components/ProductCard'

function ProductSection({ products }) {
  return (
    <section className="section" id="browse" aria-labelledby="browse-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fresh finds</p>
          <h2 id="browse-title">Available near you</h2>
        </div>
        <p>{products.length} matching items</p>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  )
}

export default ProductSection
