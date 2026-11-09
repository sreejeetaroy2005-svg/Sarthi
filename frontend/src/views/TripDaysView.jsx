import React, { useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';
import { addDaysISO, toISODate } from '../lib/planner';
import { formatDate, formatNumber, useT } from '../i18n';

/** Number of days (and an optional start date) for the trip. */
export default function TripDaysView({ days = 2, startDate, startTime = '09:00', onContinue, onBack }) {
  const t = useT();
  const [dayCount, setDayCount] = useState(Math.min(7, Math.max(1, Number(days) || 2)));
  const [date, setDate] = useState(startDate || toISODate(new Date()));
  const [arrivalTime, setArrivalTime] = useState(startTime || '09:00');
  const [useDates, setUseDates] = useState(Boolean(startDate && startDate !== toISODate(new Date())));

  const change = (delta) => setDayCount((current) => Math.min(7, Math.max(1, current + delta)));
  const lastDate = addDaysISO(date, dayCount - 1);

  return (
    <StepShell
      step={3}
      title={t('days.heading')}
      subtitle={t('days.help')}
      onBack={onBack}
      footer={
        <button
          onClick={() => onContinue({ days: dayCount, startDate: useDates ? date : '', startTime: arrivalTime })}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>{t('common.continue')}</span>
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
            title={t('days.fewer')}
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <div className="min-w-[96px]">
            <span className="font-display text-5xl font-black text-primary">{formatNumber(dayCount)}</span>
            <p className="text-[11px] uppercase font-bold tracking-widest text-outline mt-1">
              {dayCount === 1 ? t('days.one') : t('days.many')}
            </p>
          </div>
          <button
            onClick={() => change(1)}
            disabled={dayCount >= 7}
            className="w-12 h-12 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            title={t('days.more')}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        <p className="mt-4 text-xs text-on-surface-variant">
          {formatNumber(dayCount)} {dayCount === 1 ? t('days.one') : t('days.many')} · {formatDate(date, undefined, { weekday: 'short', day: 'numeric', month: 'short' })}{dayCount > 1 ? ` – ${formatDate(lastDate, undefined, { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
        </p>
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
        <label className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-sm text-on-surface">{t('days.startDate')}</h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {t('days.dateHelp')}
            </p>
          </div>
          <button
            onClick={() => setUseDates((value) => !value)}
            className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
              useDates ? 'bg-primary' : 'bg-outline-variant/50'
            }`}
            title={t('days.startDate')}
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
        <label htmlFor="trip-arrival-time" className="block font-sans font-bold text-sm text-on-surface">{t('days.startTime')}</label>
        <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">{t('days.timeHelp')}</p>
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
