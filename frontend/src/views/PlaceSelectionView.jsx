import React, { useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';

function oneLiner(place) {
  const text = String(place.shortDescription || place.overview || place.subtitle || '');
  const [firstSentence] = text.split(/(?<=\.)\s/);
  const line = (firstSentence || text).trim();
  return line.length > 120 ? `${line.slice(0, 117).trimEnd()}…` : line;
}

function durationLabel(minutes, fallback) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return fallback || 'About 1 hour';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return `${hours} hr${hours === 1 ? '' : 's'}${remainder ? ` ${remainder} min` : ''}`;
}

export default function PlaceSelectionView({
  places = [],
  initialSelected = [],
  mode = 'manual',
  destinationName,
  onContinue,
  onBack,
}) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [openDetails, setOpenDetails] = useState(null);

  const toggle = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedPlaces = places.filter((place) => selected.has(place.id));

  return (
    <StepShell
      step={6}
      total={9}
      wide
      title="Select places"
      subtitle={
        mode === 'auto'
          ? `We pre-picked these from your group details${destinationName ? ` in ${destinationName}` : ''}. Change anything you like.`
          : `Choose what you want to see${destinationName ? ` in ${destinationName}` : ''}. We build the schedule around your picks.`
      }
      onBack={onBack}
      footer={
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
            {selectedPlaces.length} selected
          </div>
          <button
            onClick={() => onContinue([...selected])}
            disabled={selectedPlaces.length === 0}
            className="flex-grow bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>Build my itinerary</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
        {places.map((place) => {
          const isSelected = selected.has(place.id);
          const showDetails = openDetails === place.id;
          return (
            <article
              key={place.id}
              className={`bg-white rounded-3xl overflow-hidden border shadow-sm flex flex-col transition-all ${
                isSelected ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/30'
              }`}
            >
              <div className="relative h-40 w-full">
                <img src={place.image} alt={place.title} className="w-full h-full object-cover" loading="lazy" />
                {isSelected && (
                  <span className="absolute top-2 right-2 bg-primary text-on-primary rounded-full p-1 shadow">
                    <span className="material-symbols-outlined text-[16px] block">check</span>
                  </span>
                )}
                <div className="absolute bottom-2 left-3 flex flex-wrap gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-white/90 text-primary px-2 py-0.5 rounded-full">
                    {place.category}
                  </span>
                  {place.unescoStatus && (
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-secondary text-on-secondary px-2 py-0.5 rounded-full">
                      UNESCO
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-display text-base font-bold text-primary leading-tight">{place.title}</h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed flex-grow">
                  {oneLiner(place)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(place.tags || [place.category]).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{durationLabel(place.visitDuration, place.avgTimeSpent)}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">payments</span>{place.fee || place.entryFee}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">directions_walk</span>{place.walkingEffort || 'moderate'} effort</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">{place.seniorFriendly ? 'elderly' : 'accessible_forward'}</span>
                    {place.seniorFriendly ? 'Senior friendly' : 'Longer walking'}
                  </span>
                  <span className="col-span-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">child_care</span>
                    {place.kidFriendly ? 'Kid friendly' : 'Check family facilities'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggle(place.id)}
                    className={`flex-grow min-h-10 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-primary border border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => setOpenDetails(showDetails ? null : place.id)}
                    className="text-[11px] font-bold text-secondary hover:underline px-1 py-2"
                  >
                    {showDetails ? 'Hide details' : 'Details'}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-2 animate-fade-in">
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{place.overview}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
                      <div>
                        <span className="block uppercase font-bold text-outline text-[9px]">Hours</span>
                        {place.openingHours}
                      </div>
                      <div>
                        <span className="block uppercase font-bold text-outline text-[9px]">Entry</span>
                        {place.entryFee}
                      </div>
                      <div>
                        <span className="block uppercase font-bold text-outline text-[9px]">Typical visit</span>
                        {place.avgTimeSpent}
                      </div>
                      <div>
                        <span className="block uppercase font-bold text-outline text-[9px]">Best time</span>
                        {place.bestTimeToVisit}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {places.length === 0 && (
        <p className="text-center text-sm text-on-surface-variant py-10">
          No places available for this destination yet.
        </p>
      )}
    </StepShell>
  );
}
