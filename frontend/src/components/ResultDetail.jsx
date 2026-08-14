const sourceLabels = { albumList: '作品列表', tv_common: 'TV 分類', search: '線上搜尋' };

export default function ResultDetail({ item }) {
  if (!item) {
    return <aside className="detail-panel detail-empty"><div className="detail-number">SELECT</div><p>從左側選擇作品，查看 Logo 與詳細資料。</p></aside>;
  }
  const logo = item.logo?.url || item.logo?.webp;
  return (
    <aside className="detail-panel" aria-label={`${item.name} 詳細資料`}>
      <div className="detail-heading"><span>Selected title</span><strong>{item.name}</strong></div>
      <div className="logo-preview">
        {logo ? <img src={logo} alt={`${item.name} Logo`} /> : <p>目前沒有可預覽的 Logo</p>}
      </div>
      <dl className="metadata">
        <div><dt>分類</dt><dd>{item.category || '未知'}</dd></div>
        <div><dt>qipuId</dt><dd>{item.qipuId || '—'}</dd></div>
        <div><dt>來源</dt><dd>{(item.source || []).map((source) => sourceLabels[source] || source).join(' + ') || '—'}</dd></div>
        <div><dt>解析度</dt><dd>{item.logo?.resolution || '—'}</dd></div>
      </dl>
      {logo && (
        <div className="detail-actions">
          <a className="button" href={logo} download target="_blank" rel="noreferrer">下載 Logo</a>
          <a className="button button-outline" href={logo} target="_blank" rel="noreferrer">開啟原圖</a>
        </div>
      )}
      {logo && <p className="logo-url">{logo}</p>}
    </aside>
  );
}
