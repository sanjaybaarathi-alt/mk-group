import type { useHomeScreenViewModel } from './HomeScreen.vm.ts';
import { constructionTiers, formatInr, interiorTiers, windowTiers, type ConstructionTier, type EnquiryServices, type InteriorTier, type WindowTier } from './enquiryPricing.ts';
import './EnquiryEstimator.css';

type ViewModel = ReturnType<typeof useHomeScreenViewModel>;
const serviceChoices: { key: keyof EnquiryServices; label: string }[] = [
  { key: 'construction', label: 'MK Constructions' },
  { key: 'interiors', label: 'MK Design Interriors' },
  { key: 'windows', label: 'MK Precision Windows' },
];

function AreaControl({ id, name, label, value, max, onChange }: { id: string; name: string; label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <>
    <div className="mk-estimator__range-head"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value.toLocaleString('en-IN')} sq ft</output></div>
    <input id={id} name={name} type="range" min="50" max={max} step="10" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <div className="mk-estimator__range-ends"><span>50 sq ft</span><span>{max.toLocaleString('en-IN')} sq ft</span></div>
  </>;
}

export function EnquiryEstimator({ vm }: { vm: ViewModel }) {
  const hasService = Object.values(vm.services).some(Boolean);
  return <div className="mk-estimator">
    <fieldset className="mk-estimator__services">
      <legend>DISCIPLINES REQUIRED <span>(SELECT ALL THAT APPLY)</span></legend>
      <div className="mk-estimator__service-grid">{serviceChoices.map(({ key, label }) => <label key={key} className={vm.services[key] ? 'is-selected' : ''}><input type="checkbox" name="discipline" value={label} checked={vm.services[key]} onChange={() => vm.setServices({ ...vm.services, [key]: !vm.services[key] })} /><span>{label}</span></label>)}</div>
    </fieldset>
    <div className="mk-estimator__field"><label htmlFor="project-property-type">PROPERTY TYPE</label><select id="project-property-type" name="property_type" defaultValue="Independent home"><option>Independent home</option><option>Villa</option><option>Penthouse</option><option>Commercial space</option></select></div>
    {vm.services.construction && <div className="mk-estimator__group">
      <div className="mk-estimator__group-head"><span>01 / CONSTRUCTION</span><strong>Built-up area</strong></div><label htmlFor="construction-tier">CONSTRUCTION PACKAGE</label>
      <select id="construction-tier" name="construction_tier" value={vm.constructionTier} onChange={(event) => vm.setConstructionTier(event.target.value as ConstructionTier)}>{Object.entries(constructionTiers).map(([key, tier]) => <option key={key} value={key}>{tier.label} · {formatInr(tier.rate)} / sq ft</option>)}</select>
      <div className="mk-estimator__range-head"><label htmlFor="construction-area">BUILT-UP SQUARE FEET</label><output htmlFor="construction-area">{vm.squareFeet.toLocaleString('en-IN')} sq ft</output></div><input id="construction-area" name="construction_area_sqft" type="range" min="500" max="25000" step="50" value={vm.squareFeet} onChange={(event) => vm.setSquareFeet(Number(event.target.value))} /><div className="mk-estimator__range-ends"><span>500 sq ft</span><span>25,000 sq ft</span></div>
    </div>}
    {vm.services.interiors && <div className="mk-estimator__group">
      <div className="mk-estimator__group-head"><span>02 / INTERIORS</span><strong>Interior area</strong></div><label htmlFor="interior-tier">INTERIOR PACKAGE</label>
      <select id="interior-tier" name="interior_tier" value={vm.interiorTier} onChange={(event) => vm.setInteriorTier(event.target.value as InteriorTier)}>{Object.entries(interiorTiers).map(([key, tier]) => <option key={key} value={key}>{tier.label} · {formatInr(tier.rate)} / sq ft</option>)}</select>
      <AreaControl id="interior-area" name="interior_area_sqft" label="INTERIOR SQUARE FEET" value={vm.interiorSquareFeet} max={25000} onChange={vm.setInteriorSquareFeet} />
    </div>}
    {vm.services.windows && <div className="mk-estimator__group">
      <div className="mk-estimator__group-head"><span>03 / PRECISION WINDOWS</span><strong>Glazing area</strong></div><label htmlFor="window-tier">UPVC WINDOW TYPE</label>
      <select id="window-tier" name="window_tier" value={vm.windowTier} onChange={(event) => vm.setWindowTier(event.target.value as WindowTier)}>{Object.entries(windowTiers).map(([key, tier]) => <option key={key} value={key}>{tier.label} · {formatInr(tier.rate)} / sq ft</option>)}</select>
      <AreaControl id="window-area" name="window_area_sqft" label="WINDOW / GLAZING SQUARE FEET" value={vm.windowSquareFeet} max={10000} onChange={vm.setWindowSquareFeet} />
    </div>}
    <div className="mk-estimator__summary" aria-live="polite" aria-atomic="true"><div className="mk-estimator__summary-title"><span>INDICATIVE ESTIMATE</span><span>INR</span></div>{vm.estimate.lines.map((line) => <div className="mk-estimator__line" key={line.label}><span>{line.label}<small>{line.area.toLocaleString('en-IN')} sq ft × {formatInr(line.rate)}</small></span><strong>{formatInr(line.amount)}</strong></div>)}<div className="mk-estimator__total"><span>Estimated total</span><output aria-label="Indicative total">{hasService ? formatInr(vm.estimate.total) : 'On request'}</output></div>{!hasService && <p>Select a discipline to see an estimate.</p>}<p>Planning figure only. Final pricing depends on measurements, site conditions, specifications, and a formal quotation.</p></div>
    <input type="hidden" name="indicative_estimate_inr" value={vm.estimate.total} />
  </div>;
}
