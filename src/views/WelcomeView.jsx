import React from 'react';

export default function WelcomeView({ onNext }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <span className="font-display text-2xl font-bold text-primary tracking-tight">Sarthi</span>
        </div>
        <span className="font-sans text-xs font-semibold tracking-wider text-secondary bg-secondary-fixed/50 px-3 py-1.5 rounded-full">
          AI CULTURAL CONCIERGE
        </span>
      </div>

      {/* Hero Visual Area */}
      <div className="flex-grow flex flex-col justify-center items-center my-8 z-10">
        <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-ambient-elevated border border-outline-variant/30 group">
          <img 
            src="https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=800&auto=format&fit=crop" 
            alt="Humayun's Tomb, Delhi" 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 text-on-primary">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="material-symbols-outlined text-tertiary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xs font-semibold tracking-wide">4.8 (UNESCO Heritage)</span>
            </div>
            <h3 className="font-display text-xl font-bold">Humayun's Tomb, New Delhi</h3>
            <p className="text-xs text-on-primary-container mt-1 font-sans">The architectural masterpiece that inspired the Taj Mahal</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="max-w-md mx-auto w-full z-10 text-center flex flex-col gap-6">
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-bold tracking-tight text-primary leading-tight">
            Discover the stories <br/>written in stone
          </h1>
          <p className="font-sans text-on-surface-variant text-sm px-4 leading-relaxed">
            Your personal digital guide for Indian heritage. Step back in time with interactive maps, rich audio guides, and real-time AI spatial narration.
          </p>
        </div>

        <button 
          onClick={onNext}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>Begin Exploring</span>
          <span className="material-symbols-outlined transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>

        <div className="flex justify-center items-center gap-4 text-xs text-outline pt-2">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">headphones</span>
            <span>Audio Narrations</span>
          </div>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">map</span>
            <span>Day Planner</span>
          </div>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">center_focus_strong</span>
            <span>AR Live Guide</span>
          </div>
        </div>
      </div>
    </div>
  );
}
