import { useEffect, useLayoutEffect, useState } from 'react';
import { projects } from './projects.ts';
import { finishProjectTransition } from '../reusables/ArchitecturalReveal/projectTransition.ts';
import './projects.css';

export function ProjectDetail({ slug }: { slug: string }) {
  const project = projects.find((item) => item.slug === slug);
  const [selected, setSelected] = useState(0);
  useEffect(() => { setSelected(0); window.scrollTo(0, 0); }, [slug]);
  useLayoutEffect(() => {
    const hero = document.querySelector<HTMLElement>('.mk-detail__hero');
    const heading = document.querySelector<HTMLElement>('.mk-detail h1');
    if (hero && heading) finishProjectTransition(slug, hero, heading);
  }, [slug]);

  if (!project) return <main className="mk-detail mk-detail--missing"><a href="#projects">← Back to projects</a><h1>Project not found.</h1></main>;
  const current = Math.min(selected, project.images.length - 1);
  const image = project.images[current];
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  return <div className="mk-detail-page">
    <header className="mk-detail-header"><a href="#projects" className="mk-detail-header__brand"><img src="/logos/mk-group.svg" alt="MK Group of Companies" /></a><a href="#projects" className="mk-detail-header__back">← ALL PROJECTS</a></header>
    <main className="mk-detail">
      <div className="mk-detail__topline"><span>MK GROUP / PROJECT ARCHIVE</span><span>ILLUSTRATIVE CASE STUDY</span></div>
      <div className="mk-detail__heading"><div><span className="mk-detail__eyebrow">{project.category} / {project.year}</span><h1>{project.title}</h1></div><p>{project.introduction}</p></div>
      <div className="mk-detail__hero"><img key={image.src} src={image.src} alt={image.alt} /><span>{String(current + 1).padStart(2, '0')} / {String(project.images.length).padStart(2, '0')} — {image.caption}</span></div>
      <div className="mk-detail__facts" aria-label="Project details">
        {([['Location', project.location], ['Area', project.area], ['Duration', project.duration], ['Model', project.model], ['Budget', project.budget], ['Year', project.year]] as const).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <p className="mk-detail__notice">Sample portfolio content. Photography and specifications are illustrative; verified project records will replace these examples when available.</p>
      <section className="mk-detail__gallery" aria-labelledby="mk-detail-gallery-title"><div className="mk-detail__section-heading"><span>SELECTED VIEWS</span><h2 id="mk-detail-gallery-title">Explore the project.</h2></div><div className="mk-detail__thumbnails">{project.images.map((item, index) => <button type="button" aria-label={`Show ${item.caption}`} aria-pressed={current === index} key={item.src} onClick={() => { setSelected(index); document.querySelector('.mk-detail__hero')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); }}><img src={item.src} alt="" loading="lazy" /><span>0{index + 1} / {item.caption}</span></button>)}</div></section>
      <a className="mk-detail__next" href={`#/projects/${next.slug}`}><span>NEXT PROJECT</span><strong>{next.title}</strong><span aria-hidden="true">↗</span></a>
    </main>
  </div>;
}
