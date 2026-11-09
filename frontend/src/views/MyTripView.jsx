import { useT } from "../i18n/index";
import React from 'react';
export default function MyTripView({
  itinerary,
  activeTrip,
  onPlan,
  onContinue
}) {
  const t = useT();
  const places = (itinerary?.days || []).flatMap(day => day.stops || []);
  return <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-8">
    <h1 className="text-3xl font-black text-primary">{t("text|Your trip")}</h1>
    {places.length ? <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-primary">{itinerary.destinationName || 'Your planned places'}</h2><ol className="mt-3 space-y-3">{places.map((place, i) => <li key={`${place.id}-${i}`} className="text-sm text-on-surface">{i + 1}. {place.title || place.name || place.id}</li>)}</ol></section> : <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-on-surface-variant">{t("text|Your plan will appear here after you choose a destination.")}</p>}
    <button onClick={activeTrip ? onContinue : onPlan} className="mt-6 min-h-12 w-full rounded-2xl bg-primary text-sm font-bold text-on-primary">{activeTrip ? 'Continue your trip' : 'Plan a new trip'}</button>
  </main>;
}
