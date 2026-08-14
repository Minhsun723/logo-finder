function sourceLabel(sources = []) {
  const labels = { albumList: '作品列表', tv_common: 'TV 分類', search: '線上搜尋' };
  return sources.map((source) => labels[source] || source).join(' + ');
}

export default function ResultList({ items, selectedId, loading, emptyMessage, onSelect }) {
  if (loading && !items.length) {
    return <div className="results-state" aria-live="polite"><span className="loader" />正在取得作品資料</div>;
  }
  if (!items.length) return <div className="results-state" aria-live="polite">{emptyMessage}</div>;
  return (
    <div className="result-list" role="listbox" aria-label="作品結果">
      {items.map((item, index) => (
        <button
          type="button"
          className={`result-item${selectedId === item.id ? ' is-selected' : ''}`}
          key={`${item.id}-${index}`}
          role="option"
          aria-selected={selectedId === item.id}
          onClick={() => onSelect(item)}
        >
          <span className="result-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="result-title"><strong>{item.name}</strong><small>{sourceLabel(item.source)}</small></span>
          <span className={`logo-status${item.logo ? ' has-logo' : ''}`}>{item.logo ? 'Logo' : '—'}</span>
          <span className="result-arrow" aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
  );
}
