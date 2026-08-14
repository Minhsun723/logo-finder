export default function ToolControls({ categories, category, keyword, logoFilter, loading, onCategoryChange, onLoad, onKeywordChange, onOnlineSearch }) {
  return (
    <section className="tool-controls" aria-label="搜尋條件">
      <div className="control-group category-control">
        <label htmlFor="category">分類</label>
        <div className="control-row">
          <select id="category" value={category} onChange={(event) => onCategoryChange(event.target.value)} disabled={loading}>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button type="button" className="button button-outline" onClick={onLoad} disabled={loading}>載入分類</button>
        </div>
      </div>
      <form className="control-group search-control" onSubmit={(event) => { event.preventDefault(); onOnlineSearch(); }}>
        <label htmlFor="keyword">搜尋作品</label>
        <div className="control-row">
          <input id="keyword" type="search" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="輸入作品名稱" autoComplete="off" />
          <button type="submit" className="button" disabled={loading || !keyword.trim()}>線上搜尋</button>
        </div>
      </form>
      <div className="control-group filter-control">
        <span className="control-label" id="logo-filter-label">Logo</span>
        <div className="segmented" role="group" aria-labelledby="logo-filter-label">
          {[['all', '全部'], ['with-logo', '有 Logo'], ['without-logo', '無 Logo']].map(([value, label]) => (
            <button type="button" key={value} className={logoFilter.value === value ? 'is-active' : ''} aria-pressed={logoFilter.value === value} onClick={() => logoFilter.set(value)}>{label}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
