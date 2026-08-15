import { useLocale } from '../i18n.jsx';

export default function ResultDetail({ item }) {
  const { t } = useLocale();
  const sourceLabel = (source) => {
    const label = t(`source.${source}`);
    return label === `source.${source}` ? source : label;
  };

  if (!item) {
    return (
      <aside className="detail-panel detail-empty">
        <div className="detail-number">SELECT</div>
        <p>
          <span className="detail-select-desktop">{t('detail.selectDesktop')}</span>
          <span className="detail-select-mobile">{t('detail.selectMobile')}</span>
        </p>
      </aside>
    );
  }
  const logo = item.logo?.url || item.logo?.webp;
  return (
    <aside className="detail-panel" aria-label={t('detail.label', { name: item.name })}>
      <div className="detail-heading"><span>{t('detail.selected')}</span><strong>{item.name}</strong></div>
      <div className="logo-preview">
        {logo ? <img src={logo} alt={`${item.name} Logo`} /> : <p>{t('detail.noLogo')}</p>}
      </div>
      <dl className="metadata">
        <div><dt>{t('detail.category')}</dt><dd>{item.category || t('detail.unknown')}</dd></div>
        <div><dt>qipuId</dt><dd>{item.qipuId || '—'}</dd></div>
        <div><dt>{t('detail.source')}</dt><dd>{(item.source || []).map(sourceLabel).join(' + ') || '—'}</dd></div>
        <div><dt>{t('detail.resolution')}</dt><dd>{item.logo?.resolution || '—'}</dd></div>
      </dl>
      {logo && (
        <div className="detail-actions">
          <a className="button" href={logo} download target="_blank" rel="noreferrer">{t('detail.download')}</a>
          <a className="button button-outline" href={logo} target="_blank" rel="noreferrer">{t('detail.open')}</a>
        </div>
      )}
      {logo && <p className="logo-url">{logo}</p>}
    </aside>
  );
}
