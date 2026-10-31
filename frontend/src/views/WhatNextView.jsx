import React, { useMemo, useState } from 'react';

function distanceLabel(place) {
  const value = Number.isFinite(place.distanceKm) ? `${place.distanceKm < 1 ? Math.round(place.distanceKm * 1000) : place.distanceKm.toFixed(1)}${place.distanceKm < 1 ? ' m' : ' km'}` : (place.distance || 'Nearby');
  return `${place.approx ? '~' : ''}${value}`;
}

export default function WhatNextView({ currentPlace, plan, onEat, onContinue, onRest, onSkip, onEndDay }) {
  const dining = plan.eatNearby.places;
  const [selectedDining, setSelectedDining] = useState(dining[0]?.name || '');
  const selectedPlace = useMemo(() => dining.find((place) => place.name === selectedDining), [dining, selectedDining]);
  const next = plan.nextStop;
  const mealLabel = plan.eatNearby.mealWindow?.label || 'Meal';

  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-10 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-5">
        <header>
          <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">TRIP MEMORY · NEXT STEP</p>
          <h1 className="font-display text-3xl font-black text-primary mt-1">What next?</h1>
          <p className="text-sm text-on-surface-variant mt-2">You’ve completed {currentPlace?.title}. It’s {plan.currentTimeLabel}; choose what feels right.</p>
        </header>

        {plan.fatigue.recommended && (
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3" role="status">
            <span className="material-symbols-outlined text-amber-800">self_improvement</span>
            <div>
              <p className="text-xs font-bold text-amber-950">A little rest may help</p>
              <p className="text-[11px] text-amber-900 mt-1">About {plan.fatigue.timeWalkedMinutes} minutes of walking so far. Sarthi suggests a {plan.fatigue.restMinutes}-minute pause{plan.fatigue.level === 'high' ? ' before another long visit' : ''}.</p>
            </div>
          </aside>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-3xl border border-secondary/30 bg-white p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined">restaurant</span>
              <p className="text-[10px] uppercase tracking-widest font-bold">{plan.eatNearby.recommended ? `${mealLabel} time` : 'Take a food break'}</p>
            </div>
            <h2 className="font-display text-xl font-bold text-primary mt-2">Eat nearby</h2>
            <p className="text-xs text-on-surface-variant mt-1">{plan.eatNearby.vegetarianOnly ? 'Vegetarian options only' : 'Nearby places from this stop'} · {currentPlace?.title}</p>
            {dining.length ? (
              <div className="mt-3 space-y-2 flex-1">
                {dining.map((place) => (
                  <label key={place.name} className={`flex items-start gap-2 rounded-2xl border p-3 cursor-pointer ${selectedDining === place.name ? 'border-primary bg-primary/5' : 'border-outline-variant/30'}`}>
                    <input type="radio" name="nearby-dining" value={place.name} checked={selectedDining === place.name} onChange={() => setSelectedDining(place.name)} className="mt-0.5 accent-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-primary">{place.name}</span>
                      <span className="block text-[10px] text-on-surface-variant mt-0.5">{place.cuisine || 'Nearby dining'} · {distanceLabel(place)}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-surface-container-low p-3 text-[11px] text-on-surface-variant mt-3 flex-1">No nearby dining options match this group’s food preferences in the saved place data.</p>
            )}
            <button onClick={() => selectedPlace && onEat(selectedPlace)} disabled={!selectedPlace} className="w-full min-h-11 rounded-xl bg-secondary text-on-secondary text-xs font-bold mt-4 disabled:opacity-40">
              {selectedPlace ? `Eat at ${selectedPlace.name} · then ${next?.feasible ? 'continue' : 'return'}` : 'No matching place saved'}
            </button>
            <p className="text-[9px] leading-relaxed text-outline mt-2">Distances use saved approximate restaurant coordinates. Confirm the route locally before setting out.</p>
          </section>

          <section className="rounded-3xl border border-primary/25 bg-primary p-5 shadow-sm text-on-primary flex flex-col">
            <div className="flex items-center gap-2 text-secondary-fixed">
              <span className="material-symbols-outlined">route</span>
              <p className="text-[10px] uppercase tracking-widest font-bold">Your next stop</p>
            </div>
            {next ? (
              <>
                <h2 className="font-display text-xl font-bold mt-2">Continue to {next.place.title}</h2>
                <p className="text-xs text-on-primary-container mt-1">Estimated arrival {next.eta} · {next.travelLabel} travel · {next.visitMinutes} min visit</p>
                {next.closingTime && <p className="text-[10px] text-on-primary-container mt-2">Saved hours: closes at {next.closingTime}{next.feasible ? '' : ` · ${next.reason}`}</p>}
                <div className="mt-4 flex-1 rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-secondary-fixed">Remaining plan order</p>
                  {plan.orderedRemaining.map((item, index) => <p key={item.place.id} className="text-[11px] mt-1">{index + 1}. {item.place.title} · {item.eta}{item.feasible ? '' : ` · ${item.reason}`}</p>)}
                </div>
                <button onClick={() => onContinue(next.place)} disabled={!next.feasible} className="w-full min-h-11 rounded-xl bg-secondary text-on-secondary text-xs font-bold mt-4 disabled:opacity-50">{next.feasible ? `Go to ${next.place.title}` : 'Not open in time · choose another option'}</button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold mt-2">No planned stops remain</h2>
                <p className="text-xs text-on-primary-container mt-1 flex-1">Head back to your hotel or finish the day here.</p>
                <button onClick={onEndDay} className="w-full min-h-11 rounded-xl bg-secondary text-on-secondary text-xs font-bold mt-4">End day · see trip summary</button>
              </>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold text-primary">Other choices</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <button onClick={() => onRest(plan.fatigue.restMinutes, Boolean(next?.feasible))} className="min-h-11 rounded-xl border border-outline-variant/40 text-xs font-bold text-primary px-3">Rest {plan.fatigue.restMinutes} min · {next?.feasible ? 'continue' : 'end day'}</button>
            <button onClick={() => next && onSkip(next.place)} disabled={!next} className="min-h-11 rounded-xl border border-outline-variant/40 text-xs font-bold text-primary px-3 disabled:opacity-40">Skip {next ? next.place.title : 'next stop'}</button>
            <button onClick={onEndDay} className={`min-h-11 rounded-xl border text-xs font-bold px-3 ${plan.endDayRecommended ? 'border-secondary bg-secondary/5 text-primary' : 'border-outline-variant/40 text-primary'}`}>{plan.endDayRecommended ? 'End day · recommended' : 'End day · return to hotel'}</button>
          </div>
        </section>
      </div>
    </div>
  );
}

