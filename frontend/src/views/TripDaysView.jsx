import React, { useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';
import { addDaysISO, formatDateLabel, toISODate } from '../lib/planner';

/** Number of days (and an optional start date) for the trip. */
export default function TripDaysView({ days = 2, startDate, startTime = '09:00', onContinue, onBack }) {
  const [dayCount, setDayCount] = useState(Math.min(7, Math.max(1, Number(days) || 2)));
  const [date, setDate] = useState(startDate || toISODate(new Date()));
  const [arrivalTime, setArrivalTime] = useState(startTime || '09:00');
  const [useDates, setUseDates] = useState(Boolean(startDate && startDate !== toISODate(new Date())));

  const change = (delta) => setDayCount((current) => Math.min(7, Math.max(1, current + delta)));
  const lastDate = addDaysISO(date, dayCount - 1);

  return (
    <StepShell
      step={3}
      title="How many days will you stay?"
      subtitle="We spread your stops across these days and leave room for lunch and rest."
      onBack={onBack}
      footer={
        <button
          onClick={() => onContinue({ days: dayCount, startDate: useDates ? date : '', startTime: arrivalTime })}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      }
    >
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 text-center shadow-sm">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => change(-1)}
            disabled={dayCount <= 1}
            className="w-12 h-12 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            title="Fewer days"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <div className="min-w-[96px]">
            <span className="font-display text-5xl font-black text-primary">{dayCount}</span>
            <p className="text-[11px] uppercase font-bold tracking-widest text-outline mt-1">
              {dayCount === 1 ? 'day' : 'days'}
            </p>
          </div>
          <button
            onClick={() => change(1)}
            disabled={dayCount >= 7}
            className="w-12 h-12 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            title="More days"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        <p className="mt-4 text-xs text-on-surface-variant">
          {dayCount === 1 ? 'A single day' : `${dayCount} days`} of sightseeing · {formatDateLabel(date)}
          {dayCount > 1 ? ` – ${formatDateLabel(lastDate)}` : ''}
        </p>
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
        <label className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-on-surface">Pick my start date</h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Optional — used to respect weekday closures.
            </p>
          </div>
          <button
            onClick={() => setUseDates((value) => !value)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
              useDates ? 'bg-primary' : 'bg-outline-variant/50'
            }`}
            title="Choose a start date"
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${
                useDates ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </label>

        {useDates && (
          <input
            type="date"
            value={date}
            min={toISODate(new Date())}
            onChange={(event) => setDate(event.target.value || toISODate(new Date()))}
            className="mt-4 w-full border border-outline-variant/50 rounded-xl px-3 py-2.5 text-sm text-primary font-semibold bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
        <label htmlFor="trip-arrival-time" className="block font-sans font-bold text-sm text-on-surface">Preferred start time</label>
        <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">We’ll use this as the first day’s arrival time when shaping your schedule.</p>
        <input
          id="trip-arrival-time"
          type="time"
          value={arrivalTime}
          onChange={(event) => setArrivalTime(event.target.value || '09:00')}
          className="w-full border border-outline-variant/50 rounded-xl px-3 py-3 text-sm text-primary font-semibold bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </StepShell>
  );
}
