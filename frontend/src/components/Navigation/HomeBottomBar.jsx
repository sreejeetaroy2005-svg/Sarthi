import React from 'react';
import { useT } from '../../i18n';

export default function HomeBottomBar({ screen, onNavigate }) {
  const t = useT();
  const items = [['destination', t('nav.plan')], ['my_trip', t('nav.trip')], ['profile', t('nav.profile')]];
  return <nav aria-label={t('nav.main', {})} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-outline-variant/40 bg-white/95 px-2 pb-safe pt-2 backdrop-blur">{items.map(([id, label]) => <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => onNavigate(id)} className={`min-h-12 rounded-xl px-2 text-sm font-bold ${screen === id ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</button>)}</nav>;
}
