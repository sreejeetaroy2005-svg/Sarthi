import React, { useState } from 'react';

export default function LandmarkStoryView({ monument, onClose, onOpenAudioGuide }) {
  const [openSecretIndex, setOpenSecretIndex] = useState(0);

  if (!monument || !monument.storyContent) return null;

  const { headline, intro, bodyParagraphs, architecturalSecrets } = monument.storyContent;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-on-surface pb-20 relative">
      {/* Warm editorial background and grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#e1e3e4_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Top Header navbar */}
      <div className="sticky top-0 bg-[#FAF9F5]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center z-30 border-b border-outline-variant/30">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-secondary">
          Editorial Journal
        </span>
        <button 
          onClick={() => onOpenAudioGuide(monument)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded-full hover:bg-primary-container text-xs font-bold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">headphones</span>
          <span>Audio Tour</span>
        </button>
      </div>

      {/* Main Narrative Article container */}
      <article className="max-w-2xl mx-auto px-6 py-8 relative z-10 space-y-6">
        
        {/* Editorial Title Block */}
        <div className="space-y-4 text-center">
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-outline">
            Chronicles of {monument.title}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black text-primary leading-tight">
            {headline}
          </h1>
          <div className="w-16 h-1 bg-secondary mx-auto rounded-full mt-4"></div>
        </div>

        {/* Highlighted Intro paragraph */}
        <p className="font-sans text-lg font-light text-on-surface-variant leading-relaxed italic border-l-4 border-secondary pl-5 py-1">
          {intro}
        </p>

        {/* Narrative body paragraphs */}
        <div className="font-sans text-base text-on-surface-variant leading-relaxed space-y-5">
          {bodyParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Interactive Secrets Accordion */}
        {architecturalSecrets && architecturalSecrets.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-outline-variant/30">
            <h3 className="font-display text-xl font-bold text-primary mb-3">Architectural Secrets &amp; Lore</h3>
            
            <div className="space-y-2">
              {architecturalSecrets.map((secret, sIdx) => {
                const isOpen = openSecretIndex === sIdx;
                return (
                  <div 
                    key={sIdx}
                    className={`border rounded-2xl overflow-hidden bg-white transition-all duration-300 ${
                      isOpen ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-outline-variant/40'
                    }`}
                  >
                    <button
                      onClick={() => setOpenSecretIndex(isOpen ? null : sIdx)}
                      className="w-full text-left px-5 py-4 flex justify-between items-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                    >
                      <span className="font-sans font-bold text-sm text-primary">{secret.title}</span>
                      <span className="material-symbols-outlined text-outline transition-transform duration-200">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 py-4 border-t border-outline-variant/20 bg-white font-sans text-xs text-on-surface-variant leading-relaxed">
                        {secret.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>

      {/* Narrative Footer banner */}
      <div className="max-w-2xl mx-auto px-6 mt-8 z-10 relative">
        <div className="bg-primary text-on-primary p-6 rounded-3xl text-center space-y-4 shadow-lg">
          <span className="material-symbols-outlined text-tertiary-fixed text-4xl">menu_book</span>
          <h3 className="font-display text-lg font-bold">Listen to the Walkthrough</h3>
          <p className="font-sans text-xs text-on-primary-container leading-relaxed">
            Let the audio guide lead you through each of these chambers. Sarthi auto-syncs the transcript as you step near monument landmarks.
          </p>
          <button
            onClick={() => onOpenAudioGuide(monument)}
            className="px-6 py-3 bg-secondary hover:bg-secondary-container text-on-secondary text-xs font-bold rounded-xl transition-all shadow-md transform active:scale-95 inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">play_circle</span>
            <span>Listen Guide Audio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
