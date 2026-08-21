import React, { useState, useEffect, useRef } from 'react';

export default function AudioPlayerModal({ monument, onClose }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // Progress percentage
  const [playbackRate, setPlaybackRate] = useState(1); // 1x, 1.25x, 1.5x, 2x
  const [showTranscript, setShowTranscript] = useState(false);

  const chapters = monument.audioChapters || [];
  const activeChapter = chapters[activeChapterIndex] || null;

  // Simulated audio progress timer
  const timerRef = useRef(null);
  const totalDurationSeconds = 120; // Default simulated chapter length
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Web Speech API Ref
  const speechUtteranceRef = useRef(null);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Handle play/pause toggle
  useEffect(() => {
    if (isPlaying) {
      // Start simulated timer ticking
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= totalDurationSeconds) {
            handleNextChapter();
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackRate);

      // Start text to speech narration
      startSpeaking();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pauseSpeaking();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeChapterIndex, playbackRate]);

  // Update progress bar
  useEffect(() => {
    setProgress((elapsedSeconds / totalDurationSeconds) * 100);
  }, [elapsedSeconds]);

  const startSpeaking = () => {
    if (!window.speechSynthesis || !activeChapter) return;
    
    // Stop any active speech first
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(activeChapter.transcript);
    utterance.rate = playbackRate;
    
    // Configure voice properties
    const voices = window.speechSynthesis.getVoices();
    // Try to find a nice English/local accent voice if available
    const chosenVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en'));
    if (chosenVoice) utterance.voice = chosenVoice;

    // Handle end of speech
    utterance.onend = () => {
      setIsPlaying(false);
      setElapsedSeconds(0);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  };

  const resumeSpeaking = () => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      startSpeaking();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleNextChapter = () => {
    stopSpeaking();
    setElapsedSeconds(0);
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevChapter = () => {
    stopSpeaking();
    setElapsedSeconds(0);
    if (activeChapterIndex > 0) {
      setActiveChapterIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const seekForward = () => {
    setElapsedSeconds((prev) => Math.min(prev + 10, totalDurationSeconds));
    // Fast seeking logic for TTS would require resynthesizing text but for simple mockup we just advance simulated progress
  };

  const seekBackward = () => {
    setElapsedSeconds((prev) => Math.max(prev - 10, 0));
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRateIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextRateIndex]);
    
    // Reset voice synthesis with new rate if playing
    if (isPlaying) {
      setTimeout(() => {
        startSpeaking();
      }, 50);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!activeChapter) return null;

  return (
    <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-50 flex items-end justify-center p-4">
      {/* Modal Card Layout */}
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-ambient-elevated border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden transform animate-slide-up">
        
        {/* Drag handler handle & Close */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
            <span className="font-sans text-xs font-bold text-secondary uppercase tracking-widest">Sarthi Audio Companion</span>
          </div>
          <button 
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Info detail banner */}
        <div className="p-6 text-center space-y-4 shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto shadow-md border border-outline-variant/30 bg-surface">
            <img src={monument.image} alt={monument.title} className="w-full h-full object-cover" />
          </div>
          
          <div>
            <span className="text-[10px] uppercase font-bold text-secondary tracking-widest">
              Chapter {activeChapterIndex + 1} of {chapters.length}
            </span>
            <h2 className="font-display text-xl font-bold text-primary mt-1">{activeChapter.title}</h2>
            <p className="font-sans text-xs text-outline italic mt-0.5">{monument.title}</p>
          </div>
        </div>

        {/* Transcript Area toggle tab */}
        <div className="px-6 flex justify-center mb-2">
          <button 
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-fixed/50 hover:bg-primary-fixed border border-primary-fixed/60 px-4 py-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">{showTranscript ? 'menu_book' : 'description'}</span>
            <span>{showTranscript ? 'Hide Audio Transcript' : 'Show Audio Transcript'}</span>
          </button>
        </div>

        {/* Scrollable middle container (Chapters or Transcript list) */}
        <div className="flex-grow overflow-y-auto px-6 py-2 hide-scroll">
          {showTranscript ? (
            <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 font-sans text-sm text-on-surface-variant leading-relaxed italic text-center">
              "{activeChapter.transcript}"
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-2">Tour Chapter Segments</h4>
              {chapters.map((ch, idx) => {
                const isActive = activeChapterIndex === idx;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      stopSpeaking();
                      setActiveChapterIndex(idx);
                      setElapsedSeconds(0);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-outline-variant/20 hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">
                        {isActive ? (isPlaying ? 'volume_up' : 'pause_circle') : 'play_circle'}
                      </span>
                      <span className="text-xs font-bold">{ch.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold opacity-70">{ch.duration}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Player controls dashboard */}
        <div className="bg-surface-container-low border-t border-outline-variant/30 p-6 space-y-4 shrink-0">
          
          {/* Progress Slider bar */}
          <div className="space-y-1">
            <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden relative">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-outline">
              <span>{formatTime(elapsedSeconds)}</span>
              <span>{formatTime(totalDurationSeconds)}</span>
            </div>
          </div>

          {/* Controls Button toolbar */}
          <div className="flex items-center justify-between px-4">
            
            {/* Speed Rate */}
            <button 
              onClick={changePlaybackRate}
              className="text-xs font-bold text-primary bg-white border border-outline-variant/50 w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:bg-surface transition-colors"
              title="Change Speed"
            >
              {playbackRate}x
            </button>

            {/* Step Back */}
            <button 
              onClick={seekBackward}
              className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10"
              title="Rewind 10s"
            >
              <span className="material-symbols-outlined text-2xl font-bold">replay_10</span>
            </button>

            {/* Big Main Play / Pause Circle */}
            <button 
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  if (window.speechSynthesis && window.speechSynthesis.paused) {
                    setIsPlaying(true);
                    resumeSpeaking();
                  } else {
                    setIsPlaying(true);
                  }
                }
              }}
              className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container transform active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-3xl font-bold">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Step Forward */}
            <button 
              onClick={seekForward}
              className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10"
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-2xl font-bold">forward_10</span>
            </button>

            {/* Next Chapter Button */}
            <button 
              onClick={handleNextChapter}
              disabled={activeChapterIndex >= chapters.length - 1}
              className="text-primary hover:text-primary-container disabled:opacity-30 flex items-center justify-center w-10 h-10"
              title="Next Segment"
            >
              <span className="material-symbols-outlined text-2xl font-bold">skip_next</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
