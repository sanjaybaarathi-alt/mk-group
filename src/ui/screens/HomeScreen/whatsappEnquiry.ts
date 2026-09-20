import { constructionTiers, formatInr, windowTiers, type ConstructionTier, type EnquiryServices, type WindowTier } from './enquiryPricing.ts';

export const defaultWhatsAppNumber = '919344237897';

type EnquiryDetails = {
  name: string;
  email: string;
  phone: string;
  location: string;
  propertyType: string;
  notes: string;
  services: EnquiryServices;
  constructionTier: ConstructionTier;
  builtUpArea: number;
  windowTier: WindowTier;
  glazingArea: number;
  estimatedTotal: number;
};

export function buildWhatsAppEnquiry(details: EnquiryDetails): string {
  const serviceNames = [
    details.services.construction && 'MK Constructions',
    details.services.interiors && 'MK Design Interriors',
    details.services.windows && 'MK Precision Windows',
  ].filter(Boolean).join(', ');
  const lines = [
    'Hello MK Group,',
    '',
    "I'm interested in your services. Please contact me about this project.",
    '',
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    `Email: ${details.email}`,
    `Service: ${serviceNames}`,
    `Location: ${details.location}`,
    `Property type: ${details.propertyType}`,
  ];
  if (details.services.construction) {
    lines.push(`Construction: ${constructionTiers[details.constructionTier].label}, ${details.builtUpArea.toLocaleString('en-IN')} sq ft built-up area`);
  }
  if (details.services.windows) {
    lines.push(`Windows: ${windowTiers[details.windowTier].label}, ${details.glazingArea.toLocaleString('en-IN')} sq ft glazing area (sample rate)`);
  }
  if (details.estimatedTotal) lines.push(`Indicative priced-services subtotal: ${formatInr(details.estimatedTotal)}`);
  if (details.services.interiors) lines.push('Interior design: separate quotation requested');
  if (details.notes) lines.push('', 'Project notes:', details.notes);
  lines.push('', 'Please contact me regarding this requirement.', '— Inquiry from MK Group Website');
  return lines.join('\n');
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) throw new Error('Invalid WhatsApp destination number');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
