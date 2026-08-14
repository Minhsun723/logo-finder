import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function HeroTitle() {
  const titleRef = useRef(null);

  useGSAP(() => {
    const title = titleRef.current;
    const background = title.querySelector('.c-section-title__bg');
    const text = title.querySelector('.c-section-title__text');
    const caption = title.querySelector('.c-section-title__cap');
    const copy = title.querySelector('.hero-copy');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      title.style.setProperty('--title-line-scale', 1);
      return undefined;
    }

    gsap.set(background, { xPercent: -20, autoAlpha: 0, scale: 0.95, filter: 'blur(8px)' });
    gsap.set(text, {
      y: 40,
      autoAlpha: 0,
      letterSpacing: '0.2em',
      filter: 'blur(8px)',
      clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
    });
    gsap.set([caption, copy], { y: 20, autoAlpha: 0, filter: 'blur(4px)' });

    const reveal = () => {
      const timeline = gsap.timeline();
      timeline
        .to(background, {
          xPercent: 0,
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power3.out',
        })
        .to(text, {
          y: 0,
          autoAlpha: 1,
          letterSpacing: '-0.055em',
          filter: 'blur(0px)',
          clipPath: 'polygon(-20% -20%, 120% -20%, 120% 120%, -20% 120%)',
          duration: 1.2,
          ease: 'power3.out',
        }, 0.1)
        .to(caption, {
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
        }, 0.3)
        .to(copy, {
          y: 0,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
        }, 0.45)
        .to(title, {
          '--title-line-scale': 1,
          duration: 1,
          ease: 'power3.inOut',
        }, 0.4);
    };

    if (document.documentElement.dataset.openingComplete === 'true') reveal();
    else window.addEventListener('ascooo:opening-complete', reveal, { once: true });

    return () => window.removeEventListener('ascooo:opening-complete', reveal);
  }, { scope: titleRef });

  return (
    <div className="c-section-title tool-hero__title" ref={titleRef}>
      <span className="c-section-title__bg" aria-hidden="true">Logo Finder</span>
      <h1 className="c-section-title__text">Logo Finder</h1>
      <p className="c-section-title__cap">Ascooo Utility / 01</p>
      <p className="hero-copy">搜尋影視作品、確認標題 Logo，並取得原始圖片。</p>
    </div>
  );
}
