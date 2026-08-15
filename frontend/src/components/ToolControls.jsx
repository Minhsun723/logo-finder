import { useLocale } from '../i18n.jsx';

export default function ToolControls({ categories, category, keyword, logoFilter, loading, onCategoryChange, onLoad, onKeywordChange, onOnlineSearch }) {
  const { t } = useLocale();
  return (
    <section className="tool-controls" aria-label={t('controls.label')}>
      <div className="control-group category-control">
        <label htmlFor="category">{t('controls.category')}</label>
        <div className="control-row">
          <select id="category" value={category} onChange={(event) => onCategoryChange(event.target.value)} disabled={loading}>
            {categories.map((item) => <option key={item.id} value={item.id}>{t(`category.${item.id}`) === `category.${item.id}` ? item.name : t(`category.${item.id}`)}</option>)}
          </select>
          <button type="button" className="button button-outline" onClick={onLoad} disabled={loading}>{t('controls.load')}</button>
        </div>
      </div>
      <form className="control-group search-control" onSubmit={(event) => { event.preventDefault(); onOnlineSearch(); }}>
        <label htmlFor="keyword">{t('controls.search')}</label>
        <div className="control-row">
          <input id="keyword" type="search" value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder={t('controls.placeholder')} autoComplete="off" />
          <button type="submit" className="button" disabled={loading || !keyword.trim()}>{t('controls.online')}</button>
        </div>
      </form>
      <div className="control-group filter-control">
        <span className="control-label" id="logo-filter-label">Logo</span>
        <div className="segmented" role="group" aria-labelledby="logo-filter-label">
          {[['all', 'filter.all'], ['with-logo', 'filter.with'], ['without-logo', 'filter.without']].map(([value, label]) => (
            <button type="button" key={value} className={logoFilter.value === value ? 'is-active' : ''} aria-pressed={logoFilter.value === value} onClick={() => logoFilter.set(value)}>{t(label)}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
