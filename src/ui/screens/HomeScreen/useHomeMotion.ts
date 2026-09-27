import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useHomeMotion(root: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    const element = root.current;
    if (!element) return;
    let disposed = false;
    const media = gsap.matchMedia();
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const href = link?.getAttribute('href');
      if (!href || href === '#' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      history.replaceState(null, '', href);
      gsap.killTweensOf(window);
      const focus = () => {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { target.scrollIntoView(); focus(); }
      else gsap.to(window, { scrollTo: { y: target, offsetY: 88, autoKill: true }, duration: .85, ease: 'power2.inOut', onComplete: focus });
    };
    element.addEventListener('click', navigate);
    const context = gsap.context(() => {
      const progress = element.querySelector<HTMLElement>('.mk-page-progress');
      if (progress) ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { progress.style.transform = `scaleX(${self.progress})`; } });
      const header = element.querySelector<HTMLElement>('.mk-header');
      if (header) ScrollTrigger.create({ start: 24, end: 'max', onUpdate: self => header.classList.toggle('is-scrolled', self.scroll() > 24) });
      const nav = [...element.querySelectorAll<HTMLAnchorElement>('.mk-header nav a')];
      for (const link of nav) {
        const target = document.querySelector(link.hash);
        if (!target) continue;
        const activate = () => {
          nav.forEach(item => item.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        };
        ScrollTrigger.create({ trigger: target, start: 'top 35%', end: 'bottom 35%', onEnter: activate, onEnterBack: activate, onLeave: () => link.removeAttribute('aria-current'), onLeaveBack: () => link.removeAttribute('aria-current') });
      }
      media.add('(prefers-reduced-motion: no-preference)', () => {
        element.querySelectorAll<HTMLElement>('.mk-reveal').forEach(section => {
          // Animate compact headings only; long sections and images remain visible.
          const content = section.querySelector('.mk-section-head') ?? section.querySelector('h2');
          if (content) gsap.fromTo(content, { y: 20, opacity: .25 }, { y: 0, opacity: 1, duration: .65, ease: 'power2.out', scrollTrigger: { trigger: content, start: 'top 92%', once: true } });
        });
        element.querySelectorAll<HTMLElement>('.mk-service').forEach((article) => {
          const visual = article.querySelector<HTMLElement>('.mk-service__visual');
          const image = article.querySelector<HTMLElement>('.mk-service__visual img');
          const copy = article.querySelectorAll<HTMLElement>('.mk-service__copy > *');
          if (visual) gsap.fromTo(visual, { clipPath: 'inset(0 0 16% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .9, ease: 'power3.out', scrollTrigger: { trigger: article, start: 'top 82%', once: true } });
          if (copy.length) gsap.fromTo(copy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .055, ease: 'power2.out', scrollTrigger: { trigger: article, start: 'top 75%', once: true } });
          if (image && matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
            gsap.fromTo(image, { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: .25 } });
            gsap.to(article, { scale: .965, transformOrigin: 'center top', ease: 'none', scrollTrigger: { trigger: article, start: 'bottom 92%', end: 'bottom top', scrub: .35 } });
          }
          if (matchMedia('(max-width: 900px)').matches) {
            ScrollTrigger.create({
              trigger: article,
              start: 'top 88%',
              once: true,
              onEnter: () => article.classList.add('is-mobile-visible'),
            });
          }
        });
        const introHeading = element.querySelector<HTMLElement>('.mk-intro h2');
        if (introHeading && matchMedia('(min-width: 901px)').matches) gsap.fromTo(introHeading, { xPercent: 3 }, { xPercent: -2, ease: 'none', scrollTrigger: { trigger: '.mk-intro', start: 'top bottom', end: 'bottom top', scrub: .35 } });
        element.querySelectorAll<HTMLElement>('.mk-process li').forEach((row, index) => {
          gsap.fromTo(row, { x: index % 2 ? 18 : -18, opacity: .25 }, { x: 0, opacity: 1, duration: .65, ease: 'power2.out', scrollTrigger: { trigger: row, start: 'top 88%', once: true } });
        });
        const teamSection = element.querySelector<HTMLElement>('.mk-team');
        if (teamSection) {
          const teamLine = teamSection.querySelector<HTMLElement>('.mk-team__line');
          const portraits = teamSection.querySelectorAll<HTMLElement>('.mk-team__image-wrap');
          const details = teamSection.querySelectorAll<HTMLElement>('.mk-team__details');
          const footer = teamSection.querySelector<HTMLElement>('.mk-team__footer');
          const teamTimeline = gsap.timeline({ scrollTrigger: { trigger: teamSection, start: 'top 72%', once: true } });
          if (teamLine) teamTimeline.fromTo(teamLine, { scaleX: 0 }, { scaleX: 1, duration: .8, ease: 'power3.inOut' });
          teamTimeline.fromTo(portraits, { clipPath: 'inset(100% 0 0 0)', y: 28 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.05, stagger: .13, ease: 'power3.out' }, .14);
          teamTimeline.fromTo(details, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .58, stagger: .12, ease: 'power2.out' }, .62);
          if (footer) teamTimeline.fromTo(footer, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.out' }, .88);
        }        element.querySelectorAll<HTMLElement>('.mk-projects__item').forEach((card, index) => {
          gsap.fromTo(card, { y: 24 + index * 4, opacity: .2 }, { y: 0, opacity: 1, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
        });
      });
    }, element);
    const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener('load', refresh, { once: true });
    return () => {
      disposed = true;
      element.removeEventListener('click', navigate);
      window.removeEventListener('load', refresh);
      gsap.killTweensOf(window);
      media.revert(); context.revert();
    };
  }, [root]);
}
