import React, { useEffect, useMemo, useRef } from 'react';
import WizardProgress from '../components/PlanWizard/WizardProgress';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  PACE_LABELS,
  TRAVEL_MODE_LABELS,
  formatDateLabel,
  formatDuration,
} from '../lib/planner';

const DAY_COLORS = ['#162a5a', '#974730', '#1f6f5c', '#5b3a8c', '#8c6b1f', '#37474f', '#8a3348'];

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * TripOverviewView — the summary the traveler opens before setting off:
 * every stop on one Leaflet map with the day-by-day route, cost and time
 * totals, and the next step into Guide Passes.
 */
export default function TripOverviewView({
  itinerary,
  onBack,
  onEdit,
  onContinue,
  onSelectMonument,
  showProgress = false,
}) {
  const mapContainerRef = useRef(null);

  const days = itinerary?.days || [];
  const totals = itinerary?.totals;
  const setup = itinerary?.setup || {};

  const mappedStops = useMemo(
    () => days.flatMap((day) => day.stops.filter((stop) => stop.coords)),
    [days]
  );

  // Draw (and redraw) the map whenever the itinerary changes.
  useEffect(() => {
    if (!mapContainerRef.current || !mappedStops.length) return undefined;

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    days.forEach((day, dayIndex) => {
      const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      const points = day.stops
        .filter((stop) => stop.coords)
        .map((stop) => [stop.coords.lat, stop.coords.lng]);

      points.forEach((point) => bounds.extend(point));

      if (points.length > 1) {
        L.polyline(points, {
          color,
          weight: 4,
          opacity: 0.85,
          dashArray: '8 10',
          lineCap: 'round',
        }).addTo(map);
      }

      day.stops.forEach((stop, stopIndex) => {
        if (!stop.coords) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:30px;height:30px;border-radius:9999px;background:${color};color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(22,42,90,.35);display:flex;align-items:center;justify-content:center;font:700 12px/1 'Plus Jakarta Sans',sans-serif;">${stopIndex + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -16],
        });

        L.marker([stop.coords.lat, stop.coords.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:150px;">
              <strong style="color:${color};font-size:12px;">${escapeHtml(stop.title)}</strong><br/>
              <span style="font-size:10px;color:#5b5f6b;">${escapeHtml(day.label)} · ${escapeHtml(stop.startTime)} – ${escapeHtml(stop.endTime)}</span>
            </div>`
          );
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 14 });
    } else {
      map.setView([28.5933, 77.2507], 11);
    }

    // The card can settle a frame after mount; keep the tiles aligned.
    const resizeTimer = setTimeout(() => map.invalidateSize(), 120);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
    };
  }, [days, mappedStops.length]);

  const totalTravelKm = totals ? totals.distanceMeters / 1000 : 0;

  return (
    <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-surface-container transition-colors shrink-0"
            title="Back to itinerary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-black text-primary truncate">Trip Overview</h1>
            <p className="font-sans text-xs text-on-surface-variant mt-0.5">
              {PACE_LABELS[setup.pace] || 'Balanced'} pace · {totals?.stops || 0} stop{totals?.stops === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2.5 border border-outline-variant/50 bg-white text-primary text-xs font-bold rounded-full hover:bg-surface-container transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onContinue}
            disabled={!totals?.stops}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-full shadow-md transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Guide Passes</span>
          </button>
        </div>
      </div>

      {showProgress && <WizardProgress step={8} className="mt-1" />}

      {!days.length || !totals?.stops ? (
        <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl space-y-4">
          <span className="material-symbols-outlined text-outline text-5xl">map</span>
          <h3 className="font-sans font-bold text-on-surface text-base">Nothing to map yet</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-[260px] mx-auto">
            Build an itinerary from your Day Plan to see the route and totals here.
          </p>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-full shadow-sm"
          >
            Edit itinerary
          </button>
        </div>
      ) : (
        <>
          {/* Map */}
          <section className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
            {/* Leaflet needs a parent with a real height: index.css forces
                .leaflet-container to height:100%. */}
            <div className="h-[340px] w-full relative z-0">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-outline-variant/20">
              {days.map((day, index) => (
                <span key={day.id} className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: DAY_COLORS[index % DAY_COLORS.length] }}
                  />
                  {day.label}
                </span>
              ))}
              <span className="ml-auto text-[10px] text-outline">
                {mappedStops.length} stops · {totalTravelKm.toFixed(1)} km
              </span>
            </div>
          </section>

          {/* Totals */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-xl">payments</span>
              <p className="font-display text-xl font-bold text-primary mt-1">₹{totals.cost}</p>
              <p className="font-sans text-[10px] text-on-surface-variant">
                ₹{totals.entryFees} entry · ₹{totals.travelCost} transport
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-xl">directions_walk</span>
              <p className="font-display text-xl font-bold text-primary mt-1">{formatDuration(totals.walkingMinutes)}</p>
              <p className="font-sans text-[10px] text-on-surface-variant">Walking, including sites</p>
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-xl">commute</span>
              <p className="font-display text-xl font-bold text-primary mt-1">{formatDuration(totals.travelMinutes)}</p>
              <p className="font-sans text-[10px] text-on-surface-variant">Travel between stops</p>
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
              <p className="font-display text-xl font-bold text-primary mt-1">{formatDuration(totals.visitMinutes)}</p>
              <p className="font-sans text-[10px] text-on-surface-variant">Inside the sites</p>
            </div>
          </section>

          {/* Day-by-day cards */}
          <section className="space-y-4">
            <h2 className="font-sans font-bold text-sm text-primary uppercase tracking-wider">Day by day</h2>

            {days.map((day, dayIndex) => {
              const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
              const photos = day.stops.slice(0, 3);
              return (
                <article
                  key={day.id}
                  className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm"
                >
                  <div className="flex gap-1 h-28 bg-surface-container">
                    {photos.length > 0 ? photos.map((stop) => (
                      <div key={stop.id} className="flex-1 overflow-hidden relative min-w-0">
                        <img src={stop.image} alt={stop.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      </div>
                    )) : (
                      <div className="flex-1 flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined">landscape</span>
                      </div>
                    )}
                    {day.stops.length > 3 && (
                      <div className="w-16 shrink-0 flex items-center justify-center bg-surface text-xs font-bold text-primary">
                        +{day.stops.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <h3 className="font-display text-lg font-bold text-primary">{day.label}</h3>
                          <span className="text-[10px] text-on-surface-variant font-semibold">
                            {formatDateLabel(day.date)}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                          {day.startTime} – {day.endTime} · {day.stops.length} stop{day.stops.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface px-2.5 py-1 rounded-full">
                        ₹{day.totals.entryFees + day.totals.travelCost} est.
                      </span>
                    </div>

                    <ol className="space-y-2.5">
                      {day.stops.map((stop, stopIndex) => (
                        <li key={stop.id} className="flex items-start gap-3">
                          <span
                            className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: color }}
                          >
                            {stopIndex + 1}
                          </span>
                          <div className="min-w-0 flex-grow">
                            <button
                              onClick={() => onSelectMonument?.(stop)}
                              className="font-sans font-bold text-xs text-primary hover:underline text-left truncate block max-w-full"
                            >
                              {stop.title}
                            </button>
                            <p className="font-sans text-[10px] text-on-surface-variant">
                              {stop.startTime} – {stop.endTime} · {formatDuration(stop.durationMinutes)}
                              {stop.travelMinutesToNext > 0 && (
                                <> · {stop.travelMinutesToNext} min by {TRAVEL_MODE_LABELS[stop.travelModeToNext] || 'transit'} to next</>
                              )}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-outline shrink-0">₹{stop.entryFee}</span>
                        </li>
                      ))}
                      {day.stops.length === 0 && (
                        <li className="text-[11px] text-on-surface-variant italic">A free day — no stops planned.</li>
                      )}
                    </ol>

                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-outline-variant/20 text-[10px] font-bold text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">directions_walk</span>
                        {formatDuration(day.totals.walkingMinutes)} walking
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">commute</span>
                        {formatDuration(day.totals.travelMinutes)} travel
                      </span>
                      {day.break && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lunch_dining</span>
                          Break at {day.break.startTime}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {itinerary?.unassigned?.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-xl">event_busy</span>
                <h2 className="font-sans font-bold text-amber-900 text-sm">Left out of this plan</h2>
              </div>
              {itinerary.unassigned.map((entry) => (
                <p key={entry.id} className="font-sans text-[11px] text-amber-900/90">
                  <span className="font-bold">{entry.title}</span> — {entry.reason}
                </p>
              ))}
            </section>
          )}

          <button
            onClick={onContinue}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-bold py-4 rounded-2xl shadow-md transform active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>Continue to Guide Passes</span>
          </button>
        </>
      )}
    </div>
  );
}
