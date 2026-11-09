import { useT } from "../i18n/index";
import React, { useEffect, useMemo, useState } from 'react';
import { getUILanguage } from '../i18n/index';
import { localizePlace } from '../data/translations/placeContent';
function distanceLabel(place) {
  const value = Number.isFinite(place.distanceKm) ? `${place.distanceKm < 1 ? Math.round(place.distanceKm * 1000) : place.distanceKm.toFixed(1)}${place.distanceKm < 1 ? ' m' : ' km'}` : place.distance || 'Nearby';
  return `${place.approx ? '~' : ''}${value}`;
}
export default function WhatNextView({
  currentPlace,
  plan,
  onEat,
  onContinue,
  onRest,
  onSkip,
  onEndDay
}) {
  const t = useT();
  const language = getUILanguage();
  const localizedCurrent = localizePlace(currentPlace, language);
  const dining = plan.eatNearby.places.map((entry, index) => ({
    ...entry,
    ...(localizedCurrent?.nearbyDining?.find((restaurant) => restaurant.name === entry.name) ||
      localizedCurrent?.nearbyDining?.[index] || {}),
  }));
  const [selectedDining, setSelectedDining] = useState(dining[0]?.name || '');
  const [showChoices, setShowChoices] = useState(false);
  const selectedPlace = useMemo(() => dining.find(place => place.name === selectedDining), [dining, selectedDining]);
  useEffect(() => { setSelectedDining(dining[0]?.name || ''); }, [currentPlace?.id, language]);
  const next = plan.nextStop;
  const mealLabel = plan.eatNearby.mealWindow?.label || 'Meal';
  const canContinue = Boolean(next?.feasible);
  return <div className="min-h-screen bg-background px-4 pb-28 pt-5 animate-fade-in"><div className="mx-auto max-w-2xl space-y-5">
    <header><p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">{t("text|NEXT STEP")}</p><h1 className="mt-1 text-3xl font-black text-primary">{t("text|Choose what feels right")}</h1><p className="mt-2 text-sm text-on-surface-variant">{t("text|You’ve finished")}{localizedCurrent?.localizedName || currentPlace?.title}{t("text|. It’s")}{plan.currentTimeLabel}.</p></header>
    {plan.fatigue.recommended && <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>{t("text|A short rest may help.")}</strong><p className="mt-1 text-xs">{t("text|You’ve walked about")}{plan.fatigue.timeWalkedMinutes}{t("text|minutes. Rest for")}{plan.fatigue.restMinutes}{t("text|minutes before continuing.")}</p></aside>}
    <section className="rounded-3xl bg-primary p-5 text-on-primary"><p className="text-xs font-bold uppercase tracking-widest text-secondary-fixed">{t("text|Your next stop")}</p>{next ? <><h2 className="mt-2 text-xl font-bold">{canContinue ? t('next.continueTo', { place: next.place.title }) : t('next.closing', { place: next.place.title })}</h2><p className="mt-1 text-sm text-on-primary-container">{next.eta}{t("text|arrival ·")}{next.travelLabel} · {next.visitMinutes}{t("text|min visit")}</p></> : <><h2 className="mt-2 text-xl font-bold">{t("text|You’ve reached the end of today’s plan")}</h2><p className="mt-1 text-sm text-on-primary-container">{t("text|Your trip summary includes the way back to your hotel.")}</p></>}</section>
    <button onClick={() => setShowChoices(open => !open)} aria-expanded={showChoices} className="min-h-12 w-full rounded-2xl border border-outline-variant/40 bg-white text-sm font-bold text-primary">{showChoices ? t('next.hideOther') : t('next.other')}</button>
    {showChoices && <section className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-4">
      <div><h2 className="font-bold text-primary">{t("text|Eat nearby")}</h2><p className="mt-1 text-xs text-on-surface-variant">{plan.eatNearby.vegetarianOnly ? `${t('next.vegetarianOptions')} · ` : ''}{mealLabel}{t("text|· distances from this stop")}</p>{dining.length ? <div className="mt-3 space-y-2">{dining.map(place => <label key={place.name} className="flex min-h-11 items-center gap-3 rounded-xl border border-outline-variant/30 p-3"><input type="radio" name="nearby-dining" checked={selectedDining === place.name} onChange={() => setSelectedDining(place.name)} /><span className="flex-1 text-xs"><strong className="block text-primary">{place.name}</strong>{place.cuisine || t('next.nearbyDining')} · {distanceLabel(place)}</span></label>)}</div> : <p className="mt-2 text-xs text-on-surface-variant">{t("text|No saved places match your group’s food preferences.")}</p>}<button disabled={!selectedPlace} onClick={() => selectedPlace && onEat(selectedPlace)} className="mt-3 min-h-11 w-full rounded-xl border border-outline-variant/40 text-sm font-bold text-primary disabled:opacity-50">{t("text|Eat at selected place")}</button></div>
      <div className="grid grid-cols-2 gap-2"><button onClick={() => onRest(plan.fatigue.restMinutes, canContinue)} className="min-h-11 rounded-xl border border-outline-variant/40 px-2 text-xs font-bold text-primary">{t("text|Rest")}{plan.fatigue.restMinutes}{t("text|min")}</button><button disabled={!next} onClick={() => next && onSkip(next.place)} className="min-h-11 rounded-xl border border-outline-variant/40 px-2 text-xs font-bold text-primary disabled:opacity-50">{t("text|Skip next stop")}</button></div>
      <button onClick={onEndDay} className="min-h-11 w-full rounded-xl border border-outline-variant/40 text-sm font-bold text-primary">{t("text|End day")}</button>
    </section>}
  </div><footer className="fixed inset-x-0 bottom-0 border-t border-outline-variant/30 bg-white/95 px-4 pb-safe pt-3 backdrop-blur"><div className="mx-auto max-w-2xl"><button onClick={() => canContinue ? onContinue(next.place) : onEndDay()} className="min-h-12 w-full rounded-2xl bg-primary text-sm font-bold text-on-primary">{canContinue ? t('next.goTo', { place: next.place.title }) : t('next.finish')}</button></div></footer></div>;
}
