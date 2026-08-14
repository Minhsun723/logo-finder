const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, { signal });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.detail?.message || body?.detail?.[0]?.msg || '目前無法完成要求';
    throw new Error(message);
  }
  return body;
}

export function fetchCategories(signal) {
  return request('/api/categories', signal);
}

export function fetchCategory(categoryId, signal) {
  return request(`/api/categories/${encodeURIComponent(categoryId)}`, signal);
}

export function searchTitles(keyword, signal) {
  return request(`/api/search?q=${encodeURIComponent(keyword)}`, signal);
}
