import React from 'react';
import WizardProgress from './WizardProgress';

/**
 * Shared frame for the planning wizard screens: back button and progress
 * eyebrow, title block and an optional sticky footer action.
 */
export default function StepShell({
  step,
  total = 9,
  eyebrow,
  title,
  subtitle,
  onBack,
  children,
  footer,
  wide = false,
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      <div className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
            title="Back"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
        ) : (
          <div className="w-10"></div>
        )}
        <span className="text-xs font-semibold text-outline tracking-widest">
          {eyebrow || `STEP ${step} OF ${total}`}
        </span>
        <div className="w-10"></div>
      </div>

      <div className="z-10 w-full max-w-5xl mx-auto mt-3">
        <WizardProgress step={step} total={total} />
      </div>

      <div className={`my-6 z-10 w-full ${wide ? 'max-w-5xl' : 'max-w-md'} mx-auto`}>
        <h1 className="font-display text-3xl font-bold text-primary mb-2 leading-tight">{title}</h1>
        {subtitle && (
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">{subtitle}</p>
        )}
      </div>

      <div className={`flex-grow z-10 w-full ${wide ? 'max-w-5xl' : 'max-w-md'} mx-auto`}>
        {children}
      </div>

      {footer && (
        <div className={`z-10 w-full ${wide ? 'max-w-5xl' : 'max-w-md'} mx-auto pt-4 pb-2`}>
          {footer}
        </div>
      )}
    </div>
  );
}
