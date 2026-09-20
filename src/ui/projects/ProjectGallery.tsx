import type { PointerEvent } from 'react';
import { projects } from './projects.ts';
import { beginProjectTransition } from '../reusables/ArchitecturalReveal/projectTransition.ts';
import './projects.css';

function tilt(event: PointerEvent<HTMLAnchorElement>) {
  if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  event.currentTarget.style.setProperty('--tilt-x', `${-y * 7}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${x * 7}deg`);
  event.currentTarget.style.setProperty('--light-x', `${(x + .5) * 100}%`);
  event.currentTarget.style.setProperty('--light-y', `${(y + .5) * 100}%`);
}

function reset(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg');
  event.currentTarget.style.setProperty('--tilt-y', '0deg');
}

export function ProjectGallery() {
  return <section id="projects" className="mk-projects mk-section" aria-labelledby="mk-projects-title">
    <div className="mk-projects__intro"><div><span className="mk-projects__eyebrow">04 / SELECTED WORK</span><h2 id="mk-projects-title">Spaces with a story.</h2></div><p>Explore each project as a visual case study. Select a card to see its gallery and project particulars.</p></div>
    <div className="mk-projects__grid">
      {projects.map((project, index) => <article className="mk-projects__item" key={project.slug}>
        <a className="mk-projects__card" href={`#/projects/${project.slug}`} onClick={(event) => beginProjectTransition(event, project.slug, project.images[0].src)} onPointerMove={tilt} onPointerLeave={reset} aria-label={`View ${project.title} case study`} style={{ backgroundImage: `linear-gradient(180deg, rgba(12,18,17,.16), transparent 38%, rgba(12,18,17,.82)), url(${project.images[0].src})` }}>
          <span className="mk-projects__card-index">0{index + 1} / 0{projects.length}</span>
          <span className="mk-projects__card-arrow" aria-hidden="true">↗</span>
          <span className="mk-projects__card-copy"><small>{project.category} · {project.location}</small><strong>{project.title}</strong><span>VIEW PROJECT <span aria-hidden="true">→</span></span></span>
        </a>
      </article>)}
    </div>
  </section>;
}
