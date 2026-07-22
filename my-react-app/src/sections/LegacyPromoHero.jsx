function LegacyPromoHero({ isGuest, requireAuthAction, scrollToPostItem, updateCategory }) {
  return (
    <section className="dashboard-promo" aria-label="Marketplace promotions">
      <div className="promo-hero">
        <div>
          <span className="promo-kicker">Vendora deals</span>
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
            decoding="async"
            fetchPriority="high"
            loading="eager"
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
  )
}

export default LegacyPromoHero
