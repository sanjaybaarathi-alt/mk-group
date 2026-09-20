import { Fragment, createElement, useRef, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import parse, { attributesToProps, domToReact, Element as DomElement, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import originalDesign from '../../../../initialCut.html?raw';
import { ArchitecturalJourney } from '../../reusables/ArchitecturalJourney/ArchitecturalJourney.tsx';
import { ProjectGallery } from '../../projects/ProjectGallery.tsx';
import { photoSources, stagePhotos } from './imageAssets.ts';
import { useHomeScreenViewModel } from './HomeScreen.vm.ts';
import { useHomeMotion } from './useHomeMotion.ts';
import { WindowExperience } from './WindowExperience.tsx';
import { EnquiryEstimator } from './EnquiryEstimator.tsx';
import './interactions.css';

const body = originalDesign.match(/<body[^>]*>([\s\S]*?)<!-- ==================== JAVASCRIPT MICRO-INTERACTIONS/)?.[1] ?? '';
let formField = 0;
const designMarkup = body
  .replace('group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto', 'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto')
  .replace(/<button([^>]*id="comp-btn-(?:glazing|millwork)"[^>]*)>[\s\S]*?<\/button>/g, '')
  .replace(/<label([^>]*)>([\s\S]*?)<\/label>\s*<(input|select|textarea)([^>]*)>/g, (_match, labelAttrs: string, labelText: string, tag: string, inputAttrs: string) => {
    const id = `enquiry-field-${++formField}`;
    const name = labelText.replace(/<[^>]+>/g, '').replace(/\*/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return `<label${labelAttrs} for="${id}">${labelText}</label><${tag}${inputAttrs} id="${id}" name="${name}">`;
  });
const originalPhotos = [...designMarkup.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((match) => match[1]);
const localPhotos = new Map(originalPhotos.map((source, index) => [source, photoSources[index]]));

const DIVISION_LOGOS = {
  constructions: '/logos/mk-constructions.svg',
  interiors: '/logos/mk-interiors.svg',
  windows: '/logos/mk-windows.svg',
} as const;

function ancestorWithId(node: DomElement, ids: readonly string[]): string | undefined {
  let parent = node.parent;
  while (parent) {
    if (parent instanceof DomElement && ids.includes(parent.attribs?.id)) return parent.attribs.id;
    parent = parent.parent;
  }
}

function hasAncestor(node: DomElement, name: string): boolean {
  let parent = node.parent;
  while (parent) {
    if (parent instanceof DomElement && parent.name === name) return true;
    parent = parent.parent;
  }
  return false;
}

export function HomeScreen(): ReactNode {
  const root = useRef<HTMLElement>(null);
  const liveComparison = useRef(50);
  const vm = useHomeScreenViewModel();
  useHomeMotion(root);

  const setComparisonFromPointer = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const value = Math.min(95, Math.max(5, Math.round(((event.clientX - bounds.left) / bounds.width) * 100)));
    liveComparison.current = value;
    event.currentTarget.style.setProperty('--compare', `${value}%`);
    event.currentTarget.querySelector<HTMLElement>('#comp-divider')?.setAttribute('aria-valuenow', String(value));
  };

  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof DomElement)) return;
      if (node.name === 'script') return <></>;
      const attrs = node.attribs ?? {};
      const id = attrs.id;
      const originalClick = attrs.onclick ?? '';
      const props = attributesToProps(attrs) as Record<string, unknown>;
      delete props.onClick;
      delete props.onInput;
      delete props.onSubmit;
      delete props.onclick;
      delete props.oninput;
      delete props.onsubmit;
      const children = domToReact(node.children as DOMNode[], options);
      let tag = node.name;
      if (node.name === 'section' && id !== 'hero') props.className = `${props.className} mk-section`;

      if (node.name === 'a' && attrs['data-cursor'] === 'MK') {
        props.className = 'inline-flex items-center';
        return createElement('a', props, <img src="/logos/mk-group.svg" alt="MK Group of Companies" className="h-12 w-auto max-w-[180px]" />);
      }

      if (node.name === 'img') {
        props.src = localPhotos.get(attrs.src) ?? attrs.src;
        props.alt = attrs['data-alt'] ?? '';
        props.loading = node.attribs.id === 'eco-image' || node.parent?.parent && (node.parent.parent as DomElement).attribs?.id === 'hero' ? 'eager' : 'lazy';
        if (props.loading === 'eager') props.fetchPriority = 'high';
        props.decoding = 'async';
        props.width = 1600;
        props.height = 1000;
        if (id === 'eco-image') {
          props.src = stagePhotos[vm.stage].src;
          props.alt = stagePhotos[vm.stage].alt;
          props.key = `stage-photo-${vm.stage}`;
          props.className = `${props.className} mk-stage-photo`;
        }
      }
      if (node.name === 'input' && attrs.type === 'checkbox' && 'checked' in props) {
        props.defaultChecked = true;
        delete props.checked;
      }
      if (node.name === 'textarea') return createElement(tag, props);
      if (node.name === 'h1' && ancestorWithId(node, ['hero'])) return createElement(tag, props,
        <span className="mk-hero-line"><span>FROM FOUNDATION</span></span>,
        <span className="mk-hero-line"><span><em className="mk-hero-accent">TO FINISHING</em> TOUCHES.</span></span>,
      );

      if (id === 'mobile-nav') props.className = String(props.className).replace('hidden lg:hidden', vm.menuOpen ? 'block lg:hidden' : 'hidden lg:hidden');
      if (attrs['aria-label'] === 'Toggle navigation') props['aria-expanded'] = vm.menuOpen;
      if (id === 'consultation-modal') {
        props.className = String(props.className).replace(vm.modalOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 pointer-events-none', vm.modalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none');
        props.role = 'presentation';
        props['aria-hidden'] = !vm.modalOpen;
      }
      if (id === 'modal-panel') {
        props.className = String(props.className).replace('translate-x-full', vm.modalOpen ? 'translate-x-0' : 'translate-x-full');
        props.role = 'dialog';
        props['aria-modal'] = vm.modalOpen;
        props['aria-label'] = 'Architectural consultation';
      }
      if (id?.startsWith('eco-tab-')) {
        const active = Number(id.at(-1)) === vm.stage;
        props.className = String(props.className)
          .replace('bg-primary text-surface', '')
          .replace('text-on-surface-variant', '') + (active ? ' bg-primary text-surface' : ' text-on-surface-variant');
        props['aria-pressed'] = active;
        props.className = `${props.className} mk-stage-tab`;
      }
      if (id === 'ecosystem-display') {
        props.key = `stage-panel-${vm.stage}`;
        props.className = `${props.className} mk-stage-panel`;
      }
      if (id === 'eco-tag') return createElement(tag, props, vm.stageContent.tag);
      if (id === 'eco-subtitle') return createElement(tag, props, vm.stageContent.subtitle);
      if (id === 'eco-title') return createElement(tag, props, vm.stageContent.title);
      if (id === 'eco-description') return createElement(tag, props, vm.stageContent.desc);
      const spec = id?.match(/^eco-spec-(\d)$/);
      if (spec) return createElement(tag, props, vm.stageContent[`spec${spec[1]}` as keyof typeof vm.stageContent]);
      if (id === 'comparison-container') {
        props.style = { ...(props.style as object), touchAction: 'pan-y', '--compare': `${vm.comparison}%` };
        props.className = `${props.className} mk-comparison`;
        props.onPointerDown = (event: PointerEvent<HTMLElement>) => {
          gsap.killTweensOf(event.currentTarget);
          event.currentTarget.classList.add('is-dragging');
          event.currentTarget.setPointerCapture(event.pointerId);
          setComparisonFromPointer(event);
        };
        props.onPointerMove = (event: PointerEvent<HTMLElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) setComparisonFromPointer(event); };
        props.onPointerUp = (event: PointerEvent<HTMLElement>) => { event.currentTarget.classList.remove('is-dragging'); vm.setComparison(liveComparison.current); };
        props.onPointerCancel = (event: PointerEvent<HTMLElement>) => { event.currentTarget.classList.remove('is-dragging'); };
      }
      if (id === 'before-wrapper') { props.style = { ...(props.style as object), width: 'var(--compare)' }; props.className = `${props.className} mk-comparison__before`; }
      if (id === 'comp-divider') {
        props.style = { ...(props.style as object), left: 'var(--compare)' };
        props.className = `${props.className} mk-comparison__divider`;
        props.role = 'slider'; props.tabIndex = 0; props['aria-label'] = 'Before and after comparison';
        props['aria-valuemin'] = 5; props['aria-valuemax'] = 95; props['aria-valuenow'] = vm.comparison;
        props.onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); vm.setComparison(Math.max(5, vm.comparison - 5)); }
          if (event.key === 'ArrowRight') { event.preventDefault(); vm.setComparison(Math.min(95, vm.comparison + 5)); }
        };
      }
      if (id?.startsWith('comp-btn-')) {
        const active = id.slice(9) === vm.preset;
        props['aria-pressed'] = active;
        props.className = String(props.className).replace('bg-primary text-surface', '').replace('border border-outline-variant/50 text-on-surface', '') + (active ? ' bg-primary text-surface' : ' border border-outline-variant/50 text-on-surface');
      }
      if (id === 'project-form') {
        props.onSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); vm.submitEnquiry(event.currentTarget); };
        return createElement(tag, props, children,
          vm.formError && <p key="form-error" role="alert" className="text-error text-sm">{vm.formError}</p>,
          vm.whatsappUrl && <p key="whatsapp-next" role="status" className="text-sm leading-relaxed">WhatsApp will show your completed enquiry. Review it and press Send there. If the chat did not open, <a className="underline font-semibold" href={vm.whatsappUrl} target="_blank" rel="noopener noreferrer">open it here</a>.</p>,
        );
      }
      if (attrs['data-cursor'] === 'EXPLORE' && node.name === 'button') {
        tag = 'a'; props.href = '#who-we-are'; delete props.type;
        props.onClick = () => vm.setMenuOpen(false);
        return createElement(tag, props, children);
      }
      if (attrs['data-cursor'] === 'VIEW ↗' && node.name === 'div') {
        tag = 'article';
        props.className = String(props.className).replace('cursor-pointer', '');
        return createElement(tag, props, children);
      }
      if (node.name === 'h3') {
        const divisionId = ancestorWithId(node, ['constructions-section', 'interiors-section', 'windows-section']);
        const division = divisionId?.replace('-section', '') as keyof typeof DIVISION_LOGOS | undefined;
        if (division && division in DIVISION_LOGOS) {
          return createElement(Fragment, null,
            <img src={DIVISION_LOGOS[division]} alt="" aria-hidden="true" className="h-12 w-auto max-w-[210px] mb-5" />,
            createElement(tag, props, children),
          );
        }
      }
      if (originalClick) {
        props.onClick = () => {
          if (originalClick.includes('openModal')) {
            const section = ancestorWithId(node, ['constructions-section', 'interiors-section', 'windows-section']);
            const division = section?.replace('-section', '') as 'constructions' | 'interiors' | 'windows' | undefined;
            vm.openModal(division ?? (ancestorWithId(node, ['ecosystem-display']) ? (['constructions', 'interiors', 'windows', 'complete'] as const)[vm.stage] : undefined));
          }
          else if (originalClick.includes('closeModal')) vm.closeModal();
          else if (originalClick.includes('toggleMobileMenu')) vm.setMenuOpen(!vm.menuOpen);
          else if (originalClick.includes('switchEcosystemTab')) vm.setStage(Number(originalClick.match(/\d/)?.[0] ?? 0));
          else if (originalClick.includes('setComparisonPreset')) { vm.setPreset(originalClick.match(/'(.*?)'/)?.[1] ?? 'living'); vm.setComparison(50); }
        };
        if (node.name === 'div') { tag = 'button'; props.type = 'button'; }
      }
      if (node.name === 'button') props.type = attrs.type ?? 'button';
      if (node.name === 'a' && attrs.href === '#hero' && node.children?.some((child) => child.type === 'text' && 'data' in child && String(child.data).includes('Constructions'))) props.href = '#constructions-section';
      if (node.name === 'a' && hasAncestor(node, 'nav')) {
        const division = props.href === '#constructions-section' ? 'constructions' : props.href === '#interiors-section' ? 'interiors' : props.href === '#windows-section' ? 'windows' : props.href === '#process' ? 'process' : undefined;
        if (division) {
          props.className = `${String(props.className).replace('border-b-2 border-secondary', '')} mk-nav-link ${vm.activeDivision === division ? 'is-active' : ''}`;
          props['aria-current'] = vm.activeDivision === division ? 'location' : undefined;
          props.onClick = () => { vm.selectDivision(division); vm.setMenuOpen(false); };
        }
      }
      if (id === 'project-form') props.noValidate = false;
      if (node.name === 'a' && attrs.href === '#') { tag = 'span'; delete props.href; }
      if (node.name === 'a' && attrs.href?.startsWith('#') && attrs.href !== '#' && !hasAncestor(node, 'nav')) {
        props.onClick = () => vm.setMenuOpen(false);
      }
      if (id === 'consultation-modal' && !vm.modalOpen) props.inert = true;
      if (id === 'estimate-controls') return <EnquiryEstimator vm={vm} />;
      if (id === 'window-experience') return <WindowExperience />;
      if (id === 'projects') return <ProjectGallery />;
      if (id === 'ecosystem-display') return <Fragment>
        {createElement(tag, props, children)}
        <ArchitecturalJourney stage={vm.stage} onStageChange={vm.setStage} />
      </Fragment>;
      if (id === 'hero') return <Fragment>
        {createElement(tag, { ...props, className: `${props.className} mk-hero` }, children,
          <div className="mk-hero__viewfinder" aria-hidden="true"><span>MK / 01</span><span>FORM × FUNCTION</span></div>,
          <div className="mk-hero__index" aria-hidden="true">01 — 04 <span>CONSTRUCT / DESIGN / COMPLETE</span></div>,
        )}
        <div className="mk-discipline-band" aria-hidden="true"><div className="mk-discipline-band__track">
          <span>CONSTRUCT</span><i /> <span>DESIGN</span><i /> <span>PERFECT</span><i /> <span>LIVE</span><i />
          <span>CONSTRUCT</span><i /> <span>DESIGN</span><i /> <span>PERFECT</span><i /> <span>LIVE</span><i />
        </div></div>
      </Fragment>;
      if (['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'].includes(tag)) return createElement(tag, props);
      return createElement(tag, props, children);
    },
  };

  return <div ref={root as React.RefObject<HTMLDivElement>} className="bg-surface text-on-surface font-body-md antialiased selection:bg-secondary selection:text-surface-container-lowest overflow-x-hidden">
    <div className="mk-page-progress" aria-hidden="true" />
    <a href="#hero" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:bg-surface focus:p-3">Skip to content</a>
    {parse(designMarkup, options)}
  </div>;
}
