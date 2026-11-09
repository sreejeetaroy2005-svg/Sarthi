import React from 'react';
import { useT } from '../../i18n';

export default function WizardProgress({ step, total = 9, className = '' }) {
  const t = useT();
  const progress = Math.min(100, Math.max(0, (Number(step) / total) * 100 || 0));
  return (
    <div className={`w-full ${className}`} aria-label={t('wizard.step', { step, total })}>
      <div className="h-1.5 rounded-full bg-outline-variant/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="sr-only">{t('wizard.step', { step, total })}</span>
    </div>
  );
}
