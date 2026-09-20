export const constructionTiers = {
  luxury: { label: 'Luxury', rate: 2500 },
  premium: { label: 'Premium', rate: 2000 },
  standard: { label: 'Standard', rate: 1900 },
} as const;

// Illustrative planning values only. Replace with approved MK window pricing.
export const windowTiers = {
  sliding: { label: 'Standard uPVC sliding', rate: 900 },
  acoustic: { label: 'Acoustic double glazing', rate: 1200 },
  slimline: { label: 'Premium slimline', rate: 1500 },
} as const;

export type ConstructionTier = keyof typeof constructionTiers;
export type WindowTier = keyof typeof windowTiers;
export type EnquiryServices = { construction: boolean; interiors: boolean; windows: boolean };

export function calculateEnquiryEstimate(
  services: EnquiryServices,
  constructionTier: ConstructionTier,
  windowTier: WindowTier,
  builtUpArea: number,
  glazingArea: number,
) {
  const lines = [];
  if (services.construction) {
    const tier = constructionTiers[constructionTier];
    lines.push({ label: `Construction · ${tier.label}`, area: builtUpArea, rate: tier.rate, amount: builtUpArea * tier.rate });
  }
  if (services.windows) {
    const tier = windowTiers[windowTier];
    lines.push({ label: `Windows · ${tier.label}`, area: glazingArea, rate: tier.rate, amount: glazingArea * tier.rate });
  }
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0), interiorsExcluded: services.interiors };
}

export const formatInr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
