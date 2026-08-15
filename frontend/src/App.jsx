import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx';
import OpeningTransition from './components/OpeningTransition.jsx';
import HeroTitle from './components/HeroTitle.jsx';
import ToolControls from './components/ToolControls.jsx';
import ResultList from './components/ResultList.jsx';
import ResultDetail from './components/ResultDetail.jsx';
import { fetchCategories, fetchCategory, searchTitles } from './services/api.js';
import { filterItems } from './lib/search.js';
import { useLocale } from './i18n.jsx';

const fallbackCategories = [
  ['recommend', '推薦'], ['drama', '戲劇'], ['movie', '電影'], ['free', '免費'],
  ['anime', '動漫'], ['kids', '兒童'], ['entertainment', '娛樂'], ['variety', '綜藝'],
].map(([id, name]) => ({ id, name }));

export default function App() {
  const { t } = useLocale();
  const [categories, setCategories] = useState(fallbackCategories);
  const [category, setCategory] = useState('anime');
  const [categoryItems, setCategoryItems] = useState([]);
  const cacheRef = useRef({});
  const categoryRef = useRef('anime');
  const [keyword, setKeyword] = useState('');
  const [onlineResults, setOnlineResults] = useState([]);
  const [onlineKeyword, setOnlineKeyword] = useState('');
  const [showingOnlineResults, setShowingOnlineResults] = useState(false);
  const [logoFilter, setLogoFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({ key: 'status.ready' });
  const categoryRequest = useRef(null);
  const searchRequest = useRef(null);

  const loadCategory = useCallback(async (categoryId, force = false) => {
    const cached = cacheRef.current[categoryId];
    if (cached && !force) {
      setCategoryItems(cached);
      setSelectedItem(cached[0] || null);
      setStatus({ key: 'status.cached', values: { count: cached.length } });
      return;
    }
    categoryRequest.current?.abort();
    const controller = new AbortController();
    categoryRequest.current = controller;
    setLoading(true);
    setError('');
    setStatus({ key: 'status.loading', values: { categoryId } });
    try {
      const data = await fetchCategory(categoryId, controller.signal);
      const items = data.items || [];
      cacheRef.current = { ...cacheRef.current, [categoryId]: items };
      if (categoryRef.current !== categoryId) return;
      setCategoryItems(items);
      setSelectedItem(items[0] || null);
      setStatus({ key: 'status.loaded', values: { count: items.length, logoCount: items.filter((item) => item.logo).length } });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
        setStatus({ key: 'status.loadFailed' });
      }
    } finally {
      if (categoryRequest.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal).then((data) => setCategories(data.categories || fallbackCategories)).catch(() => {});
    loadCategory('anime');
    return () => controller.abort();
  }, []); // Initial category must load once.

  useEffect(() => () => {
    categoryRequest.current?.abort();
    searchRequest.current?.abort();
  }, []);

  const changeCategory = (categoryId) => {
    categoryRequest.current?.abort();
    categoryRef.current = categoryId;
    setCategory(categoryId);
    setKeyword('');
    setOnlineResults([]);
    setOnlineKeyword('');
    setShowingOnlineResults(false);
    setError('');
    const cached = cacheRef.current[categoryId];
    setCategoryItems(cached || []);
    setSelectedItem(cached?.[0] || null);
    setStatus(cached
      ? { key: 'status.cached', values: { count: cached.length } }
      : { key: 'status.selected', values: { categoryId } });
  };

  const changeKeyword = (value) => {
    setKeyword(value);
    setError('');
    if (!value.trim()) {
      searchRequest.current?.abort();
      setOnlineResults([]);
      setOnlineKeyword('');
      setShowingOnlineResults(false);
      setStatus(categoryItems.length
        ? { key: 'status.restored', values: { count: categoryItems.length } }
        : { key: 'status.notLoaded' });
    } else if (showingOnlineResults && value.trim() !== onlineKeyword) {
      setShowingOnlineResults(false);
    }
  };

  const runOnlineSearch = async () => {
    const query = keyword.trim();
    if (!query) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setLoading(true);
    setError('');
    setStatus({ key: 'status.searching', values: { query } });
    try {
      const data = await searchTitles(query, controller.signal);
      const items = data.items || [];
      setOnlineResults(items);
      setOnlineKeyword(query);
      setShowingOnlineResults(true);
      setSelectedItem(items[0] || null);
      setStatus({ key: 'status.found', values: { query, count: items.length } });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
        setStatus({ key: 'status.searchFailed' });
      }
    } finally {
      if (searchRequest.current === controller) setLoading(false);
    }
  };

  const filtered = useMemo(() => filterItems({ categoryItems, onlineResults, keyword, onlineKeyword, showingOnlineResults, logoFilter }), [categoryItems, onlineResults, keyword, onlineKeyword, showingOnlineResults, logoFilter]);
  useEffect(() => {
    if (selectedItem && filtered.items.some((item) => item.id === selectedItem.id)) return;
    setSelectedItem(filtered.items[0] || null);
  }, [filtered.items, selectedItem]);

  const emptyMessage = loading ? t('status.fetching') : filtered.useOnline
    ? t('empty.online', { query: onlineKeyword })
    : keyword.trim() && categoryItems.length ? t('empty.local') : t('empty.load');

  const activeCategory = categories.find((item) => item.id === category);
  const activeCategoryTranslation = t(`category.${category}`);
  const activeCategoryName = activeCategoryTranslation === `category.${category}` ? activeCategory?.name : activeCategoryTranslation;
  const statusCategory = status.values?.categoryId
    ? categories.find((item) => item.id === status.values.categoryId)
    : null;
  const statusCategoryTranslation = status.values?.categoryId ? t(`category.${status.values.categoryId}`) : '';
  const statusValues = status.values?.categoryId ? {
    ...status.values,
    category: statusCategoryTranslation === `category.${status.values.categoryId}` ? statusCategory?.name : statusCategoryTranslation,
  } : status.values;

  return (
    <div className="page-wrap">
      <OpeningTransition />
      <SiteHeader />
      <main>
        <section className="tool-hero">
          <div className="container">
            <HeroTitle />
          </div>
        </section>
        <section className="tool-section">
          <div className="container">
            <ToolControls
              categories={categories}
              category={category}
              keyword={keyword}
              logoFilter={{ value: logoFilter, set: setLogoFilter }}
              loading={loading}
              onCategoryChange={changeCategory}
              onLoad={() => loadCategory(category, true)}
              onKeywordChange={changeKeyword}
              onOnlineSearch={runOnlineSearch}
            />
            <div className={`status-line${error ? ' is-error' : ''}`} role="status" aria-live="polite">
              <span>{loading ? 'SYNC' : error ? 'ERROR' : filtered.useOnline ? 'ONLINE' : 'CATEGORY'}</span>
              <p>{error || t(status.key, statusValues)}</p>
              <strong>{filtered.items.length.toString().padStart(2, '0')}</strong>
            </div>
            <div className="workspace">
              <section className="results-panel" aria-label={t('results.label')}>
                <div className="panel-heading"><span>Results</span><small>{filtered.useOnline ? t('results.online') : activeCategoryName}</small></div>
                <ResultList items={filtered.items} selectedId={selectedItem?.id} loading={loading} emptyMessage={emptyMessage} onSelect={setSelectedItem} />
              </section>
              <ResultDetail item={selectedItem} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
