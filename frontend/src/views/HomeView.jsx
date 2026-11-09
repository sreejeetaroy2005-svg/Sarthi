import React from 'react';
import { useT } from '../i18n';
export default function HomeView({
  activeTrip,
  onPlan,
  onContinue,
  onPastTrips,
  language = 'en',
  onLanguageChange
}) {
  const t = useT();
  return <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-10">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-widest text-secondary">{t('home.brand')}</p><label className="flex items-center gap-2 text-xs font-semibold text-primary"><span>{t('profile.language')}</span><select aria-label={t('profile.language')} value={language} onChange={event => onLanguageChange?.(event.target.value)} className="min-h-11 max-w-36 rounded-xl border border-outline-variant/40 bg-white px-2"><option value="en">{t("text|English")}</option><option value="hi">{t("text|हिन्दी")}</option><option value="ta">{t("text|தமிழ்")}</option><option value="bn">{t("text|বাংলা")}</option></select></label></div>
    <h1 className="mt-2 text-3xl font-black text-primary">{t('home.heading')}</h1>
    <div className="mt-8 space-y-4">
      <button onClick={onPlan} className="w-full min-h-24 rounded-3xl bg-primary p-5 text-left text-on-primary"><span className="block text-lg font-bold">{t('home.plan')}</span><span className="mt-1 block text-sm opacity-80">{t('home.planHelp')}</span></button>
      {activeTrip && <button onClick={onContinue} className="w-full min-h-24 rounded-3xl border border-secondary bg-white p-5 text-left text-primary"><span className="block text-lg font-bold">{t('home.continue')}</span><span className="mt-1 block text-sm text-on-surface-variant">{t('home.continueHelp')}</span></button>}
      <button onClick={onPastTrips} className="w-full min-h-24 rounded-3xl border border-outline-variant/40 bg-white p-5 text-left text-primary"><span className="block text-lg font-bold">{t('home.past')}</span><span className="mt-1 block text-sm text-on-surface-variant">{t('home.pastHelp')}</span></button>
    </div>
  </main>;
}
