function SearchPanel({
  categories,
  category,
  condition,
  conditions,
  query,
  setCategory,
  setCondition,
  setQuery,
}) {
  return (
    <section className="search-panel" aria-label="Product search controls">
      <label className="search-field">
        <span>Search marketplace</span>
        <input
          type="search"
          placeholder="Search headphones, tables, jackets..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <label>
        <span>Category</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Condition</span>
        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
        >
          {conditions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
    </section>
  )
}

export default SearchPanel
