export function normalizeText(value = '') {
  return String(value).toLocaleLowerCase('zh-Hant').trim().replace(/[\s\-_:：·・,.，。!！?？【】\[\]()（）~～]+/g, '');
}

function bigrams(value) {
  if (value.length < 2) return new Set([value]);
  return new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)));
}

export function titleScore(keyword, item) {
  const query = normalizeText(keyword);
  if (!query) return 0;
  const texts = [item.name, item.shortName, ...(item.alternativeTitles || [])];
  return texts.reduce((best, rawText) => {
    const text = normalizeText(rawText);
    if (!text) return best;
    if (text === query) return 100;
    if (text.includes(query)) return Math.max(best, 99);
    if (query.includes(text)) return Math.max(best, 95);
    const queryPairs = bigrams(query);
    const textPairs = bigrams(text);
    const matches = [...queryPairs].filter((pair) => textPairs.has(pair)).length;
    const score = (2 * matches * 100) / (queryPairs.size + textPairs.size || 1);
    return Math.max(best, score);
  }, 0);
}

export function filterItems({ categoryItems, onlineResults, keyword, onlineKeyword, showingOnlineResults, logoFilter }) {
  const useOnline = showingOnlineResults && keyword.trim() && keyword.trim() === onlineKeyword;
  let items = useOnline ? onlineResults : categoryItems;
  if (logoFilter === 'with-logo') items = items.filter((item) => Boolean(item.logo));
  if (logoFilter === 'without-logo') items = items.filter((item) => !item.logo);
  if (!useOnline && keyword.trim()) {
    items = items
      .map((item) => ({ item, score: titleScore(keyword, item) }))
      .filter(({ score }) => score >= 55)
      .sort((a, b) => b.score - a.score || Number(Boolean(b.item.logo)) - Number(Boolean(a.item.logo)))
      .map(({ item }) => item);
  }
  return { items, useOnline };
}
