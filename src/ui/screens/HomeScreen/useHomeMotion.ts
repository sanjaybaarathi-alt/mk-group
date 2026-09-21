import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { CLOSED_APERTURE, OPEN_APERTURE } from '../../reusables/ArchitecturalReveal/aperture.ts';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useHomeMotion(root: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = gsap.matchMedia();
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = anchor?.getAttribute('href');
      if (!hash || hash === '#' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      history.pushState(null, '', hash);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.scrollIntoView();
      } else {
        gsap.to(window, { scrollTo: { y: target, offsetY: 78, autoKill: true }, duration: 1.25, ease: 'power3.inOut', overwrite: 'auto' });
      }
    };
    element.addEventListener('click', navigate);
    const context = gsap.context(() => {
      const progress = element.querySelector<HTMLElement>('.mk-page-progress');
      if (progress) ScrollTrigger.create({
        trigger: document.documentElement, start: 'top top', end: 'bottom bottom',
        onUpdate: (self) => { progress.style.transform = `scaleX(${self.progress})`; },
      });
      const header = element.querySelector<HTMLElement>('header');
      if (header) ScrollTrigger.create({
        trigger: '#hero', start: 'bottom 15%',
        onEnter: () => header.classList.add('is-scrolled'),
        onLeaveBack: () => header.classList.remove('is-scrolled'),
      });
      motion.add('(prefers-reduced-motion: no-preference)', () => {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
        intro.fromTo('#hero > div:first-child img',
          { clipPath: CLOSED_APERTURE, scale: 1.08 },
          { clipPath: OPEN_APERTURE, scale: 1, duration: 1.15, ease: 'power3.inOut' }, .3)
          .from('#hero .mk-hero-line:first-child > span', { yPercent: 105, duration: .7 }, .2)
          .from('#hero .mk-hero-line:last-child > span', { yPercent: 105, duration: .7 }, .68)
          .from('#hero p', { y: 20, opacity: 0, duration: .5 }, .95)
          .from('#hero button, #hero a, #hero .font-label-sm', { y: 16, opacity: 0, stagger: .055, duration: .45 }, 1.08)
          .from('.mk-hero__viewfinder, .mk-hero__index', { opacity: 0, duration: .8 }, .55);

        gsap.utils.toArray<HTMLElement>('main section:not(#hero):not(#window-experience)').forEach((section) => {
          ScrollTrigger.create({ trigger: section, start: 'top 88%', onEnter: () => section.classList.add('is-visible'), onEnterBack: () => section.classList.add('is-visible') });
          const heading = section.querySelector('h2');
          if (heading) gsap.from(heading, {
            y: 35, opacity: 0, duration: 0.7, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 85%', once: true },
          });
        });
        const about = element.querySelector<HTMLElement>('#who-we-are');
        const figures = about?.querySelectorAll<HTMLElement>('.font-headline-md');
        figures?.forEach((figure, index) => {
          if (index > 2) return;
          const final = [6, 20, 1][index];
          const suffix = ['+', '+', 'L'][index];
          const counter = { value: 0 };
          gsap.to(counter, {
            value: final, duration: 1.5, ease: 'power2.out',
            onUpdate: () => { figure.textContent = `${index === 2 ? counter.value.toFixed(1) : Math.round(counter.value)}${suffix}`; },
            scrollTrigger: { trigger: about, start: 'top 72%', once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>('#constructions-section, #interiors-section, #windows-section').forEach((panel) => {
          const photo = panel.querySelector('img');
          if (!photo) return;
          gsap.fromTo(photo,
            { clipPath: CLOSED_APERTURE, scale: 1.06 },
            { clipPath: OPEN_APERTURE, scale: 1, duration: 1.05, ease: 'power2.out',
              scrollTrigger: { trigger: panel, start: 'top 78%', once: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>('#projects article').forEach((card) => {
          gsap.from(card, { y: 55, rotationX: 7, opacity: 0, duration: 1, ease: 'power3.out', onComplete: () => gsap.set(card, { clearProps: 'transform' }),
            scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
        });
        const comparison = element.querySelector<HTMLElement>('#comparison-container');
        if (comparison) {
          gsap.fromTo(comparison, { '--compare': '8%' }, {
            '--compare': '50%', duration: 1.8, ease: 'power3.inOut',
            scrollTrigger: { trigger: comparison, start: 'top 75%', once: true },
          });
          gsap.fromTo(comparison.querySelectorAll('#comp-after-img, #comp-before-img'),
            { scale: 1.1 }, { scale: 1, duration: 1.8, ease: 'power2.out',
              scrollTrigger: { trigger: comparison, start: 'top 75%', once: true } });
        }
        const process = element.querySelector<HTMLElement>('.bg-blueprint-grid');
        const steps = process?.querySelectorAll<HTMLElement>('.grid > div');
        if (process && steps?.length) {
          gsap.from(steps, {
            y: 34, opacity: 0, stagger: 0.11, duration: 0.7, ease: 'power2.out', onComplete: () => gsap.set(steps, { clearProps: 'transform' }),
            scrollTrigger: { trigger: process, start: 'top 72%', once: true },
          });
        }
        ScrollTrigger.refresh();
      });
      motion.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const visual = element.querySelector<HTMLElement>('#hero > div:first-child');
        if (visual) gsap.to(visual, {
          yPercent: -6, scale: 1.035, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
        });
        const hero = element.querySelector<HTMLElement>('#hero');
        const photo = hero?.querySelector<HTMLElement>('img');
        if (hero && photo) {
          gsap.to('#hero .mk-hero-line:first-child > span', { xPercent: -2.5, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
          gsap.to('#hero .mk-hero-line:last-child > span', { xPercent: 2.5, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
          const moveX = gsap.quickTo(photo, 'x', { duration: .9, ease: 'power3.out' });
          const moveY = gsap.quickTo(photo, 'y', { duration: .9, ease: 'power3.out' });
          const onPointer = (event: PointerEvent) => {
            const bounds = hero.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - .5;
            const y = (event.clientY - bounds.top) / bounds.height - .5;
            hero.style.setProperty('--mx', `${(x + .5) * 100}%`);
            hero.style.setProperty('--my', `${(y + .5) * 100}%`);
            moveX(x * -22);
            moveY(y * -14);
          };
          const reset = () => { moveX(0); moveY(0); };
          hero.addEventListener('pointermove', onPointer, { passive: true });
          hero.addEventListener('pointerleave', reset);
          return () => { hero.removeEventListener('pointermove', onPointer); hero.removeEventListener('pointerleave', reset); };
        }
      });
    }, element);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh, { once: true });
    document.fonts.ready.then(refresh).catch(() => undefined);
    return () => {
      element.removeEventListener('click', navigate);
      window.removeEventListener('load', refresh);
      motion.revert();
      context.revert();
    };
  }, [root]);
}
