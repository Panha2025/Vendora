const listingRows = ['MacBook Air M1', 'Coffee Table', 'Denim Jacket']

function SellerSection() {
  return (
    <section className="split-section" id="sell">
      <div>
        <p className="eyebrow">Seller dashboard</p>
        <h2>List faster, manage smarter.</h2>
        <p>
          Sellers can publish multiple photos, set availability, respond to
          buyers, and track listing performance from one tidy workspace.
        </p>
      </div>

      <div className="dashboard-preview" aria-label="Seller dashboard preview">
        <div className="dashboard-top">
          <span>My Listings</span>
          <strong>$1,392 active value</strong>
        </div>

        {listingRows.map((item, index) => (
          <div className="dashboard-row" key={item}>
            <span>{item}</span>
            <progress value={80 - index * 18} max="100" />
            <strong>{index === 1 ? 'Reserved' : 'Live'}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SellerSection
