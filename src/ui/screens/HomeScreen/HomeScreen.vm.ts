import { useEffect, useRef, useState } from 'react';
import { calculateEnquiryEstimate, type ConstructionTier, type EnquiryServices, type InteriorTier, type WindowTier } from './enquiryPricing.ts';
import { buildWhatsAppEnquiry, buildWhatsAppUrl, defaultWhatsAppNumber } from './whatsappEnquiry.ts';

export type EnquiryField = 'full_name' | 'email_address' | 'phone_number' | 'site_location_city';
type FieldErrors = Partial<Record<EnquiryField, string>>;

const validateValue = (name: EnquiryField, value: string): string => {
  const clean = value.trim();
  if (name === 'full_name' && clean.length < 2) return 'Enter your full name.';
  if (name === 'phone_number' && !/^\+?[\d\s()-]{10,18}$/.test(clean)) return 'Enter a valid phone number with at least 10 digits.';
  if (name === 'site_location_city' && clean.length < 2) return 'Enter the project city or site location.';
  if (name === 'email_address' && clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'Enter a valid email address or leave this field empty.';
  return '';
};

export function useHomeScreenViewModel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState<EnquiryServices>({ construction: true, interiors: false, windows: false });
  const [constructionTier, setConstructionTier] = useState<ConstructionTier>('standard');
  const [interiorTier, setInteriorTier] = useState<InteriorTier>('glossy');
  const [windowTier, setWindowTier] = useState<WindowTier>('sliding');
  const [squareFeet, setSquareFeet] = useState(500);
  const [interiorSquareFeet, setInteriorSquareFeet] = useState(500);
  const [windowSquareFeet, setWindowSquareFeet] = useState(500);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const lastTrigger = useRef<HTMLElement | null>(null);
  const estimate = calculateEnquiryEstimate(services, constructionTier, interiorTier, windowTier, squareFeet, interiorSquareFeet, windowSquareFeet);

  const openModal = (division?: 'constructions' | 'interiors' | 'windows' | 'complete') => {
    lastTrigger.current = document.activeElement as HTMLElement;
    setFieldErrors({});
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

  const validateField = (name: EnquiryField, value: string) => {
    const message = validateValue(name, value);
    setFieldErrors(current => ({ ...current, [name]: message || undefined }));
  };

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    if (!modalOpen) return;
    const panel = document.getElementById('modal-panel');
    const focusable = () => [...(panel?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]') ?? [])].filter(item => !item.hasAttribute('disabled'));
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

  const submitEnquiry = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const nextErrors: FieldErrors = {};
    (['full_name', 'email_address', 'phone_number', 'site_location_city'] as EnquiryField[]).forEach(name => {
      const message = validateValue(name, value(name));
      if (message) nextErrors[name] = message;
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError('Check the highlighted contact details.');
      const first = Object.keys(nextErrors)[0];
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    if (!Object.values(services).some(Boolean)) {
      setFormError('Select at least one service for your enquiry.');
      form.querySelector<HTMLElement>('input[name="discipline"]')?.focus();
      return;
    }
    try {
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
      setFormError('WhatsApp could not open. Please try again or call MK Group directly.');
    }
  };

  return {
    menuOpen, setMenuOpen, modalOpen, openModal, closeModal,
    services, setServices, constructionTier, setConstructionTier, interiorTier, setInteriorTier, windowTier, setWindowTier,
    squareFeet, setSquareFeet, interiorSquareFeet, setInteriorSquareFeet, windowSquareFeet, setWindowSquareFeet, estimate,
    fieldErrors, validateField, formError, whatsappUrl, submitEnquiry,
  };
}
