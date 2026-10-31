import React, { useEffect, useState } from 'react';
import WizardProgress from '../components/PlanWizard/WizardProgress';
import {
  PACE_LABELS,
  TRAVEL_MODE_LABELS,
  formatDateLabel,
  formatDuration,
  moveStopToDay,
  moveStopWithinDay,
  removeStop,
} from '../lib/planner';

/**
 * ItineraryView — the timed, editable version of the traveler's Day Plan.
 *
 * Day tabs hold the scheduled stops. Every edit (up/down, move to another day,
 * remove) goes back through the planner so the clock, travel legs and totals
 * are recalculated from scratch.
 */
export default function ItineraryView({
  itinerary,
  onUpdateSetup,
  onChange,
  onBack,
  onOpenOverview,
  onSelectMonument,
  onShowToast,
  showProgress = false,
}) {
  const [activeDay, setActiveDay] = useState(0);

  const dayCount = itinerary?.days?.length || 0;

  // Keep the active tab valid when days are added or removed.
  useEffect(() => {
    if (activeDay > dayCount - 1) setActiveDay(0);
  }, [dayCount, activeDay]);

  const setup = itinerary?.setup || {};
  const days = itinerary?.days || [];
  const day = days[activeDay];
  const totals = itinerary?.totals;

  const handleMove = (stopId, index, direction) => {
    onChange(moveStopWithinDay(itinerary, activeDay, index, direction));
  };

  const handleMoveToDay = (stopId, targetDayIndex) => {
    onChange(moveStopToDay(itinerary, activeDay, stopId, targetDayIndex));
    setActiveDay(targetDayIndex);
    const stop = day.stops.find((entry) => entry.id === stopId);
    onShowToast?.(`Moved ${stop?.title || 'stop'} to Day ${targetDayIndex + 1}`, 'event_available');
  };

  const handleRemove = (stopId) => {
    const stop = day.stops.find((entry) => entry.id === stopId);
    onChange(removeStop(itinerary, activeDay, stopId));
    onShowToast?.(`Removed ${stop?.title || 'stop'} from the itinerary`, 'delete');
  };

  const toggleSetup = (key) => onUpdateSetup?.({ [key]: !setup[key] });

  const buildTimeline = (currentDay) => {
    const entries = [];
    if (currentDay.break && !currentDay.break.afterStopId) {
      entries.push({ type: 'break', key: 'break-top' });
    }
    currentDay.stops.forEach((stop, index) => {
      entries.push({ type: 'stop', key: stop.id, stop, index });
      if (currentDay.break?.afterStopId === stop.id) {
        entries.push({ type: 'break', key: `break-${stop.id}` });
      }
    });
    if (currentDay.break && !entries.some((entry) => entry.type === 'break')) {
      entries.push({ type: 'break', key: 'break-end' });
    }
    return entries;
  };

  return (
    <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-surface-container transition-colors shrink-0"
            title="Back to select places"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-black text-primary truncate">Your Itinerary</h1>
            <p className="font-sans text-xs text-on-surface-variant mt-0.5">
              {totals
                ? `${totals.stops} stop${totals.stops === 1 ? '' : 's'} over ${totals.days} day${totals.days === 1 ? '' : 's'}`
                : 'Timed and travel-aware'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOverview}
          disabled={!totals?.stops}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-full transition-all shadow-sm disabled:opacity-40 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          <span>Trip overview</span>
        </button>
      </div>

      {showProgress && <WizardProgress step={7} className="mt-1" />}

      {!itinerary || !days.length ? (
        <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl space-y-4">
          <span className="material-symbols-outlined text-outline text-5xl">route</span>
          <h3 className="font-sans font-bold text-on-surface text-base">No itinerary yet</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
            Add monuments to your Day Plan, then build an itinerary to get a timed route with travel and breaks.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full shadow-sm"
          >
            Go to Day Plan
          </button>
        </div>
      ) : (
        <>
          {/* Trip setup */}
          <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-sans font-bold text-primary text-base">Trip settings</h2>
                <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                  Changing these rebuilds the schedule from your Day Plan.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary-fixed/30 border border-secondary-fixed/50 px-2.5 py-1 rounded-full shrink-0">
                {PACE_LABELS[setup.pace] || 'Balanced'} pace
              </span>
            </div>

            <div className="flex flex-wrap items-end gap-6">
              {/* Days stepper */}
              <div>
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Days</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => onUpdateSetup?.({ days: Math.max(1, (setup.days || 1) - 1) })}
                    disabled={(setup.days || 1) <= 1}
                    className="w-8 h-8 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container disabled:opacity-30"
                    title="Fewer days"
                  >
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="font-sans font-bold text-primary w-6 text-center">{setup.days || 1}</span>
                  <button
                    onClick={() => onUpdateSetup?.({ days: Math.min(7, (setup.days || 1) + 1) })}
                    disabled={(setup.days || 1) >= 7}
                    className="w-8 h-8 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container disabled:opacity-30"
                    title="More days"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              </div>

              {/* Pace */}
              <div>
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Pace</span>
                <div className="flex gap-1.5 mt-1.5">
                  {Object.keys(PACE_LABELS).map((pace) => {
                    const isActive = setup.pace === pace;
                    return (
                      <button
                        key={pace}
                        onClick={() => onUpdateSetup?.({ pace })}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                          isActive
                            ? 'bg-primary text-on-primary border-primary shadow-sm'
                            : 'bg-surface hover:bg-surface-container-low text-on-surface-variant border-outline-variant/40'
                        }`}
                      >
                        {PACE_LABELS[pace]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Accessibility toggles */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-outline-variant/20">
              {[
                { key: 'seniors', label: 'Seniors', icon: 'elderly' },
                { key: 'limitedWalking', label: 'Limited walking', icon: 'accessible' },
                { key: 'kids', label: 'Travelling with kids', icon: 'child_care' },
              ].map((option) => {
                const isActive = Boolean(setup[option.key]);
                return (
                  <button
                    key={option.key}
                    onClick={() => toggleSetup(option.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                      isActive
                        ? 'bg-secondary/10 text-secondary border-secondary/40'
                        : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                    <span>{option.label}</span>
                    {isActive && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </button>
                );
              })}
            </div>

            {itinerary.notes?.length > 0 && (
              <ul className="space-y-1 pt-1">
                {itinerary.notes.map((note) => (
                  <li key={note} className="flex gap-2 items-start text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-[14px] mt-0.5">info</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Anything the rules could not place */}
          {itinerary.unassigned?.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-xl">event_busy</span>
                <h2 className="font-sans font-bold text-amber-900 text-sm">Not scheduled</h2>
              </div>
              {itinerary.unassigned.map((entry) => (
                <p key={entry.id} className="font-sans text-[11px] text-amber-900/90">
                  <span className="font-bold">{entry.title}</span> — {entry.reason}
                </p>
              ))}
            </section>
          )}

          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
            {days.map((entry, index) => {
              const isActive = index === activeDay;
              return (
                <button
                  key={entry.id}
                  onClick={() => setActiveDay(index)}
                  className={`px-4 py-2.5 rounded-2xl border text-left whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline-variant/30 bg-white hover:bg-surface-container-low'
                  }`}
                >
                  <span className={`block text-xs font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                    {entry.label}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant">
                    {entry.stops.length} stop{entry.stops.length === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>

          {day && (
            <section className="space-y-4">
              {/* Day summary */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-ambient-card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-sans font-bold text-sm text-primary">
                    {day.label} · {formatDateLabel(day.date)}
                  </h2>
                  <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                    {day.weekday} · {day.startTime} – {day.endTime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="bg-surface px-2.5 py-1 rounded-full text-on-surface-variant">
                    {formatDuration(day.totals.walkingMinutes)} walking
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-full text-on-surface-variant">
                    {formatDuration(day.totals.travelMinutes)} travel
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-full text-on-surface-variant">
                    ₹{day.totals.entryFees + day.totals.travelCost} est.
                  </span>
                </div>
              </div>

              {day.stops.length === 0 ? (
                <div className="text-center py-14 bg-white border border-outline-variant/30 rounded-3xl space-y-2">
                  <span className="material-symbols-outlined text-outline text-4xl">free_cancellation</span>
                  <h3 className="font-sans font-bold text-on-surface text-sm">Nothing planned for {day.label}</h3>
                  <p className="font-sans text-xs text-on-surface-variant max-w-[260px] mx-auto">
                    Move a stop here from another day, or add more places in your Day Plan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buildTimeline(day).map((entry) => {
                    if (entry.type === 'break') {
                      return (
                        <div
                          key={entry.key}
                          className="flex items-center gap-3 bg-secondary-fixed/20 border border-secondary-fixed/40 rounded-2xl px-4 py-3"
                        >
                          <span className="material-symbols-outlined text-secondary text-xl">lunch_dining</span>
                          <div>
                            <p className="font-sans text-xs font-bold text-secondary">Lunch &amp; rest</p>
                            <p className="font-sans text-[10px] text-on-surface-variant">
                              {day.break.startTime} – {day.break.endTime} · {formatDuration(day.break.durationMinutes)}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const { stop, index } = entry;
                    const nextStop = day.stops[index + 1];
                    const distanceKm = (stop.travelMetersToNext || 0) / 1000;

                    return (
                      <article
                        key={entry.key}
                        className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm hover:shadow-ambient-card transition-all"
                      >
                        <div className="flex gap-3">
                          {/* Photo + order badge */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0 relative">
                            <img src={stop.image} alt={stop.title} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shadow-sm">
                              {index + 1}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="flex-grow min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <button
                                  onClick={() => onSelectMonument?.(stop)}
                                  className="font-sans font-bold text-sm text-primary hover:underline text-left truncate block w-full"
                                >
                                  {stop.title}
                                </button>
                                <p className="font-sans text-[10px] uppercase tracking-wider text-outline font-bold">
                                  {stop.category || 'Landmark'}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold text-primary bg-primary-fixed/40 border border-primary-fixed/50 px-2 py-0.5 rounded-full">
                                {formatDuration(stop.durationMinutes)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
                              <span className="font-bold text-on-surface">
                                {stop.startTime} – {stop.endTime}
                              </span>
                              <span>₹{stop.entryFee} entry</span>
                              {stop.effort === 'high' && (
                                <span className="flex items-center gap-0.5 text-amber-700">
                                  <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                                  High walking
                                </span>
                              )}
                            </div>

                            {(stop.waitedMinutes > 0 || stop.warnings?.length > 0) && (
                              <ul className="space-y-0.5">
                                {stop.waitedMinutes > 0 && (
                                  <li className="font-sans text-[10px] text-on-surface-variant">
                                    Arrive early — {formatDuration(stop.waitedMinutes)} wait for opening
                                  </li>
                                )}
                                {stop.warnings?.map((warning) => (
                                  <li key={warning} className="flex gap-1 items-start font-sans text-[10px] text-amber-700">
                                    <span className="material-symbols-outlined text-[12px] mt-0.5">warning</span>
                                    <span>{warning}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Travel to next stop */}
                            {nextStop && stop.travelMinutesToNext > 0 && (
                              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-secondary bg-secondary-fixed/25 border border-secondary-fixed/50 px-2.5 py-1 rounded-full">
                                <span className="material-symbols-outlined text-[13px]">directions</span>
                                <span>
                                  Next: {stop.travelMinutesToNext} min · {distanceKm.toFixed(1)} km by{' '}
                                  {TRAVEL_MODE_LABELS[stop.travelModeToNext] || 'transit'}
                                  {stop.travelCostToNext > 0 ? ` · ~₹${stop.travelCostToNext}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Edit controls */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMove(stop.id, index, -1)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-30"
                              title="Move earlier"
                            >
                              <span className="material-symbols-outlined text-lg">arrow_upward</span>
                            </button>
                            <button
                              onClick={() => handleMove(stop.id, index, 1)}
                              disabled={index === day.stops.length - 1}
                              className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-30"
                              title="Move later"
                            >
                              <span className="material-symbols-outlined text-lg">arrow_downward</span>
                            </button>
                          </div>

                          {days.length > 1 && (
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
                              <span className="material-symbols-outlined text-[15px]">drive_file_move</span>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value !== '') handleMoveToDay(stop.id, Number(e.target.value));
                                }}
                                className="bg-surface border border-outline-variant/40 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="">Move to day…</option>
                                {days.map((target, targetIndex) => (
                                  targetIndex === activeDay ? null : (
                                    <option key={target.id} value={targetIndex}>{target.label}</option>
                                  )
                                ))}
                              </select>
                            </label>
                          )}

                          <button
                            onClick={() => handleRemove(stop.id)}
                            className="ml-auto flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Totals footer */}
          <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-3 shadow-sm">
            <h2 className="font-sans font-bold text-primary text-base">Trip totals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-surface p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-outline">Stops</span>
                <p className="font-sans text-sm font-bold text-primary mt-0.5">{totals.stops}</p>
              </div>
              <div className="bg-surface p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-outline">Est. cost</span>
                <p className="font-sans text-sm font-bold text-primary mt-0.5">₹{totals.cost}</p>
              </div>
              <div className="bg-surface p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-outline">Walking</span>
                <p className="font-sans text-sm font-bold text-primary mt-0.5">{formatDuration(totals.walkingMinutes)}</p>
              </div>
              <div className="bg-surface p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-outline">Travel</span>
                <p className="font-sans text-sm font-bold text-primary mt-0.5">{formatDuration(totals.travelMinutes)}</p>
              </div>
            </div>
          </section>

          <button
            onClick={onOpenOverview}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-bold py-4 rounded-2xl shadow-md transform active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">map</span>
            <span>Open trip overview</span>
          </button>
        </>
      )}
    </div>
  );
}
