import { useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { ProjectGallery } from '../../projects/ProjectGallery.tsx';
import { EnquiryEstimator } from './EnquiryEstimator.tsx';
import { ScrollConstructionHero } from './ScrollConstructionHero.tsx';
import { WindowExperience } from './WindowExperience.tsx';
import { useHomeMotion } from './useHomeMotion.ts';
import { useHomeScreenViewModel } from './HomeScreen.vm.ts';
import './HomeScreen.css';
import './EnquiryDialog.css';

const services = [
  { id: 'constructions-section', index: '01', eyebrow: 'BUILD', name: 'MK Constructions', line: 'Structures shaped around how life unfolds.', copy: 'From feasibility and foundation to handover, one accountable team coordinates engineering, materials and execution.', image: '/images/structure.webp', logo: '/logos/mk-constructions.svg', division: 'constructions' as const },
  { id: 'interiors-section', index: '02', eyebrow: 'DESIGN', name: 'MK Design Interiors', line: 'Rooms with rhythm, warmth and purpose.', copy: 'Spatial planning, custom joinery, lighting and honest materials are resolved as part of the architecture.', image: '/images/interiors.webp', logo: '/logos/mk-interiors.svg', division: 'interiors' as const },
  { id: 'windows-section', index: '03', eyebrow: 'PERFECT', name: 'MK Precision Windows', line: 'Slim profiles. Expansive views. Quiet rooms.', copy: 'Made to measure uPVC windows and doors complete the envelope with precise installation and clean sightlines.', image: '/images/windows.webp', logo: '/logos/mk-windows.svg', division: 'windows' as const },
];

function Comparison() {
  const [comparison, setComparison] = useState(50);
  const setFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const value = Math.min(95, Math.max(5, Math.round((event.clientX - bounds.left) / bounds.width * 100)));

    setComparison(value);
  };
  const key = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const changes: Record<string, number> = { ArrowLeft: -5, ArrowRight: 5, PageDown: -10, PageUp: 10 };
    if (event.key === 'Home') { event.preventDefault(); setComparison(5); }
    else if (event.key === 'End') { event.preventDefault(); setComparison(95); }
    else if (event.key in changes) { event.preventDefault(); setComparison(Math.min(95, Math.max(5, comparison + changes[event.key]))); }
  };
  return <section className="mk-compare mk-reveal" aria-labelledby="comparison-title">
    <div className="mk-section-head"><span>05 / TRANSFORMATION</span><h2 id="comparison-title">One structure.<br/><em>A complete environment.</em></h2></div>
    <div id="comparison-container" className="mk-compare__frame" style={{ '--compare': `${comparison}%` } as React.CSSProperties} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFromPointer(e); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e); }} onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}>
      <img src="/images/comparison-after.webp" alt="Completed contemporary living space" loading="lazy" decoding="async" />
      <div className="mk-compare__before"><img src="/images/comparison-before.webp" alt="The same space during structural construction" loading="lazy" decoding="async" /></div>
      <span className="mk-compare__label mk-compare__label--before">CONSTRUCTION</span><span className="mk-compare__label mk-compare__label--after">COMPLETION</span>
      <button type="button" className="mk-compare__handle" style={{ left: `${comparison}%` }} role="slider" aria-label="Before and after comparison" aria-valuemin={5} aria-valuemax={95} aria-valuenow={comparison} aria-valuetext={`${comparison}% construction image visible`} onKeyDown={key}><span aria-hidden="true">↔</span></button>
    </div>
  </section>;
}

