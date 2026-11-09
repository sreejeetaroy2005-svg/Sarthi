import { useT } from "../i18n/index";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { synthesize } from '../lib/gnaniClient';
import { mergeChapterTranslations } from '../data/translations';

/**
 * AudioPlayerModal — plays monument audio chapters using Gnani TTS,
 * falling back to Web Speech API if the Gnani API fails.
 *
 * Props:
 *   monument      - monument object from monuments.js
 *   userLanguage   - language code: 'en' | 'hi' | 'ta' | 'bn'
 *   onClose        - close handler
 *   onNarrationEnd - called when all chapters finish (for hands-free flow)
 *   autoPlay       - if true, starts playing chapter 1 immediately
 */
export default function AudioPlayerModal({
  monument,
  userLanguage = 'en',
  onClose,
  onNarrationEnd,
  autoPlay = false
}) {
  const t = useT();
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioMode, setAudioMode] = useState('loading'); // 'gnani' | 'tts' | 'real' | 'loading'
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Merge translated chapters if a non-English language is selected
  const rawChapters = monument.audioChapters || [];
  const chapters = mergeChapterTranslations(rawChapters, monument.id, userLanguage);
  const activeChapter = chapters[activeChapterIndex] || null;

  // Stable primitives for the TTS effect: mergeChapterTranslations returns fresh
  // chapter objects each render, so depending on the object would re-run effects.
  const activeTranscript = activeChapter?.transcript || '';
  const activeChapterKey = activeChapter?.id || String(activeChapterIndex);

  // The one in-flight Gnani TTS request, so duplicate effects (StrictMode) can't
  // start a second one and so we can abort it when the user moves on.
  const ttsRequestRef = useRef(null); // { key, controller }

  // HTML5 audio element ref (for both real .mp3 and Gnani TTS blob playback)
  const audioRef = useRef(null);

  // Web Speech API fallback refs (TTS mode)
  const speechUtteranceRef = useRef(null);
  const ttsTimerRef = useRef(null);
  const ttsDurationRef = useRef(120);
  const [ttsElapsed, setTtsElapsed] = useState(0);

  // Track whether auto-play has been triggered
  const autoPlayTriggered = useRef(false);

  // ─── Determine audio mode when chapter changes ───────────────────
  useEffect(() => {
    if (!activeChapter) return;
    const hasRealAudio = activeChapter.audioSrc && activeChapter.audioSrc.trim() !== '';

    // If there's a pre-generated audio file, use it directly
    if (hasRealAudio) {
      setAudioMode('real');
    } else {
      // We'll try Gnani TTS first, falling back to Web Speech
      setAudioMode('loading');
    }
    setCurrentTime(0);
    setDuration(0);
    setTtsElapsed(0);
    setIsPlaying(false);

    // Stop any running speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (ttsTimerRef.current) {
      clearInterval(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }

    // Reset the HTML5 audio src
    if (audioRef.current) {
      audioRef.current.pause();
      if (hasRealAudio) {
        audioRef.current.src = activeChapter.audioSrc;
        audioRef.current.load();
      }
    }
  }, [activeChapterIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Try Gnani TTS when mode is 'loading' ───────────────────────
  // Only the chapter being played is ever requested — no prefetching of
  // upcoming chapters. Chapter/language changes and unmount abort the call
  // and the queue skips it before it reaches the network.
  useEffect(() => {
    if (audioMode !== 'loading' || !activeTranscript) return;
    const requestKey = `${userLanguage}|${activeChapterKey}`;
    const current = ttsRequestRef.current;

    // StrictMode runs mount effects twice; don't duplicate the same request.
    if (current && current.key === requestKey && !current.controller.signal.aborted) {
      return;
    }
    const controller = new AbortController();
    ttsRequestRef.current = {
      key: requestKey,
      controller
    };
    setIsLoadingAudio(true);
    synthesize(activeTranscript, userLanguage, {
      signal: controller.signal
    }).then(blobUrl => {
      if (controller.signal.aborted) return;
      setAudioMode('gnani');
      setIsLoadingAudio(false);
      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        audioRef.current.load();
      }
    }).catch(err => {
      if (controller.signal.aborted || err?.name === 'AbortError') return;
      console.warn('Gnani TTS failed, falling back to Web Speech:', err.message);
      setAudioMode('tts');
      setIsLoadingAudio(false);
    });
    return () => {
      controller.abort();
      if (ttsRequestRef.current?.controller === controller) {
        ttsRequestRef.current = null;
      }
    };
  }, [audioMode, activeChapterKey, activeTranscript, userLanguage]);

  // ─── Auto-play first chapter on mount if requested ───────────────
  useEffect(() => {
    if (autoPlay && !autoPlayTriggered.current && audioMode !== 'loading') {
      autoPlayTriggered.current = true;
      setTimeout(() => setIsPlaying(true), 200);
    }
  }, [autoPlay, audioMode]);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (activeChapter?.duration) {
        const parts = activeChapter.duration.split(':');
        ttsDurationRef.current = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      setDuration(ttsDurationRef.current);
      startWebSpeechTTS();
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
  }, [isPlaying, audioMode, activeChapterIndex, playbackRate]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const startWebSpeechTTS = () => {
    if (!window.speechSynthesis || !activeChapter) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeChapter.transcript);
    utterance.rate = playbackRate;

    // Try to pick a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const langLocale = userLanguage === 'hi' ? 'hi' : userLanguage === 'ta' ? 'ta' : userLanguage === 'bn' ? 'bn' : 'en';
    const voice = voices.find(v => v.lang.includes(langLocale)) || voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsPlaying(false);
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Playback controls ────────────────────────────────────────────
  const handlePlayPause = () => {
    if (isLoadingAudio) return;
    if (audioMode === 'real' || audioMode === 'gnani') {
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
    if (ttsTimerRef.current) {
      clearInterval(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    setTtsElapsed(0);
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex(prev => prev + 1);
      setTimeout(() => setIsPlaying(true), 150);
    } else {
      setIsPlaying(false);
      // All chapters done — notify parent for hands-free flow
      if (onNarrationEnd) onNarrationEnd();
    }
  }, [activeChapterIndex, chapters.length, onNarrationEnd]);
  const handlePrevChapter = () => {
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsTimerRef.current) {
      clearInterval(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    setTtsElapsed(0);
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(prev => prev - 1);
      setTimeout(() => setIsPlaying(true), 150);
    }
  };
  const handleSeek = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const targetTime = ratio * duration;
    if ((audioMode === 'real' || audioMode === 'gnani') && audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    } else {
      setTtsElapsed(Math.floor(targetTime));
    }
  };
  const seekForward = () => {
    if ((audioMode === 'real' || audioMode === 'gnani') && audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    } else {
      setTtsElapsed(prev => Math.min(prev + 10, ttsDurationRef.current));
    }
  };
  const seekBackward = () => {
    if ((audioMode === 'real' || audioMode === 'gnani') && audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    } else {
      setTtsElapsed(prev => Math.max(prev - 10, 0));
    }
  };
  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) {
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
  const formatTime = secs => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const progressPct = duration > 0 ? currentTime / duration * 100 : 0;
  const hasRealAudio = activeChapter?.audioSrc && activeChapter.audioSrc.trim() !== '';

  // Mode badge label
  const modeBadge = (() => {
    if (isLoadingAudio) return {
      label: 'Loading…',
      color: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    if (audioMode === 'gnani') return {
      label: 'Gnani AI',
      color: 'bg-green-100 text-green-700 border-green-200'
    };
    if (audioMode === 'real') return {
      label: 'AI Voice',
      color: 'bg-green-100 text-green-700 border-green-200'
    };
    return {
      label: 'TTS Fallback',
      color: 'bg-surface-container text-outline border-outline-variant/30'
    };
  })();
  if (!activeChapter) return null;
  return <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-50 flex items-end justify-center p-4">

      {/* Hidden HTML5 audio element */}
      <audio ref={audioRef} preload="metadata" src={hasRealAudio ? activeChapter.audioSrc : undefined} style={{
      display: 'none'
    }} />

      {/* Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-ambient-elevated border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden transform animate-slide-up">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary animate-pulse" style={{
            fontVariationSettings: "'FILL' 1"
          }}>
              {isLoadingAudio ? 'auto_awesome' : 'headphones'}
            </span>
            <span className="font-sans text-xs font-bold text-secondary uppercase tracking-widest">{t("text|Sarthi Audio Companion")}</span>
            {/* Mode badge */}
            <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wide ${modeBadge.color}`}>
              {modeBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-sm" title={t("text|Stop Narration")}>
              <span className="material-symbols-outlined text-sm">stop_circle</span>
              <span>{t("text|Stop Narration")}</span>
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-surface-container rounded-full transition-colors" title={t("text|Close modal")}>
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </div>

        {/* Monument / Chapter info */}
        <div className="p-6 text-center space-y-4 shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto shadow-md border border-outline-variant/30 bg-surface">
            <img src={monument.image} alt={monument.title} className="w-full h-full object-cover" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-secondary tracking-widest">{t("text|Chapter")}{activeChapterIndex + 1}{t("text|of")}{chapters.length}
            </span>
            <h2 className="font-display text-xl font-bold text-primary mt-1">{activeChapter.title}</h2>
            <p className="font-sans text-xs text-outline italic mt-0.5">{monument.title}</p>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoadingAudio && <div className="px-6 pb-3 flex justify-center">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
              <span>{t("text|Sarthi is preparing your guide…")}</span>
            </div>
          </div>}

        {/* Transcript toggle */}
        <div className="px-6 flex justify-center mb-2">
          <button onClick={() => setShowTranscript(!showTranscript)} className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-fixed/50 hover:bg-primary-fixed border border-primary-fixed/60 px-4 py-2 rounded-full transition-all">
            <span className="material-symbols-outlined text-[16px]">
              {showTranscript ? 'menu_book' : 'description'}
            </span>
            <span>{showTranscript ? 'Hide Audio Transcript' : 'Show Audio Transcript'}</span>
          </button>
        </div>

        {/* Scrollable chapter list or transcript */}
        <div className="flex-grow overflow-y-auto px-6 py-2 hide-scroll">
          {showTranscript ? <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 font-sans text-sm text-on-surface-variant leading-relaxed italic text-center">
              "{activeChapter.transcript}"
            </div> : <div className="space-y-2">
              <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-2">{t("text|Tour Chapter Segments")}</h4>
              {chapters.map((ch, idx) => {
            const isActive = activeChapterIndex === idx;
            return <button key={ch.id} onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              if (ttsTimerRef.current) {
                clearInterval(ttsTimerRef.current);
                ttsTimerRef.current = null;
              }
              setTtsElapsed(0);
              setActiveChapterIndex(idx);
              setTimeout(() => setIsPlaying(true), 150);
            }} className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${isActive ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/20 hover:bg-surface-container-low text-on-surface-variant'}`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">
                        {isActive ? isPlaying ? 'volume_up' : 'pause_circle' : 'play_circle'}
                      </span>
                      <div>
                        <span className="text-xs font-bold block">{ch.title}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold opacity-70">{ch.duration}</span>
                  </button>;
          })}
            </div>}
        </div>

        {/* Player controls */}
        <div className="bg-surface-container-low border-t border-outline-variant/30 p-6 space-y-4 shrink-0">

          {/* Clickable progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden relative cursor-pointer group" onClick={handleSeek} title={t("text|Seek")}>
              <div className="bg-primary h-full rounded-full transition-all duration-150" style={{
              width: `${progressPct}%`
            }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{
              left: `calc(${progressPct}% - 6px)`
            }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-outline">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between px-4">

            {/* Speed */}
            <button onClick={changePlaybackRate} className="text-xs font-bold text-primary bg-white border border-outline-variant/50 w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:bg-surface transition-colors" title={t("text|Change Speed")}>
              {playbackRate}x
            </button>

            {/* Previous chapter */}
            <button onClick={handlePrevChapter} disabled={activeChapterIndex === 0} className="text-on-surface-variant hover:text-primary disabled:opacity-30 flex items-center justify-center w-10 h-10" title={t("text|Previous Chapter")}>
              <span className="material-symbols-outlined text-2xl font-bold">skip_previous</span>
            </button>

            {/* Rewind 10s */}
            <button onClick={seekBackward} className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10" title={t("text|Rewind 10s")}>
              <span className="material-symbols-outlined text-2xl font-bold">replay_10</span>
            </button>

            {/* Play / Pause */}
            <button onClick={handlePlayPause} disabled={isLoadingAudio} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all ${isLoadingAudio ? 'bg-surface-variant text-outline cursor-wait' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
              <span className="material-symbols-outlined text-3xl font-bold">
                {isLoadingAudio ? 'auto_awesome' : isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Forward 10s */}
            <button onClick={seekForward} className="text-on-surface-variant hover:text-primary flex items-center justify-center w-10 h-10" title={t("text|Forward 10s")}>
              <span className="material-symbols-outlined text-2xl font-bold">forward_10</span>
            </button>

            {/* Next chapter */}
            <button onClick={handleNextChapter} disabled={activeChapterIndex >= chapters.length - 1} className="text-primary hover:text-primary-container disabled:opacity-30 flex items-center justify-center w-10 h-10" title={t("text|Next Chapter")}>
              <span className="material-symbols-outlined text-2xl font-bold">skip_next</span>
            </button>

          </div>
        </div>
      </div>
    </div>;
}
