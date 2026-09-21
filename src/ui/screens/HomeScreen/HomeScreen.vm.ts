import { useEffect, useRef, useState } from 'react';
import stages from './ecosystemStages.json';
import { calculateEnquiryEstimate, type ConstructionTier, type EnquiryServices, type InteriorTier, type WindowTier } from './enquiryPricing.ts';
import { buildWhatsAppEnquiry, buildWhatsAppUrl, defaultWhatsAppNumber } from './whatsappEnquiry.ts';

type Division = 'constructions' | 'interiors' | 'windows' | 'process';

export function useHomeScreenViewModel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [activeDivision, setActiveDivision] = useState<Division>('constructions');
  const navigationTarget = useRef<Division | null>(null);
  const [services, setServices] = useState<EnquiryServices>({ construction: true, interiors: false, windows: false });
  const [constructionTier, setConstructionTier] = useState<ConstructionTier>('standard');
  const [interiorTier, setInteriorTier] = useState<InteriorTier>('glossy');
  const [windowTier, setWindowTier] = useState<WindowTier>('sliding');
  const [squareFeet, setSquareFeet] = useState(500);
  const [interiorSquareFeet, setInteriorSquareFeet] = useState(500);
  const [windowSquareFeet, setWindowSquareFeet] = useState(500);
  const estimate = calculateEnquiryEstimate(services, constructionTier, interiorTier, windowTier, squareFeet, interiorSquareFeet, windowSquareFeet);
  const [comparison, setComparison] = useState(50);
  const [preset, setPreset] = useState('living');
  const [formError, setFormError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const lastTrigger = useRef<HTMLElement | null>(null);

  const openModal = (division?: 'constructions' | 'interiors' | 'windows' | 'complete') => {
    lastTrigger.current = document.activeElement as HTMLElement;
    setFormError('');
    setWhatsappUrl('');
    if (division) setServices({
      construction: division === 'constructions' || division === 'complete',
      interiors: division === 'interiors' || division === 'complete',
      windows: division === 'windows' || division === 'complete',
    });
    setModalOpen(true);
    setMenuOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    requestAnimationFrame(() => lastTrigger.current?.focus());
  };

  const selectDivision = (division: Division) => {
    navigationTarget.current = division;
    setActiveDivision(division);
    window.setTimeout(() => {
      if (navigationTarget.current === division) navigationTarget.current = null;
    }, 1800);
  };

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    if (!modalOpen) return;
    const panel = document.getElementById('modal-panel');
    const focusable = () => [...(panel?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]') ?? [])];
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const targets = [
      ['hero', 'constructions'],
      ['constructions-section', 'constructions'],
      ['interiors-section', 'interiors'],
      ['windows-section', 'windows'],
      ['process', 'process'],
    ] as const;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const division = targets.find(([id]) => id === entry.target.id)?.[1];
        if (!division) continue;
        if (navigationTarget.current && navigationTarget.current !== division) continue;
        navigationTarget.current = null;
        setActiveDivision(division);
      }
    }, { rootMargin: '-22% 0px -55% 0px' });
    targets.forEach(([id]) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
    return () => observer.disconnect();
  }, []);

  const submitEnquiry = (form: HTMLFormElement) => {
    if (!Object.values(services).some(Boolean)) {
      setFormError('Select at least one service for your enquiry.');
      return;
    }
    try {
      const data = new FormData(form);
      const value = (key: string) => String(data.get(key) ?? '').trim();
      const message = buildWhatsAppEnquiry({
        name: value('full_name'), email: value('email_address'), phone: value('phone_number'),
        location: value('site_location_city'), propertyType: value('property_type'),
        notes: value('brief_project_notes'), services, constructionTier, builtUpArea: squareFeet,
        interiorTier, interiorArea: interiorSquareFeet, windowTier, glazingArea: windowSquareFeet, estimatedTotal: estimate.total,
      });
      const url = buildWhatsAppUrl(import.meta.env.VITE_WHATSAPP_NUMBER || defaultWhatsAppNumber, message);
      setFormError('');
      setWhatsappUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setFormError('WhatsApp could not open. Please try again.');
    }
  };

  return {
    menuOpen, setMenuOpen, modalOpen, openModal, closeModal,
    stage, setStage, stageContent: stages[stage], activeDivision, selectDivision,
    services, setServices, constructionTier, setConstructionTier, interiorTier, setInteriorTier, windowTier, setWindowTier,
    squareFeet, setSquareFeet, interiorSquareFeet, setInteriorSquareFeet, windowSquareFeet, setWindowSquareFeet, estimate,
    comparison, setComparison, preset, setPreset,
    formError, whatsappUrl, submitEnquiry,
  };
}
