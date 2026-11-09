import React, { useMemo, useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';
import { useT } from '../i18n';

/**
 * Destination step. Choosing a destination only saves it to the trip setup and
 * advances the wizard — it never opens a monument or the Explore screen.
 */
const DESTINATIONS = [{
  id: 'delhi-ncr',
  name: 'Delhi NCR',
  taglineKey: 'destination.tagline.delhi',
  cities: ['New Delhi', 'Old Delhi'],
  image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop',
  icon: 'account_balance'
}, {
  id: 'old-delhi',
  name: 'Old Delhi',
  taglineKey: 'destination.tagline.oldDelhi',
  cities: ['Old Delhi'],
  image: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?q=80&w=1200&auto=format&fit=crop',
  icon: 'mosque'
}];
export { DESTINATIONS };
export default function DestinationView({
  monuments = [],
  selectedId,
  onSelect,
  onBack
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const matchingDestinations = useMemo(() => DESTINATIONS.filter(destination => {
    const search = query.trim().toLowerCase();
    return !search || `${destination.name} ${destination.tagline} ${destination.cities.join(' ')}`.toLowerCase().includes(search);
  }), [query]);
  const countFor = destination => monuments.filter(m => destination.cities.includes(m.city)).length;
  return <StepShell step={2} title={t('destination.heading')} subtitle={t('destination.help')} onBack={onBack}>
      <div className="space-y-3">
        <label className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="material-symbols-outlined text-outline">search</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('destination.search')} aria-label={t('destination.search')} className="w-full bg-transparent outline-none text-sm text-on-surface placeholder:text-outline" />
        </label>
        {matchingDestinations.map(destination => {
        const count = countFor(destination);
        const isSelected = selectedId === destination.id;
        return <button key={destination.id} onClick={() => onSelect(destination)} disabled={count === 0} className={`w-full text-left rounded-3xl overflow-hidden border transition-all transform active:scale-[0.99] shadow-sm disabled:opacity-50 ${isSelected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-outline-variant/40 bg-white hover:border-outline'}`}>
              <div className="relative h-36 w-full">
                <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-on-primary">
                  <div>
                    <h3 className="font-display text-xl font-bold">{destination.name}</h3>
                    <p className="font-sans text-[11px] text-on-primary-container">{t(destination.taglineKey)}</p>
                  </div>
                  <span className="flex items-center gap-1 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[13px]">{destination.icon}</span>
                    {count}{t("text|sites")}</span>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {destination.cities.join(' · ')}
                </span>
                <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                  {isSelected ? t('destination.selected') : t('destination.planHere')}
                  <span className="material-symbols-outlined text-[15px]">
                    {isSelected ? 'check_circle' : 'arrow_forward'}
                  </span>
                </span>
              </div>
            </button>;
      })}
        {matchingDestinations.length === 0 && <div className="rounded-2xl border border-outline-variant/30 bg-white p-5 text-center">
            <span className="material-symbols-outlined text-outline text-3xl">travel_explore</span>
            <p className="font-semibold text-sm text-primary mt-2">{t('destination.empty')}</p>
            <p className="text-xs text-on-surface-variant mt-1">{t("text|Delhi is available now. More destinations are coming soon.")}</p>
          </div>}
      </div>

      <p className="mt-4 text-[11px] text-outline text-center">
        {t('destination.more')}
      </p>
    </StepShell>;
}
