import { useT } from "../i18n/index";
import React from 'react';
export default function ResumeTripView({
  itinerary,
  tripSetup,
  onResume,
  onPlanNewTrip
}) {
  const t = useT();
  const days = itinerary?.days || [];
  const stops = itinerary?.totals?.stops || 0;
  const destination = tripSetup?.destination?.name || 'Delhi NCR';
  return <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      <div className="flex items-center gap-2 z-10">
        <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{
        fontVariationSettings: "'FILL' 1"
      }}>
          explore
        </span>
        <span className="font-display text-2xl font-bold text-primary tracking-tight">{t("text|Sarthi")}</span>
      </div>

      <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full z-10 py-8">
        <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-ambient-card overflow-hidden">
          <div className="relative h-40 w-full">
            <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop" alt={destination} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-4 left-5 right-5 text-on-primary">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">{t("text|Saved trip")}</p>
              <h1 className="font-display text-2xl font-bold">{destination}</h1>
              <p className="text-xs font-sans text-on-primary-container">
                {days.length}{t("text|day")}{days.length === 1 ? '' : 's'} · {stops} stop{stops === 1 ? '' : 's'}
                {itinerary?.totals?.cost != null ? ` · ₹${itinerary.totals.cost} est.` : ''}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-2">
            {days.slice(0, 3).map(day => <div key={day.id} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">{day.label}</span>
                <span className="text-on-surface-variant">
                  {day.stops.map(stop => stop.title).join(' · ') || 'No stops'}
                </span>
              </div>)}
            {days.length > 3 && <p className="text-[11px] text-outline">+{days.length - 3}{t("text|more days")}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full z-10 space-y-3">
        <button onClick={onResume} className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">play_arrow</span>
          <span>{t("text|Resume your trip")}</span>
        </button>
        <button onClick={onPlanNewTrip} className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-primary font-sans font-semibold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">edit_calendar</span>
          <span>{t("text|Plan a new trip")}</span>
        </button>
      </div>
    </div>;
}
