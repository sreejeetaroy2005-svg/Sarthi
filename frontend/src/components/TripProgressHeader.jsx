import React from 'react';
import { formatNumber, useT } from '../i18n';

export default function TripProgressHeader({ place, screen, completed = 0, total = 1 }) {
  const t = useT();
  const stepNo = ({ getting_there: 1, arrival_briefing: 2, photo_checkin: 3, guided_walk: 4, what_next: 5, travel_access: 2 })[screen] || 1;
  const stepLabels = { getting_there: 'progress.getting', arrival_briefing: 'progress.arrival', photo_checkin: 'progress.photo', guided_walk: 'progress.walk', what_next: 'progress.next', travel_access: 'progress.arrival' };
  const nextLabels = { getting_there: 'progress.nextGetting', arrival_briefing: 'progress.nextArrival', photo_checkin: 'progress.nextPhoto', guided_walk: 'progress.nextWalk', what_next: 'progress.nextNext', travel_access: 'progress.nextArrival' };
  return <header className="mx-auto mb-4 max-w-2xl rounded-2xl border border-outline-variant/30 bg-white px-4 py-3 shadow-sm"><div className="flex items-baseline justify-between gap-2"><p className="truncate text-sm font-bold text-primary">{place?.title || t('progress.stop')}</p><p className="shrink-0 text-[11px] text-on-surface-variant">{t('progress.step', { step: formatNumber(stepNo), label: t(stepLabels[screen] || 'progress.getting') })}</p></div><p className="mt-1 text-xs text-on-surface-variant">{t('progress.nextPrefix')} {t(nextLabels[screen] || 'progress.nextGetting')}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-low"><div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, Math.round((completed / Math.max(1, total)) * 100))}%` }} /></div><p className="mt-1 text-[10px] text-on-surface-variant">{t('progress.done', { done: formatNumber(completed), total: formatNumber(total) })}</p></header>;
}
