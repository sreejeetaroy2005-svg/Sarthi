import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function AudioPlayerModal({ monument, onClose }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioMode, setAudioMode] = useState('loading'); // 'real' | 'tts' | 'loading'

  const chapters = monument.audioChapters || [];
  const activeChapter = chapters[activeChapterIndex] || null;

  // HTML5 audio element ref (real .mp3 mode)
  const audioRef = useRef(null);

  // Web Speech API fallback refs (TTS mode)
  const speechUtteranceRef = useRef(null);
  const ttsTimerRef = useRef(null);
  const ttsDurationRef = useRef(120);
  const [ttsElapsed, setTtsElapsed] = useState(0);

  // ─── Determine audio mode when chapter changes ───────────────────
  useEffect(() => {
    if (!activeChapter) return;

    const hasRealAudio = activeChapter.audioSrc && activeChapter.audioSrc.trim() !== '';
    setAudioMode(hasRealAudio ? 'real' : 'tts');
    setCurrentTime(0);
    setDuration(0);
    setTtsElapsed(0);
    setIsPlaying(false);

    // Stop any running speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Stop TTS timer
    if (ttsTimerRef.current) {
      clearInterval(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }

    // Reset the HTML5 audio src when switching chapters
    if (audioRef.current) {
      audioRef.current.pause();
      if (hasRealAudio) {
        audioRef.current.src = activeChapter.audioSrc;
        audioRef.current.load();
      }
    }
  }, [activeChapterIndex, activeChapter]);

  // ─── HTML5 audio event wiring ─────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => handleNextChapter();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // ─── Sync playbackRate to audio element ──────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // ─── TTS mode: play/pause/timer ──────────────────────────────────
  useEffect(() => {
    if (audioMode !== 'tts') return;

    if (isPlaying) {
      // Parse duration string "MM:SS" to seconds
      if (activeChapter?.duration) {
        const parts = activeChapter.duration.split(':');
        ttsDurationRef.current = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      setDuration(ttsDurationRef.current);

      // Start TTS
      startTTS();

      // Start timer
      ttsTimerRef.current = setInterval(() => {
        setTtsElapsed(prev => {
          const next = prev + 1;
          if (next >= ttsDurationRef.current) {
            clearInterval(ttsTimerRef.current);
            ttsTimerRef.current = null;
            handleNextChapter();
            return 0;
          }
          return next;
        });
      }, 1000 / playbackRate);
    } else {
      if (ttsTimerRef.current) {
        clearInterval(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    }

    return () => {
      if (ttsTimerRef.current) {
        clearInterval(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
    };
  }, [isPlaying, audioMode, activeChapterIndex, playbackRate]);

  // Sync TTS elapsed time to currentTime display
  useEffect(() => {
    if (audioMode === 'tts') {
      setCurrentTime(ttsElapsed);
    }
  }, [ttsElapsed, audioMode]);

  // ─── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (ttsTimerRef.current) {
        clearInterval(ttsTimerRef.current);
      }
    };
  }, []);

  // ─── TTS helpers ──────────────────────────────────────────────────
  const startTTS = () => {
    if (!window.speechSynthesis || !activeChapter) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeChapter.transcript);
    utterance.rate = playbackRate;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsPlaying(false);
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Playback controls ────────────────────────────────────────────
  const handlePlayPause = () => {
    if (audioMode === 'real') {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    } else {
      // TTS mode
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        if (window.speechSynthesis?.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          setIsPlaying(true);
        }
      }
    }
  };

  const handleNextChapter = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }

    setTtsElapsed(0);
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex(prev => prev + 1);
      // Auto-play next — triggered via a small delay to let chapter change settle
      setTimeout(() => setIsPlaying(true), 150);
    } else {
      setIsPlaying(false);
    }
  }, [activeChapterIndex, chapters.length]);

  const handlePrevChapter = () => {
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }

    setTtsElapsed(0);
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(prev => prev - 1);
      setTimeout(() => setIsPlaying(true), 150);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const targetTime = ratio * duration;

    if (audioMode === 'real' && audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    } else {
      setTtsElapsed(Math.floor(targetTime));
    }
  };

  const seekForward = () => {
    if (audioMode === 'real' && audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    } else {
      setTtsElapsed(prev => Math.min(prev + 10, ttsDurationRef.current));
    }
  };

  const seekBackward = () => {
    if (audioMode === 'real' && audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    } else {
      setTtsElapsed(prev => Math.max(prev - 10, 0));
    }
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioMode === 'real' && audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleClose = () => {
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsTimerRef.current) clearInterval(ttsTimerRef.current);
    onClose();
  };

  // ─── Utility ─────────────────────────────────────────────────────
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasRealAudio = activeChapter?.audioSrc && activeChapter.audioSrc.trim() !== '';

  if (!activeChapter) return null;

  return (
    <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-50 flex items-end justify-center p-4">

      {/* Hidden HTML5 audio element — always mounted, src updated per chapter */}
      <audio
        ref={audioRef}
        preload="metadata"
        src={hasRealAudio ? activeChapter.audioSrc : undefined}
        style={{ display: 'none' }}
      />

      {/* Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-ambient-elevated border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden transform animate-slide-up">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              headphones
            </span>
            <span className="font-sans text-xs font-bold text-secondary uppercase tracking-widest">
              Sarthi Audio Companion
            </span>
            {/* Mode badge */}
            {hasRealAudio ? (
              <span className="text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                AI Voice
              </span>
            ) : (
              <span className="text-[9px] font-bold bg-surface-container text-outline border border-outline-variant/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                TTS
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Monument / Chapter info */}
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

        {/* Transcript toggle */}
        <div className="px-6 flex justify-center mb-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-fixed/50 hover:bg-primary-fixed border border-primary-fixed/60 px-4 py-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showTranscript ? 'menu_book' : 'description'}
            </span>
            <span>{showTranscript ? 'Hide Audio Transcript' : 'Show Audio Transcript'}</span>
          </button>
        </div>

        {/* Scrollable chapter list or transcript */}
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
                const chHasAudio = ch.audioSrc && ch.audioSrc.trim() !== '';
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      if (audioRef.current) audioRef.current.pause();
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      if (ttsTimerRef.current) { clearInterval(ttsTimerRef.current); ttsTimerRef.current = null; }
                      setTtsElapsed(0);
                      setActiveChapterIndex(idx);
                      setTimeout(() => setIsPlaying(true), 150);
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
                      <div>
                        <span className="text-xs font-bold block">{ch.title}</span>
                        {chHasAudio && (
                          <span className="text-[9px] text-green-600 font-semibold">AI Voice ✓</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold opacity-70">{ch.duration}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Player controls */}
        <div className="bg-surface-container-low border-t border-outline-variant/30 p-6 space-y-4 shrink-0">

          {/* Clickable progress bar */}
          <div className="space-y-1">
            <div
              className="w-full bg-surface-variant rounded-full h-2 overflow-hidden relative cursor-pointer group"
              onClick={handleSeek}
              title="Seek"
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPct}%` }}
              />
              {/* Seek thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-outline">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between px-4">

            {/* Speed */}
            <button
              onClick={changePlaybackRate}
              className="text-xs font-bold text-primary bg-white border border-outline-variant/50 w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:bg-surface transition-colors"
              title="Change Speed"
            >
              {playbackRate}x
            </button>

            {/* Previous chapter */}
            <button
              onClick={handlePrevChapter}
              disabled={activeChapterIndex === 0}
              className="text-on-surface-variant hover:text-primary disabled:opacity-30 flex items-center justify-center w-10 h-10"
              title="Previous Chapter"
            >
              <span className="material-symbols-outlined text-2xl font-bold">skip_previous</span>
            </button>

            {/* Rewind 10s */}
            <button
              onClick={seekBackward}
              className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10"
              title="Rewind 10s"
            >
              <span className="material-symbols-outlined text-2xl font-bold">replay_10</span>
            </button>

            {/* Play / Pause */}
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container transform active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-3xl font-bold">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Forward 10s */}
            <button
              onClick={seekForward}
              className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10"
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-2xl font-bold">forward_10</span>
            </button>

            {/* Next chapter */}
            <button
              onClick={handleNextChapter}
              disabled={activeChapterIndex >= chapters.length - 1}
              className="text-primary hover:text-primary-container disabled:opacity-30 flex items-center justify-center w-10 h-10"
              title="Next Chapter"
            >
              <span className="material-symbols-outlined text-2xl font-bold">skip_next</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
