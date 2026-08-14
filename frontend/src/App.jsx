import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SiteFooter, SiteHeader } from './components/SiteLayout.jsx';
import OpeningTransition from './components/OpeningTransition.jsx';
import ToolControls from './components/ToolControls.jsx';
import ResultList from './components/ResultList.jsx';
import ResultDetail from './components/ResultDetail.jsx';
import { fetchCategories, fetchCategory, searchTitles } from './services/api.js';
import { filterItems } from './lib/search.js';

const fallbackCategories = [
  ['recommend', '推薦'], ['drama', '戲劇'], ['movie', '電影'], ['free', '免費'],
  ['anime', '動漫'], ['kids', '兒童'], ['entertainment', '娛樂'], ['variety', '綜藝'],
].map(([id, name]) => ({ id, name }));

export default function App() {
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
  const [status, setStatus] = useState('準備載入動漫分類');
  const categoryRequest = useRef(null);
  const searchRequest = useRef(null);

  const loadCategory = useCallback(async (categoryId, force = false) => {
    const cached = cacheRef.current[categoryId];
    if (cached && !force) {
      setCategoryItems(cached);
      setSelectedItem(cached[0] || null);
      setStatus(`已從快取載入 ${cached.length} 部作品`);
      return;
    }
    categoryRequest.current?.abort();
    const controller = new AbortController();
    categoryRequest.current = controller;
    setLoading(true);
    setError('');
    setStatus(`正在載入${categories.find((item) => item.id === categoryId)?.name || ''}分類…`);
    try {
      const data = await fetchCategory(categoryId, controller.signal);
      const items = data.items || [];
      cacheRef.current = { ...cacheRef.current, [categoryId]: items };
      if (categoryRef.current !== categoryId) return;
      setCategoryItems(items);
      setSelectedItem(items[0] || null);
      setStatus(`已載入 ${items.length} 部作品，其中 ${items.filter((item) => item.logo).length} 部有 Logo`);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
        setStatus('分類載入失敗');
      }
    } finally {
      if (categoryRequest.current === controller) setLoading(false);
    }
  }, [categories]);

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
    setStatus(cached ? `已從快取載入 ${cached.length} 部作品` : `已選擇${categories.find((item) => item.id === categoryId)?.name || ''}，按「載入分類」開始載入`);
  };

  const changeKeyword = (value) => {
    setKeyword(value);
    setError('');
    if (!value.trim()) {
      searchRequest.current?.abort();
      setOnlineResults([]);
      setOnlineKeyword('');
      setShowingOnlineResults(false);
      setStatus(categoryItems.length ? `已恢復目前分類的 ${categoryItems.length} 部作品` : '尚未載入分類資料');
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
    setStatus(`正在線上搜尋「${query}」…`);
    try {
      const data = await searchTitles(query, controller.signal);
      const items = data.items || [];
      setOnlineResults(items);
      setOnlineKeyword(query);
      setShowingOnlineResults(true);
      setSelectedItem(items[0] || null);
      setStatus(`線上搜尋「${query}」找到 ${items.length} 筆結果`);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
        setStatus('線上搜尋失敗');
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

  const emptyMessage = loading ? '正在取得作品資料' : filtered.useOnline
    ? `找不到符合「${onlineKeyword}」的作品`
    : keyword.trim() && categoryItems.length ? '目前分類找不到符合的作品，可以使用線上搜尋' : '載入分類以查看作品';

  return (
    <div className="page-wrap">
      <OpeningTransition />
      <SiteHeader />
      <main>
        <section className="tool-hero">
          <div className="container">
            <div className="section-title">
              <span aria-hidden="true">Logo Finder</span>
              <p>Ascooo Utility / 01</p>
              <h1>Logo<br />Finder</h1>
              <p className="hero-copy">搜尋影視作品、確認標題 Logo，並取得原始圖片。</p>
            </div>
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
              <p>{error || status}</p>
              <strong>{filtered.items.length.toString().padStart(2, '0')}</strong>
            </div>
            <div className="workspace">
              <section className="results-panel" aria-label="搜尋結果">
                <div className="panel-heading"><span>Results</span><small>{filtered.useOnline ? '線上搜尋' : categories.find((item) => item.id === category)?.name}</small></div>
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
