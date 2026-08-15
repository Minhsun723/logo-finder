import { useLocale } from '../i18n.jsx';

export default function ResultList({ items, selectedId, loading, emptyMessage, onSelect }) {
  const { t } = useLocale();
  const sourceLabel = (sources = []) => sources.map((source) => {
    const label = t(`source.${source}`);
    return label === `source.${source}` ? source : label;
  }).join(' + ');

  if (loading && !items.length) {
    return <div className="results-state" aria-live="polite"><span className="loader" />{t('status.fetching')}</div>;
  }
  if (!items.length) return <div className="results-state" aria-live="polite">{emptyMessage}</div>;
  return (
    <div className="result-list" role="listbox" aria-label={t('results.items')}>
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
