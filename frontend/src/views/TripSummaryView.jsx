import { useT } from "../i18n/index";
import React from 'react';
import { formatNumber, formatTime } from '../i18n';
export default function TripSummaryView({
  completedPlaces = [],
  timeWalkedMinutes = 0,
  returnTrip,
  hotelOrigin,
  onCreateStory,
  onFinish
}) {
  const t = useT();
  return <div className="min-h-screen bg-background px-4 pt-5 pb-10 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">{t("text|TRIP MEMORY · DAY COMPLETE")}</p>
          <h1 className="font-display text-3xl font-black text-primary mt-1">{t("text|A day well travelled")}</h1>
          <p className="text-sm text-on-surface-variant mt-2">{t("text|Your visited places and check-in memories are saved on this device.")}</p>
        </header>

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-bold text-primary">{t("text|Places visited ·")}{completedPlaces.length}</h2>
          <div className="mt-3 space-y-3">
            {completedPlaces.map(entry => <article key={entry.id} className="flex gap-3 items-center rounded-2xl bg-surface-container-low p-3">
                {entry.photoDataUrl ? <img src={entry.photoDataUrl} alt={`Check-in at ${entry.title}`} className="w-16 h-16 object-cover rounded-xl" /> : <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary">account_balance</span></div>}
                <div><p className="text-sm font-bold text-primary">{entry.title}</p><p className="text-[10px] text-on-surface-variant mt-1">{entry.checkinMethod === 'photo' ? t('summary.photo') : t('summary.manual')}{entry.completedAt ? ` · ${formatTime(entry.completedAt)}` : ''}</p></div>
              </article>)}
          </div>
          <p className="text-xs text-on-surface-variant mt-4">{t("text|Estimated walking time:")}{formatNumber(timeWalkedMinutes)}{t("text|minutes.")}</p>
        </section>

        <section className="rounded-3xl bg-primary p-5 text-on-primary shadow-sm">
          <div className="flex items-center gap-2 text-secondary-fixed"><span className="material-symbols-outlined">home_pin</span><p className="text-[10px] uppercase font-bold tracking-widest">{t("text|The way back")}</p></div>
          {returnTrip.available ? <>
              <h2 className="font-display text-xl font-bold mt-2">{t("text|Back to")}{hotelOrigin?.name || returnTrip.destination}</h2>
              <p className="text-sm text-on-primary-container mt-1">{t("text|Leave now · estimated")}{formatNumber(returnTrip.minutes)}{t("text|min · arrive around")}{returnTrip.eta}</p>
              <p className="text-[10px] text-on-primary-container mt-2">{t("text|About")}{returnTrip.distanceKm}{t("text|km by")}{returnTrip.modeLabel}{t("text|. This is a coordinate-based estimate without live traffic.")}</p>
              {hotelOrigin?.isSimulated && <p className="text-[10px] text-on-primary-container mt-1">{t("text|The hotel name is your saved label; the demo start coordinates are used for this estimate.")}</p>}
            </> : <><h2 className="font-display text-xl font-bold mt-2">{t("text|Set a hotel location for the return trip")}</h2><p className="text-xs text-on-primary-container mt-1">{t("text|A return ETA is unavailable because the starting point has no coordinates.")}</p></>}
        </section>

        <button onClick={onCreateStory} className="w-full min-h-12 rounded-2xl bg-secondary text-on-secondary text-sm font-bold shadow-sm">{t("text|Create my Trip Story")}</button>
        <button onClick={onFinish} className="w-full min-h-11 rounded-2xl border border-outline-variant/40 text-xs font-bold text-primary">{t("text|Finish for today")}</button>
      </div>
    </div>;
}
