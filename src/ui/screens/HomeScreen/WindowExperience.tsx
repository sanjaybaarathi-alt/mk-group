import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './WindowExperience.css';

export function WindowExperience() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !window.matchMedia) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (mobile ? 1.35 : 2.5))}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to('.mk-window__handle', { x: -3, duration: .13 }, .1)
          .to('.mk-window__moving', { xPercent: -96, duration: .63 }, .19)
          .to('.mk-window__reflection', { opacity: .13, duration: .55 }, .25)
          .to('.mk-window__light', { opacity: mobile ? .1 : .18, duration: .4 }, .55)
          .to('.mk-window__view', { scale: 1.035, duration: .36 }, .58)
          .to('.mk-window__line--intro', { autoAlpha: 0, y: -12, duration: .14 }, .3)
          .fromTo('.mk-window__line--middle', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .14 }, .42)
          .to('.mk-window__line--middle', { autoAlpha: 0, y: -12, duration: .12 }, .77)
          .fromTo('.mk-window__line--final', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .12 }, .85)
          .to('.mk-window__assembly', { scale: mobile ? 1.32 : 1.72, opacity: .08, duration: .12 }, .9)
          .to('.mk-window__view', { scale: mobile ? 1.09 : 1.16, duration: .12 }, .9);
      }, section);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return <section ref={sectionRef} id="window-experience" className="mk-window" aria-labelledby="mk-window-title">
    <div className="mk-window__stage">
      <div className="mk-window__heading">
        <div><span className="mk-window__eyebrow">MK / PRECISION WINDOWS · CONCEPT VIEW</span><h2 id="mk-window-title">MK Precision Windows</h2></div>
        <p>Graphite uPVC profiles <span aria-hidden="true">/</span> double glazing <span aria-hidden="true">/</span> recessed two-track system</p>
      </div>
      <div className="mk-window__scene">
        <img className="mk-window__view" src="/images/window-open-plate.webp" alt="Finished living room opening onto a sunlit garden terrace" width="1586" height="992" loading="lazy" onLoad={() => ScrollTrigger.refresh()} />
        <div className="mk-window__light" aria-hidden="true" />
        <div className="mk-window__assembly" aria-hidden="true">
          <div className="mk-window__outer-frame">
            <div className="mk-window__fixed"><div className="mk-window__fixed-glass" /></div>
            <div className="mk-window__moving"><div className="mk-window__moving-glass"><div className="mk-window__reflection" /></div><span className="mk-window__handle" /></div>
            <div className="mk-window__head-track" /><div className="mk-window__sill-track" />
          </div>
        </div>
      </div>
      <div className="mk-window__footer">
        <div className="mk-window__story">
          <p className="mk-window__line mk-window__line--intro">PRECISION IN EVERY FRAME.</p>
          <p className="mk-window__line mk-window__line--middle">MORE LIGHT. MORE AIR. A CLEARER VIEW.</p>
          <p className="mk-window__line mk-window__line--final">OPEN YOUR HOME TO MORE.</p>
        </div>
        <span className="mk-window__instruction">SCROLL TO OPEN <span aria-hidden="true">↓</span></span>
      </div>
    </div>
  </section>;
}
