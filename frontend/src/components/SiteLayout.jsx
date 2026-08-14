import { useEffect, useState } from 'react';
import logoDark from '../assets/img/logo_dark.svg';
import logoLight from '../assets/img/logo_light.svg';

const MAIN_SITE_URL = 'https://ascooo.com';

const links = [
  ['首頁', '/'], ['作品', '/works'], ['關於', '/about'], ['公司', '/company'],
  ['服務狀態', '/status'], ['最新消息', '/news'],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.setAttribute('data-menu-open', '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.removeAttribute('data-menu-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.removeAttribute('data-menu-open');
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className={`l-header${scrolled ? ' is-scrolled' : ''}`} id="header">
        <h1 className="l-header__brand">
          <a href={`${MAIN_SITE_URL}/`} className="l-header__brand-link" aria-label="Ascooo Home"><img src={logoDark} alt="Ascooo" /></a>
        </h1>
        <nav className="l-header__nav is-pc" aria-label="主要選單">
          <ul className="l-header__nav-list">
            {links.map(([label, href]) => <li key={href}><a href={`${MAIN_SITE_URL}${href}`} className="l-header__nav-link">{label}</a></li>)}
          </ul>
        </nav>
        <div className="l-header__actions">
          <div className="l-lang l-lang--dropdown">
            <button className="l-lang__toggle" type="button" aria-label="Language">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>
            <div className="l-lang__menu">
              <a className="l-lang__btn is-active" href={`${MAIN_SITE_URL}/`}>繁體中文</a><a className="l-lang__btn" href={`${MAIN_SITE_URL}/en/`}>English</a>
            </div>
          </div>
        </div>
      </header>

      <nav className={`l-nav${open ? ' is-open' : ''}`} aria-label="行動版主要選單" aria-hidden={!open}>
        <div className="l-nav__bg" />
        <div className="l-nav__container">
          <div className="l-nav__brand"><a href={`${MAIN_SITE_URL}/`} className="l-nav__brand-link" aria-label="Ascooo Home"><img src={logoLight} alt="Ascooo" /></a></div>
          <div className="l-nav__content">
            <ul className="l-nav__list">
              {[...links, ['聯絡我們', '/contact']].map(([label, href]) => (
                <li className="l-nav__list-item" key={href}><a href={`${MAIN_SITE_URL}${href}`} className="l-nav__link" onClick={() => setOpen(false)}><span className="l-nav__link-text">{label}</span></a></li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <button className="l-menu" type="button" aria-label="Toggle Menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="l-menu__content">
          <span className="l-menu__line --open"><span className="l-menu__line-bar">MENU</span><span className="l-menu__line-bar" /></span>
          <span className="l-menu__line --close"><span className="l-menu__line-bar" /><span className="l-menu__line-bar" /></span>
        </span>
      </button>
    </>
  );
}

function SocialLinks() {
  return (
    <div className="l-footer__sns">
      <a href="#" aria-label="X"><svg viewBox="0 0 1200 1227" fill="currentColor"><path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894L144.011 79.694h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" /></svg></a>
      <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
      <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg></a>
      <a href="#" aria-label="Threads"><svg viewBox="0 0 192 192" fill="currentColor"><path d="M141.5 89c-.8-.4-1.6-.8-2.5-1.2-1.5-27.3-16.4-42.9-41.4-43.1h-.4c-15 0-27.4 6.4-35.1 18.1l13.8 9.4c5.7-8.7 14.7-10.5 21.3-10.5h.3c8.2 0 14.4 2.4 18.5 7.1 2.9 3.4 4.9 8.1 5.8 14.1-7.3-1.3-15.2-1.7-23.7-1.2-23.8 1.4-39.1 15.3-38.1 34.6.5 9.8 5.4 18.2 13.7 23.7 7.1 4.7 16.1 6.9 25.6 6.4 12.4-.7 22.2-5.4 29-14.1 5.2-6.6 8.5-15.2 9.9-25.9 6 3.5 10.4 8.3 12.8 13.9 4.1 9.7 4.4 25.5-8.5 38.4-11.3 11.3-24.9 16.2-45.5 16.4-22.8-.2-40.1-7.5-51.3-21.8C35.2 140 29.8 120.7 29.6 96c.2-24.7 5.6-44 16.1-57.3C57 24.4 74.2 17.1 97 16.9c23 .2 40.5 7.6 52.2 21.9 5.7 7 10 15.9 12.8 26.2l16.2-4.4c-3.5-12.6-8.9-23.6-16.2-32.6C147 9.6 125.2.2 97.1 0H97C68.9.2 47.3 9.6 32.8 28.1 19.9 44.5 13.2 67.3 13 95.9v.2c.2 28.6 6.9 51.4 19.8 67.8 14.5 18.5 36.1 27.9 64.2 28.1h.1c25-.2 42.5-6.7 57-21.2 19-18.9 18.4-42.7 12.2-57.3-4.5-10.4-13.1-18.9-24.8-24.5Zm-43.1 40.5c-10.4.6-21.3-4.1-21.8-14.1-.4-7.5 5.3-15.8 22.5-16.8 2-.1 3.9-.1 5.8-.1 6.2 0 12 .6 17.3 1.7-2 24.7-13.6 28.7-23.8 29.3Z" /></svg></a>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="l-footer">
      <div className="l-footer__container">
        <div className="l-footer__support"><div className="l-footer__support-inner">
          <ul className="l-footer__support-list --legal"><li><a href={`${MAIN_SITE_URL}/privacy`} className="l-footer__support-link">Privacy Policy</a></li><li><a href={`${MAIN_SITE_URL}/terms`} className="l-footer__support-link">Terms of Service</a></li></ul>
          <ul className="l-footer__support-list --nav"><li><a href={`${MAIN_SITE_URL}/contact`} className="l-footer__support-link">Contact</a></li><li><a href={`${MAIN_SITE_URL}/about`} className="l-footer__support-link">About</a></li></ul>
        </div></div>
        <div className="l-footer__bottom">
          <div className="l-footer__legal"><p className="l-footer__legal-text">©Ascooo Inc. All rights reserved.</p></div>
          <div className="l-footer__logo"><a href={`${MAIN_SITE_URL}/`} aria-label="Ascooo Home"><img src={logoDark} alt="Ascooo" /></a></div>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
