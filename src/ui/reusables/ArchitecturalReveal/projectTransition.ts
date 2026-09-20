import type { MouseEvent } from 'react';
import gsap from 'gsap';

type PendingTransition = {
  slug: string;
  overlay: HTMLDivElement;
  image: HTMLImageElement;
  title: HTMLDivElement;
  timeout: number;
};

let pending: PendingTransition | null = null;

function clearTransition(transition: PendingTransition) {
  window.clearTimeout(transition.timeout);
  gsap.killTweensOf([transition.image, transition.title]);
  transition.overlay.remove();
  document.documentElement.classList.remove('mk-project-transitioning');
  if (pending === transition) pending = null;
}

export function beginProjectTransition(event: MouseEvent<HTMLAnchorElement>, slug: string, source: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const card = event.currentTarget;
  const heading = card.querySelector<HTMLElement>('.mk-projects__card-copy strong');
  if (!heading) return;
  event.preventDefault();
  if (pending) clearTransition(pending);

  const cardRect = card.getBoundingClientRect();
  const titleRect = heading.getBoundingClientRect();
  const headingStyle = window.getComputedStyle(heading);
  const overlay = document.createElement('div');
  overlay.className = 'mk-project-transition';
  overlay.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  image.style.cssText = `left:${cardRect.left}px;top:${cardRect.top}px;width:${cardRect.width}px;height:${cardRect.height}px`;
  const title = document.createElement('div');
  title.textContent = heading.textContent;
  title.style.cssText = `left:${titleRect.left}px;top:${titleRect.top}px;width:${titleRect.width}px;font-size:${headingStyle.fontSize};line-height:${headingStyle.lineHeight}`;
  overlay.append(image, title);
  document.body.appendChild(overlay);
  document.documentElement.classList.add('mk-project-transitioning');
  const transition: PendingTransition = { slug, overlay, image, title, timeout: 0 };
  transition.timeout = window.setTimeout(() => clearTransition(transition), 1800);
  pending = transition;
  window.location.hash = `/projects/${slug}`;
}

export function finishProjectTransition(slug: string, hero: HTMLElement, heading: HTMLElement) {
  const transition = pending;
  if (!transition || transition.slug !== slug) return;
  pending = null;
  window.clearTimeout(transition.timeout);
  requestAnimationFrame(() => {
    if (!transition.overlay.isConnected) return;
    const heroRect = hero.getBoundingClientRect();
    const titleRect = heading.getBoundingClientRect();
    const headingStyle = window.getComputedStyle(heading);
    gsap.to(transition.image, {
      left: heroRect.left, top: heroRect.top, width: heroRect.width, height: heroRect.height,
      duration: .78, ease: 'power3.inOut',
      onComplete: () => clearTransition(transition),
    });
    gsap.to(transition.title, {
      left: titleRect.left, top: titleRect.top, width: titleRect.width,
      fontSize: headingStyle.fontSize, lineHeight: headingStyle.lineHeight, color: '#242d2a',
      duration: .72, ease: 'power3.inOut',
    });
  });
}
