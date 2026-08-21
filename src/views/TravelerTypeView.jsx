import React, { useState } from 'react';
import { TRAVELER_TYPES } from '../data/monuments';

export default function TravelerTypeView({ onNext, onBack }) {
  const [selectedType, setSelectedType] = useState('historian');

  const handleContinue = () => {
    onNext(selectedType);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-xs font-semibold text-outline tracking-widest">STEP 1 OF 2</span>
        <div className="w-10"></div> {/* Spacer to keep centered balance */}
      </div>

      {/* Title block */}
      <div className="my-6 z-10 max-w-md mx-auto w-full">
        <h1 className="font-display text-3xl font-bold text-primary mb-2">What is your travel style?</h1>
        <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
          Sarthi tailboards your stories, suggestions, audio pacing, and hidden spots based on your cultural interests. Select one to customize your journey.
        </p>
      </div>

      {/* Grid of travel personas */}
      <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full z-10 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRAVELER_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 group relative overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-ambient-card ring-1 ring-primary'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-outline hover:bg-surface-container-low'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant group-hover:text-primary'
                }`}>
                  <span className="material-symbols-outlined block text-xl" style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>{type.icon}</span>
                </div>
                <div className="flex-grow pr-2">
                  <h3 className={`font-sans font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {type.label}
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant mt-1 leading-normal">
                    {type.desc}
                  </p>
                </div>
                
                {/* Checkmark overlay for selection */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary text-on-primary rounded-full w-5 h-5">
                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Button & progress spacer */}
      <div className="max-w-md mx-auto w-full z-10 pt-6">
        <button
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>Continue Journey</span>
          <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
