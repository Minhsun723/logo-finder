import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';

const messages = { zh, en };
const LocaleContext = createContext(null);

const localeFromPath = () => (/^\/en(?:\/|$)/.test(window.location.pathname) ? 'en' : 'zh');

function pathForLocale(locale) {
  const pathWithoutLocale = window.location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return locale === 'en'
    ? `/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    : pathWithoutLocale;
}

function format(message, values = {}) {
  return message.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(localeFromPath);

  const setLocale = useCallback((nextLocale) => {
    if (!messages[nextLocale]) return;
    const nextPath = pathForLocale(nextLocale);
    if (nextPath !== window.location.pathname) {
      window.history.pushState(null, '', `${nextPath}${window.location.search}${window.location.hash}`);
    }
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, values) => format(messages[locale][key] || messages.zh[key] || key, values),
  }), [locale, setLocale]);

  useEffect(() => {
    const syncLocaleFromHistory = () => setLocaleState(localeFromPath());
    window.addEventListener('popstate', syncLocaleFromHistory);
    return () => window.removeEventListener('popstate', syncLocaleFromHistory);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    const description = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    description?.setAttribute('content', value.t('meta.description'));
    ogDescription?.setAttribute('content', value.t('meta.description'));
  }, [locale, value]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
