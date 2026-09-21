export const constructionTiers = {
  standard: { label: 'Standard', rate: 2000 },
  premium: { label: 'Premium', rate: 2300 },
  luxury: { label: 'Luxury', rate: 3000 },
} as const;

export const interiorTiers = {
  glossy: { label: 'Glossy', rate: 360 },
  texture: { label: 'Texture', rate: 390 },
  magma: { label: 'Magma', rate: 450 },
  gold: { label: 'Gold', rate: 500 },
  diamond: { label: 'Diamond', rate: 520 },
} as const;

export const windowTiers = {
  sliding: { label: 'Sliding (2-track / 3-track)', rate: 390 },
  slidingMesh: { label: 'Sliding with mesh', rate: 430 },
  open: { label: 'Openable', rate: 490 },
  openMesh: { label: 'Openable with mesh', rate: 530 },
  fixed: { label: 'Fixed', rate: 45 },
} as const;

export type ConstructionTier = keyof typeof constructionTiers;
export type InteriorTier = keyof typeof interiorTiers;
export type WindowTier = keyof typeof windowTiers;
export type EnquiryServices = { construction: boolean; interiors: boolean; windows: boolean };

export function calculateEnquiryEstimate(
  services: EnquiryServices,
  constructionTier: ConstructionTier,
  interiorTier: InteriorTier,
  windowTier: WindowTier,
  builtUpArea: number,
  interiorArea: number,
  glazingArea: number,
) {
  const lines = [];
  if (services.construction) {
    const tier = constructionTiers[constructionTier];
    lines.push({ label: `Construction · ${tier.label}`, area: builtUpArea, rate: tier.rate, amount: builtUpArea * tier.rate });
  }
  if (services.interiors) {
    const tier = interiorTiers[interiorTier];
    lines.push({ label: `Interiors · ${tier.label}`, area: interiorArea, rate: tier.rate, amount: interiorArea * tier.rate });
  }
  if (services.windows) {
    const tier = windowTiers[windowTier];
    lines.push({ label: `uPVC · ${tier.label}`, area: glazingArea, rate: tier.rate, amount: glazingArea * tier.rate });
  }
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
}

export const formatInr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;