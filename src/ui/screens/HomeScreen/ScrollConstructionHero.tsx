import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { constructionPhases, phaseAt } from './constructionTimeline';
import './ScrollConstructionHero.css';

export function ScrollConstructionHero({ onEnquire }: { onEnquire: () => void }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const updateScene = useRef<((progress: number) => void) | null>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'loading' | 'live' | 'static'>('loading');

  useEffect(() => {
    const element = section.current, target = canvas.current;
    if (!element || !target) return;
    let disposed = false;
    let cleanupScene: (() => void) | undefined;
    let trigger: ScrollTrigger | undefined;
    let currentPhase = -1;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setProgress = (value: number) => {
      progress.current = value;
      // Finish the build before the sticky scene releases so the completed
      // home has a deliberate hold instead of being pushed out immediately.
      const buildProgress = Math.min(1, value / .88);
      updateScene.current?.(buildProgress);
      element.style.setProperty('--build-progress', String(buildProgress));
      const phase = phaseAt(buildProgress);
      if (phase !== currentPhase) { currentPhase = phase; setActive(phase); }
    };
    const staticView = () => {
      trigger?.kill();
      cleanupScene?.(); cleanupScene = undefined;
      updateScene.current = null;
      setMode('static'); setProgress(1);
      requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
    };
    const lost = () => staticView();
    target.addEventListener('scene-unavailable', lost);
    const changed = () => { if (media.matches) staticView(); };
    media.addEventListener('change', changed);
    gsap.registerPlugin(ScrollTrigger);
    if (media.matches) staticView();
    else {
      import('./constructionScene').then(({ createConstructionScene }) => {
        if (disposed || media.matches) return;
        const scene = createConstructionScene(target);
        cleanupScene = scene.dispose;
        updateScene.current = scene.update;
        setMode('live');
        trigger = ScrollTrigger.create({
          trigger: element, start: 'top top', end: 'bottom bottom',
          invalidateOnRefresh: true,
          onUpdate: self => setProgress(self.progress),
          onRefresh: self => setProgress(self.progress),
        });
        setProgress(trigger.progress);
      }).catch(() => { if (!disposed) staticView(); });
    }
    return () => {
      disposed = true;
      trigger?.kill(); cleanupScene?.();
      updateScene.current = null;
      target.removeEventListener('scene-unavailable', lost);
      media.removeEventListener('change', changed);
    };
  }, []);

  const phase = constructionPhases[active];
  return <section ref={section} id="hero" className={`mk-build mk-build--${mode}`} aria-labelledby="mk-build-title">
    <div className="mk-build__sticky">
      <div className="mk-build__intro">
        <p className="mk-build__eyebrow">MK GROUP OF COMPANIES</p>
        <h1 id="mk-build-title">From the ground.<br/><em>For your life.</em></h1>
        <p className="mk-build__lead">Construction, interiors and precision windows. One team, from the first foundation to the final detail.</p>
        <div className="mk-build__actions"><button type="button" onClick={onEnquire}>Plan your home <span aria-hidden="true">↗</span></button><a href="#services">Explore MK Group <span aria-hidden="true">↓</span></a></div>
      </div>
      <div className="mk-build__visual">
        <img className="mk-build__poster" src="/images/construction-sequence/06-complete.webp" alt={mode === 'static' ? 'Concept residence with stone, timber and landscaped terraces' : ''} aria-hidden={mode !== 'static'} width="1920" height="1080" fetchPriority="high" />
        <canvas ref={canvas} className="mk-build__canvas" aria-label="A two-storey house assembling upwards from its foundations as you scroll" role="img" />
        {mode === 'loading' && <div className="mk-build__loading" role="status">Preparing your build experience<span /></div>}
        <div className="mk-build__visual-caption"><span>THE MAKING OF A HOME</span><span>{mode === 'live' ? active === constructionPhases.length - 1 ? 'BUILD COMPLETE' : 'SCROLL TO BUILD ↓' : 'MK / RESIDENTIAL'}</span></div>
      </div>
      <a className="mk-build__skip" href="#services">Skip build sequence <span aria-hidden="true">↓</span></a>
      <div className="mk-build__bottom">
        <div className="mk-build__chapter" key={active}><span>{String(active + 1).padStart(2, '0')} / {phase.label}</span><h2>{phase.title}</h2><p>{phase.detail}</p></div>
        <ol className="mk-build__timeline" aria-label="Construction sequence">{constructionPhases.map((item, index) => <li key={item.label} aria-current={index === active ? 'step' : undefined} className={index <= active ? 'is-complete' : ''}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong></li>)}</ol>
      </div>
      <div className="mk-build__meter" aria-hidden="true"><span /></div>
    </div>
  </section>;
}