export function HomeScreen() {
  const root = useRef<HTMLDivElement>(null);
  const vm = useHomeScreenViewModel();
  useHomeMotion(root);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); vm.submitEnquiry(event.currentTarget); };
  return <div ref={root} className="mk-site">
    <div className="mk-page-progress" aria-hidden="true" />
    <a className="mk-skip" href="#hero">Skip to content</a>
    <header className="mk-header">
      <a className="mk-header__brand" href="#hero" aria-label="MK Group of Companies home"><img src="/logos/mk-group.svg" alt="MK Group of Companies" /></a>
      <nav aria-label="Main navigation">
        <a href="#services">Disciplines</a><a href="#process">Process</a><a href="#projects">Projects</a><a href="#contact">Contact</a>
      </nav>
      <button className="mk-header__enquire" type="button" onClick={() => vm.openModal()}>Enquire</button>
      <button className="mk-header__menu" type="button" aria-label="Toggle navigation" aria-expanded={vm.menuOpen} aria-controls="mobile-menu" onClick={() => vm.setMenuOpen(!vm.menuOpen)}>MENU</button>
      {vm.menuOpen && <div id="mobile-menu" className="mk-header__mobile"><a href="#services" onClick={() => vm.setMenuOpen(false)}>Disciplines</a><a href="#process" onClick={() => vm.setMenuOpen(false)}>Process</a><a href="#projects" onClick={() => vm.setMenuOpen(false)}>Projects</a><button type="button" onClick={() => vm.openModal()}>Start an enquiry</button></div>}
    </header>
    <main>
      <ScrollConstructionHero onEnquire={() => vm.openModal('complete')} />
      <section className="mk-intro mk-reveal" id="who-we-are" aria-labelledby="intro-title">
        <p className="mk-kicker">THREE EXPERTISES / ONE VISION</p>
        <div><h2 id="intro-title">A home is strongest when every discipline speaks the same language.</h2><p>MK Group of Companies unites construction, interior design and precision windows under one coordinated process. Fewer gaps. Clearer decisions. A more resolved place to live.</p></div>
        <dl><div><dt>One</dt><dd>Accountable team</dd></div><div><dt>Three</dt><dd>Integrated disciplines</dd></div><div><dt>Complete</dt><dd>From site to handover</dd></div></dl>
      </section>
      <section id="services" className="mk-services" aria-labelledby="services-title">
        <div className="mk-section-head mk-reveal"><span>02 / THE ECOSYSTEM</span><h2 id="services-title">Specialists in their craft.<br/><em>Aligned from day one.</em></h2></div>
        {services.map((service) => <article id={service.id} className="mk-service mk-reveal" key={service.id}>
          <div className="mk-service__visual"><img src={service.image} alt="" loading="lazy" decoding="async" /></div>
          <div className="mk-service__copy"><span>{service.index} / {service.eyebrow}</span><img src={service.logo} alt="" aria-hidden="true" /><h3>{service.line}</h3><p>{service.copy}</p><button type="button" onClick={() => vm.openModal(service.division)}>Consult the team <span aria-hidden="true">↗</span></button></div>
        </article>)}
      </section>
      <WindowExperience />
      <section id="process" className="mk-process mk-reveal" aria-labelledby="process-title">
        <div className="mk-section-head"><span>03 / ONE ACCOUNTABLE PROCESS</span><h2 id="process-title">From first line<br/><em>to final light.</em></h2></div>
        <ol><li><span>01</span><div><h3>Discover</h3><p>Site, ambition, priorities and budget are understood before solutions are drawn.</p></div></li><li><span>02</span><div><h3>Resolve</h3><p>Architecture, interiors and the building envelope are coordinated as one system.</p></div></li><li><span>03</span><div><h3>Build</h3><p>Sequenced execution, measured quality checks and clear progress keep work accountable.</p></div></li><li><span>04</span><div><h3>Complete</h3><p>Final details, commissioning and handover bring every discipline into alignment.</p></div></li></ol>
      </section>
      <ProjectGallery />
      <Comparison />
      <section id="contact" className="mk-closing mk-reveal">
        <span>06 / BEGIN A CONVERSATION</span><h2>Bring us the site.<br/>We’ll shape what comes next.</h2><button type="button" onClick={() => vm.openModal()}>Plan your project <span aria-hidden="true">↗</span></button>
      </section>
    </main>
    <footer className="mk-footer"><img src="/logos/mk-group.svg" alt="MK Group of Companies" /><p>Construction · Interior design · Precision windows</p><a href="https://wa.me/919344237897" target="_blank" rel="noreferrer">WhatsApp ↗</a><small>© {new Date().getFullYear()} MK Group of Companies</small></footer>
    <div id="consultation-modal" className={`mk-modal ${vm.modalOpen ? 'is-open' : ''}`} aria-hidden={!vm.modalOpen} inert={!vm.modalOpen} onMouseDown={(e) => { if (e.target === e.currentTarget) vm.closeModal(); }}>
      <aside className="mk-modal__aside">
        <img src="/logos/mk-group.svg" alt="" aria-hidden="true" />
        <div><span>PROJECT BRIEF / MK GROUP</span><h2>One conversation.<br/>A clearer way forward.</h2><p>Choose the disciplines you need, configure an initial scope and review a live planning estimate before continuing in WhatsApp.</p></div>
        <ol><li><span>01</span><strong>Introduce the site</strong></li><li><span>02</span><strong>Define the scope</strong></li><li><span>03</span><strong>Review the estimate</strong></li><li><span>04</span><strong>Continue with MK</strong></li></ol>
        <p className="mk-modal__aside-note">Indicative estimate · No obligation · Direct WhatsApp conversation</p>
      </aside>
      <div id="modal-panel" className="mk-modal__panel" role="dialog" aria-modal="true" aria-label="Architectural consultation">
        <div className="mk-modal__head"><div><span>PROJECT ENQUIRY</span><h2>Tell us what you’re planning.</h2><div className="mk-modal__steps" aria-hidden="true"><span>01 / CONTACT</span><span>02 / SCOPE</span><span>03 / ESTIMATE</span></div></div><button type="button" aria-label="Close modal" onClick={vm.closeModal}>×</button></div>
        <form id="project-form" noValidate onSubmit={submit}>
          <div className="mk-form-grid">
            <label htmlFor="enquiry-name">FULL NAME *<input id="enquiry-name" name="full_name" required autoComplete="name" placeholder="Your name" aria-invalid={Boolean(vm.fieldErrors.full_name)} aria-describedby={vm.fieldErrors.full_name ? 'enquiry-name-error' : undefined} onBlur={(event) => vm.validateField('full_name', event.currentTarget.value)} />{vm.fieldErrors.full_name && <small id="enquiry-name-error" className="mk-field-error">{vm.fieldErrors.full_name}</small>}</label>
            <label htmlFor="enquiry-email">EMAIL ADDRESS<input id="enquiry-email" type="email" name="email_address" autoComplete="email" placeholder="name@example.com" aria-invalid={Boolean(vm.fieldErrors.email_address)} aria-describedby={vm.fieldErrors.email_address ? 'enquiry-email-error' : undefined} onBlur={(event) => vm.validateField('email_address', event.currentTarget.value)} />{vm.fieldErrors.email_address && <small id="enquiry-email-error" className="mk-field-error">{vm.fieldErrors.email_address}</small>}</label>
            <label htmlFor="enquiry-phone">PHONE NUMBER *<input id="enquiry-phone" name="phone_number" required inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" aria-invalid={Boolean(vm.fieldErrors.phone_number)} aria-describedby={vm.fieldErrors.phone_number ? 'enquiry-phone-error' : undefined} onBlur={(event) => vm.validateField('phone_number', event.currentTarget.value)} />{vm.fieldErrors.phone_number && <small id="enquiry-phone-error" className="mk-field-error">{vm.fieldErrors.phone_number}</small>}</label>
            <label htmlFor="enquiry-location">SITE LOCATION / CITY *<input id="enquiry-location" name="site_location_city" required autoComplete="address-level2" placeholder="City or site location" aria-invalid={Boolean(vm.fieldErrors.site_location_city)} aria-describedby={vm.fieldErrors.site_location_city ? 'enquiry-location-error' : undefined} onBlur={(event) => vm.validateField('site_location_city', event.currentTarget.value)} />{vm.fieldErrors.site_location_city && <small id="enquiry-location-error" className="mk-field-error">{vm.fieldErrors.site_location_city}</small>}</label>
          </div>
          <EnquiryEstimator vm={vm} />
          <section className="mk-engineers" aria-labelledby="engineers-title">
            <div className="mk-engineers__intro"><span>YOUR PROJECT TEAM</span><h3 id="engineers-title">Reviewed by civil engineers.</h3><p>Your enquiry is reviewed directly by MK's engineering team before the conversation continues.</p></div>
            <div className="mk-engineers__list">
              <article><span className="mk-engineers__portrait" aria-hidden="true">P</span><div><strong>Praveen</strong><small>B.E. Civil Engineering</small><small>6 years' experience</small></div></article>
              <article><span className="mk-engineers__portrait" aria-hidden="true">D</span><div><strong>Dhilip Kumar</strong><small>B.E. Civil Engineering</small><small>6 years' experience</small></div></article>
            </div>
          </section>
          <label className="mk-form-notes">BRIEF PROJECT NOTES<textarea name="brief_project_notes" rows={4} placeholder="Timeline, site status, priorities or anything useful." /></label>
          {vm.formError && <p role="alert" className="mk-form-error">{vm.formError}</p>}
          {vm.whatsappUrl && <p role="status" className="mk-form-status">Your enquiry is ready. Review it and press Send in WhatsApp. <a href={vm.whatsappUrl} target="_blank" rel="noreferrer">Open it again ↗</a></p>}
          <button className="mk-form-submit" type="submit">Send inquiry on WhatsApp <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </div>
  </div>;
}
