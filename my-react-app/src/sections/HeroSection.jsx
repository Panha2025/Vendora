function HeroSection() {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Trusted second-hand marketplace</p>
        <h1 id="hero-title">Find pre-loved pieces with real stories.</h1>
        <p className="hero-text">
          Browse quality used items, chat with local sellers, and give great
          products another life through a safer, cleaner marketplace.
        </p>

        <div className="hero-actions">
          <a className="primary-button large" href="#browse">
            Start browsing
          </a>
          <a className="secondary-button large" href="#sell">
            Sell an item
          </a>
        </div>

        <div className="trust-row" aria-label="Marketplace statistics">
          <span>
            <strong>12k+</strong> listings
          </span>
          <span>
            <strong>4.8/5</strong> seller rating
          </span>
          <span>
            <strong>24h</strong> report review
          </span>
        </div>
      </div>

      <div className="hero-showcase" aria-label="Featured marketplace item">
        <img
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80"
          alt="Warm living room furniture listed for sale"
        />
        <div className="floating-listing">
          <span>Featured</span>
          <strong>Scandinavian Lounge Chair</strong>
          <p>$120 - Like New - Phnom Penh</p>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
