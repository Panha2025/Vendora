function Header({ onLogout, onPostItem, user }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Vendora home">
        <span className="brand-mark">S</span>
        <span>Vendora</span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <a href="#browse">Browse</a>
        <a href="#favorites">Favorites</a>
        <a href="#messages">Messages</a>
        <a href="#profile">Profile</a>
      </nav>

      <div className="header-actions">
        <span className="user-pill">{user?.name || 'Member'}</span>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Log out
        </button>
        <button className="primary-button" type="button" onClick={onPostItem}>
          Post item
        </button>
      </div>
    </header>
  )
}

export default Header
