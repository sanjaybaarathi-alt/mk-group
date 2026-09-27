import { projects } from './projects.ts';
import { beginProjectTransition } from '../reusables/ArchitecturalReveal/projectTransition.ts';
import './projects.css';

export function ProjectGallery() {
  return <section id="projects" className="mk-projects mk-section" aria-labelledby="mk-projects-title">
    <div className="mk-projects__intro"><div><span className="mk-projects__eyebrow">04 / CONCEPT PORTFOLIO</span><h2 id="mk-projects-title">Ideas shaped into place.</h2></div><p>Explore architectural concept studies across construction, interiors and precision windows.</p></div>
    <div className="mk-projects__grid">
      {projects.map((project, index) => <article className="mk-projects__item" key={project.slug}>
        <a className="mk-projects__card" href={`/projects/${project.slug}`} onClick={(event) => beginProjectTransition(event, project.slug, project.images[0].src)} aria-label={`View ${project.title} concept study`}><img className="mk-projects__card-image" src={project.images[0].src} alt="" loading="lazy" decoding="async" />
          <span className="mk-projects__card-index">0{index + 1} / 0{projects.length}</span>
          <span className="mk-projects__card-arrow" aria-hidden="true">↗</span>
          <span className="mk-projects__card-copy"><small>{project.category} · {project.location}</small><strong>{project.title}</strong><span>VIEW PROJECT <span aria-hidden="true">→</span></span></span>
        </a>
      </article>)}
    </div>
  </section>;
}
