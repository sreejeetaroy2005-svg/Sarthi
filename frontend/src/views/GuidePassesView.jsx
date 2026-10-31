import React, { useMemo, useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';
import { hasGuidePass } from '../lib/entitlements';

const OFFICIAL_TICKETS_URL = 'https://asi.paygov.org.in/asi-webapp/#/ticketbooking';

function uniquePlaces(places = []) {
  const seen = new Set();
  return places.filter((place) => place?.id && !seen.has(place.id) && seen.add(place.id));
}

function formatMoney(value) {
  return `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`;
}

export default function GuidePassesView({
  places = [],
  dayPlaces = [],
  entitlements,
  onDemoUnlock,
  onStartTrip,
  onBack,
}) {
  const selectedPlaces = useMemo(() => uniquePlaces(places), [places]);
  const firstDayPlaces = useMemo(() => uniquePlaces(dayPlaces), [dayPlaces]);
  const [notice, setNotice] = useState('');
  const soloTotal = selectedPlaces.reduce((sum, place) => sum + (Number(place.guidePassPrice) || 79), 0);
  const firstDayTotal = firstDayPlaces.reduce((sum, place) => sum + (Number(place.guidePassPrice) || 79), 0);
  const dayPrice = Math.max(49, Math.round(firstDayTotal * 0.75));
  const tripPrice = Math.max(49, Math.round(soloTotal * 0.65));
  const familyPrice = Math.max(99, Math.round(tripPrice * 1.55));
  const alreadyUnlocked = selectedPlaces.filter((place) => hasGuidePass(entitlements, place.id)).length;

  const unlock = (offer) => {
    onDemoUnlock(offer);
    setNotice('Demo unlock — payments coming soon. Your guide access is saved on this device.');
  };

  return (
    <StepShell
      step={9}
      eyebrow="STEP 9 OF 9 · YOUR GUIDE PASSES"
      title="Make every stop come alive"
      subtitle="Spend less time figuring things out and more time inside each place. Entry tickets are separate from Sarthi Guide Passes."
      onBack={onBack}
      wide
      footer={(
        <div>
          <button
            onClick={onStartTrip}
            className="w-full min-h-12 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-md hover:bg-primary-container"
          >
            {alreadyUnlocked ? 'Continue to your trip' : 'Start trip with free preview'}
          </button>
        </div>
      )}
    >
      <div className="space-y-5 pb-3">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined">headphones</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">Free · always available</p>
            </div>
            <h2 className="font-display text-xl font-bold text-primary mt-2">Plan freely</h2>
            <ul className="mt-3 space-y-2 text-xs text-on-surface-variant">
              <li>• Build and edit your full itinerary</li>
              <li>• Preview every place before you go</li>
              <li>• Listen to a 30-second audio sample per place</li>
              <li>• Keep your plan and saved places on this device</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-primary/20 bg-primary p-5 shadow-sm text-on-primary">
            <div className="flex items-center gap-2 text-secondary-fixed">
              <span className="material-symbols-outlined">auto_awesome</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">Sarthi Guide Pass</p>
            </div>
            <h2 className="font-display text-xl font-bold mt-2">A guide that follows your day</h2>
            <p className="text-xs text-on-primary-container mt-2 leading-relaxed">
              Arrival briefings, photo check-in, authored walking routes, voice questions and a shareable trip story.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-on-primary-container">
              <li>✓ Know what to expect before entering</li><li>✓ Follow landmark-based stops at your pace</li><li>✓ Save the moments you checked in at</li>
            </ul>
          </article>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-primary">Choose your pass</h2>
              <p className="text-xs text-on-surface-variant mt-1">Demo prices for your {selectedPlaces.length} planned place{selectedPlaces.length === 1 ? '' : 's'}.</p>
            </div>
            <span className="text-[10px] text-outline text-right">No payment is collected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <article className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-sans font-bold text-primary">Per-place pass</h3>
                  <p className="text-[11px] text-on-surface-variant mt-1">Unlock only the stops you choose.</p>
                </div>
                <span className="material-symbols-outlined text-secondary">location_on</span>
              </div>
              <div className="mt-4 divide-y divide-outline-variant/20">
                {selectedPlaces.map((place) => {
                  const unlocked = hasGuidePass(entitlements, place.id);
                  return (
                    <div key={place.id} className="py-3 flex items-center gap-3">
                      <img src={place.image} alt="" className="w-12 h-12 object-cover rounded-xl" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-on-surface truncate">{place.title}</p>
                        <p className="text-[10px] text-outline">Guide Pass · {formatMoney(place.guidePassPrice || 79)}</p>
                      </div>
                      <button
                        onClick={() => unlock({ offerId: `place:${place.id}`, placeIds: [place.id], peopleLimit: 1 })}
                        disabled={unlocked}
                        className="min-h-10 rounded-xl bg-primary/5 px-3 text-[10px] font-bold text-primary disabled:bg-emerald-50 disabled:text-emerald-800"
                      >
                        {unlocked ? 'Unlocked' : 'Demo unlock'}
                      </button>
                    </div>
                  );
                })}
                {!selectedPlaces.length && <p className="py-4 text-xs text-on-surface-variant">No itinerary places are selected yet.</p>}
              </div>
            </article>

            <div className="space-y-3">
              {[
                { id: 'day-pass', name: 'Day Pass', price: dayPrice, save: firstDayTotal - dayPrice, icon: 'today', people: 1, placeIds: firstDayPlaces.map((place) => place.id), description: 'All planned stops on Day 1.' },
                { id: 'trip-bundle', name: 'Trip Bundle', price: tripPrice, save: soloTotal - tripPrice, icon: 'route', people: 1, description: 'All planned stops across your trip.' },
                { id: 'family-pass', name: 'Family Pass', price: familyPrice, save: Math.max(0, soloTotal * 5 - familyPrice), icon: 'family_restroom', people: 5, description: 'Trip Bundle access for up to 5 people.' },
              ].map((offer) => (
                <article key={offer.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${offer.id === 'trip-bundle' ? 'border-secondary/60 ring-1 ring-secondary/25' : 'border-outline-variant/30'}`}>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary mt-0.5">{offer.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="font-sans font-bold text-sm text-primary">{offer.name}</h3>
                        {offer.save > 0 && <span className="text-[9px] rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 font-bold">Save {formatMoney(offer.save)} · {Math.round(offer.save / Math.max(1, (offer.price + offer.save)) * 100)}% vs per-place</span>}
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{offer.description}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-display text-lg font-bold text-primary">{formatMoney(offer.price)}</span>
                        <button
                          onClick={() => unlock({ offerId: offer.id, placeIds: offer.placeIds || selectedPlaces.map((place) => place.id), peopleLimit: offer.people })}
                          disabled={offer.id === 'day-pass' ? !firstDayPlaces.length : !selectedPlaces.length}
                          className="min-h-10 rounded-xl bg-secondary px-3.5 text-[10px] font-bold text-on-secondary disabled:opacity-40"
                        >
                          Demo unlock
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {notice && (
          <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
            {notice}
          </p>
        )}

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-primary">Why Sarthi?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs text-on-surface-variant">
            <p><span className="material-symbols-outlined text-secondary align-middle mr-1">translate</span>Stories and answers in your language.</p>
            <p><span className="material-symbols-outlined text-secondary align-middle mr-1">near_me</span>Guidance shaped around where you are.</p>
            <p><span className="material-symbols-outlined text-secondary align-middle mr-1">accessibility_new</span>A pace that considers your group.</p>
          </div>
          <p className="text-[10px] text-outline mt-4">Guide Passes are Sarthi digital guide access. They are not monument entry tickets.</p>
          <a
            href={OFFICIAL_TICKETS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 rounded-xl border border-outline-variant/50 px-3 py-2 text-xs font-bold text-primary hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
            Official tickets · ASI
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </section>
      </div>
    </StepShell>
  );
}

