import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import logoLight from '../assets/img/logo_light.svg';

gsap.registerPlugin(useGSAP);

export default function OpeningTransition() {
  const transitionRef = useRef(null);

  useGSAP(() => {
    const root = transitionRef.current;
    const overlays = root.querySelectorAll('.p-op__overlay');
    const logo = root.querySelector('.p-op__logo');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFirstVisit = !sessionStorage.getItem('ascooo-visited');

    const finish = () => {
      sessionStorage.setItem('ascooo-visited', '1');
      root.style.pointerEvents = 'none';
      root.style.visibility = 'hidden';
    };

    if (reduceMotion) {
      gsap.set(overlays, { yPercent: -100 });
      gsap.set(logo, { display: 'none' });
      finish();
      return;
    }

    const timeline = gsap.timeline({ onComplete: finish });

    if (isFirstVisit) {
      timeline
        .fromTo(logo,
          { autoAlpha: 0, scale: 0.9, filter: 'blur(10px)' },
          { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', delay: 0.1 },
        )
        .to(logo, {
          autoAlpha: 0,
          scale: 1.1,
          filter: 'blur(10px)',
          duration: 0.4,
          ease: 'power3.in',
          delay: 0.3,
        })
        .to(overlays, {
          yPercent: -100,
          duration: 0.9,
          ease: 'power4.inOut',
          stagger: 0.1,
        }, '-=0.2');
    } else {
      gsap.set(logo, { display: 'none' });
      timeline.to(overlays, {
        yPercent: -100,
        duration: 0.35,
        ease: 'power2.inOut',
        stagger: 0.03,
      });
    }
  }, { scope: transitionRef });

  return (
    <div className="p-op" ref={transitionRef} aria-hidden="true">
      <div className="p-op__logo"><img src={logoLight} alt="" /></div>
      <div className="p-op__overlay --1" />
      <div className="p-op__overlay --2" />
      <div className="p-op__overlay --3" />
      <div className="p-op__overlay --4" />
      <div className="p-op__overlay --5" />
    </div>
  );
}
