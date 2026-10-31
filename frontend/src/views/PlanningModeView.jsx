import React, { useState } from 'react';
import StepShell from '../components/PlanWizard/StepShell';

const MODES = [
  {
    id: 'auto',
    label: 'Plan it for me',
    icon: 'auto_awesome',
    desc: 'We pick the places that match your group, pace and interests, then build the schedule.',
    bullets: ['Pre-selected places', 'Balanced days', 'Editable afterwards'],
  },
  {
    id: 'manual',
    label: "I'll choose myself",
    icon: 'checklist',
    desc: 'Browse every place and select exactly what you want to see.',
    bullets: ['Nothing pre-selected', 'Full control', 'Same smart scheduling'],
  },
];

export default function PlanningModeView({ mode, onContinue, onBack }) {
  const [selected, setSelected] = useState(mode || null);

  return (
    <StepShell
      step={4}
      title="How should we plan it?"
      subtitle="You can still edit every stop after the plan is built."
      onBack={onBack}
      footer={
        <button
          onClick={() => onContinue(selected)}
          disabled={!selected}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>Continue</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      }
    >
      <div className="space-y-3">
        {MODES.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`w-full text-left p-5 rounded-3xl border transition-all transform active:scale-[0.99] ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-ambient-card'
                  : 'border-outline-variant/50 bg-white hover:border-outline'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{option.icon}</span>
                </div>
                <div className="flex-grow">
                  <h3 className={`font-sans font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {option.label}
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">{option.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {option.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-xl ${
                    isSelected ? 'text-primary' : 'text-outline-variant'
                  }`}
                  style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
