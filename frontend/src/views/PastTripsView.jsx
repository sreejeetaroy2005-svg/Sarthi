import { useT } from "../i18n/index";
import React from 'react';
export default function PastTripsView({
  trips = [],
  onHome
}) {
  const t = useT();
  return <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-8"><h1 className="text-3xl font-black text-primary">{t("text|My past trips")}</h1>{trips.length ? <div className="mt-5 space-y-3">{trips.map((trip, i) => <article key={`${trip.completedAt}-${i}`} className="rounded-2xl bg-white p-4"><h2 className="font-bold text-primary">{(trip.places || []).join(' · ') || 'Delhi trip'}</h2><p className="mt-1 text-xs text-on-surface-variant">{trip.completedAt ? new Date(trip.completedAt).toLocaleDateString() : 'Completed trip'}</p></article>)}</div> : <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-on-surface-variant">{t("text|Finished trips will be saved here.")}</p>}<button onClick={onHome} className="mt-6 min-h-12 w-full rounded-2xl bg-primary text-sm font-bold text-on-primary">{t("text|Back to Home")}</button></main>;
}
