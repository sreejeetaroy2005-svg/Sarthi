import { useT } from "../i18n/index";
import React, { useState } from 'react';
export default function DayPlanView({
  dayPlan,
  setDayPlan,
  onOpenRoute,
  onSelectMonument,
  onOpenItinerary,
  hasItinerary = false
}) {
  const t = useT();
  const [optimizerLoading, setOptimizerLoading] = useState(false);

  // Weather state mock
  const weather = {
    temp: "32°C",
    cond: "Partly Cloudy",
    icon: "partly_cloudy_day",
    airQuality: "145 AQI (Moderate)"
  };
  const handleRemove = id => {
    setDayPlan(prev => prev.filter(m => m.id !== id));
  };
  const handleMoveUp = index => {
    if (index === 0) return;
    const nextList = [...dayPlan];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;
    setDayPlan(nextList);
  };
  const handleMoveDown = index => {
    if (index === dayPlan.length - 1) return;
    const nextList = [...dayPlan];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;
    setDayPlan(nextList);
  };

  // Simulated AI itinerary optimization path
  const optimizeRoutes = () => {
    setOptimizerLoading(true);
    setTimeout(() => {
      // Simplistic sort of list by mock latitude to minimize travel paths
      const sorted = [...dayPlan].sort((a, b) => a.coords.lat - b.coords.lat);
      setDayPlan(sorted);
      setOptimizerLoading(false);
    }, 1200);
  };

  // Estimates sum entry fees
  const calculateTotalFees = () => {
    let sum = 0;
    dayPlan.forEach(p => {
      if (p.entryFee.includes('₹40')) sum += 40;else if (p.entryFee.includes('₹50')) sum += 50;else if (p.entryFee.includes('₹250')) sum += 250;
    });
    return sum;
  };
  return <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6">
      
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">{t("text|Your Day Plan")}</h1>
          <p className="font-sans text-xs text-on-surface-variant mt-0.5">{t("text|Optimized schedule for your current city exploration")}</p>
        </div>
        
        {dayPlan.length > 1 && <button onClick={optimizeRoutes} disabled={optimizerLoading} className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded-full hover:bg-secondary-container transition-all shadow-sm disabled:opacity-50">
            {optimizerLoading ? <span className="material-symbols-outlined animate-pulse">auto_awesome</span> : <span className="material-symbols-outlined text-[16px]">bolt</span>}
            <span>{optimizerLoading ? 'Sarthi is preparing your guide…' : 'AI Route Optimize'}</span>
          </button>}
      </div>

      {/* Itinerary builder entry point */}
      {onOpenItinerary && <div className="bg-primary text-on-primary rounded-3xl p-5 shadow-ambient-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="flex items-start gap-3 relative">
            <span className="material-symbols-outlined text-2xl">route</span>
            <div>
              <h3 className="font-display text-lg font-bold">
                {hasItinerary ? 'Your timed itinerary' : 'Build a timed itinerary'}
              </h3>
              <p className="font-sans text-[11px] text-on-primary/80 leading-relaxed mt-0.5 max-w-md">{t("text|Groups nearby stops, respects opening hours, adds travel and a lunch break — with a map of the whole trip.")}</p>
            </div>
          </div>
          <button onClick={onOpenItinerary} className="relative shrink-0 bg-white text-primary font-sans font-bold text-xs px-5 py-3 rounded-full shadow-sm hover:bg-surface transition-colors flex items-center justify-center gap-1.5">
            <span>{hasItinerary ? 'Open itinerary' : 'Build itinerary'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>}

      {/* Weather Forecast Overlay Widget */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 flex justify-between items-center shadow-ambient-card">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500 text-3xl font-bold">{weather.icon}</span>
          <div>
            <h3 className="font-sans font-bold text-sm text-primary">{t("text|Delhi Forecast:")}{weather.temp}</h3>
            <p className="font-sans text-[10px] text-on-surface-variant">{weather.cond}{t("text|• PM2.5:")}{weather.airQuality}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md">{t("text|Excellent walk window")}</span>
        </div>
      </div>

      {/* Main Timeline of Added stops */}
      {dayPlan.length > 0 ? <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40">
          {dayPlan.map((place, idx) => {
        // Assign slot designations
        const slots = ["Morning stop", "Midday stop", "Evening stop", "Night stop"];
        const slotText = slots[idx] || `Stop #${idx + 1}`;
        return <div key={place.id} className="relative pl-12 group">
                
                {/* Timeline node circle */}
                <div className="absolute left-3.5 top-5 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-sm z-10">
                  <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                </div>

                {/* Main Stop Card */}
                <div className="bg-white rounded-2xl border border-outline-variant/30 hover:border-primary/20 shadow-sm p-4 hover:shadow-ambient-card transition-all flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-3">
                    {/* Image block */}
                    <div onClick={() => onSelectMonument(place)} className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 cursor-pointer">
                      <img src={place.image} alt={place.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Metadata details */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-secondary tracking-widest">{slotText}</span>
                      <h3 onClick={() => onSelectMonument(place)} className="font-sans font-bold text-sm text-primary cursor-pointer hover:underline">
                        {place.title}
                      </h3>
                      <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">{place.distance}{t("text|from center •")}{place.avgTimeSpent}</p>
                    </div>
                  </div>

                  {/* Actions / Ordering Controls */}
                  <div className="flex sm:flex-col justify-between items-end gap-2 shrink-0 border-t sm:border-t-0 border-outline-variant/20 pt-2 sm:pt-0">
                    <div className="flex gap-1">
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="p-1 hover:bg-surface-container rounded disabled:opacity-30" title={t("text|Move Up")}>
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === dayPlan.length - 1} className="p-1 hover:bg-surface-container rounded disabled:opacity-30" title={t("text|Move Down")}>
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                      <button onClick={() => handleRemove(place.id)} className="p-1 hover:bg-red-50 text-red-600 rounded" title={t("text|Delete stop")}>
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    {/* Trigger Navigation Route details */}
                    {idx < dayPlan.length - 1 && <button onClick={() => onOpenRoute(place, dayPlan[idx + 1])} className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-0.5 border border-primary/20 px-2.5 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-sm">directions</span>
                        <span>{t("text|Route Options")}</span>
                      </button>}
                  </div>
                </div>

                {/* Transition / Travel duration connector indicator between nodes */}
                {idx < dayPlan.length - 1 && <div className="absolute left-12 bottom-[-20px] text-[10px] font-bold text-secondary bg-secondary-fixed/30 border border-secondary-fixed/50 px-2.5 py-1 rounded-full z-10">{t("text|Auto-Rickshaw: 1.5km • 8 mins travel time")}</div>}

              </div>;
      })}
        </div> : <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl space-y-4">
          <span className="material-symbols-outlined text-outline text-5xl">event_busy</span>
          <h3 className="font-sans font-bold text-on-surface text-base">{t("text|Plan list is empty")}</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">{t("text|Browse Delhi monuments in the Explore tab and click \"Add to Day Plan\" to assemble your custom schedule here.")}</p>
        </div>}

      {/* Budget Estimations Summary Card */}
      {dayPlan.length > 0 && <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-3.5 shadow-sm">
          <h3 className="font-sans font-bold text-primary text-base">{t("text|Plan Cost & Logistics Summary")}</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface p-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-outline">{t("text|Stops")}</span>
              <p className="font-sans text-sm font-bold text-primary mt-0.5">{dayPlan.length}</p>
            </div>
            <div className="bg-surface p-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-outline">{t("text|Est. Entry Fees")}</span>
              <p className="font-sans text-sm font-bold text-primary mt-0.5">₹{calculateTotalFees()}</p>
            </div>
            <div className="bg-surface p-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-outline">{t("text|Total Est. Travel")}</span>
              <p className="font-sans text-sm font-bold text-primary mt-0.5">{t("text|~35 min")}</p>
            </div>
          </div>
        </div>}
    </div>;
}
