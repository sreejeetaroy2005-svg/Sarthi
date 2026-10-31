import React, { useEffect, useMemo, useRef, useState } from 'react';
import { askGuideQuestion } from '../lib/aiClient';
import { getEmptyTranscriptMessage, getMicDeniedMessage, localeToLangCode, synthesize, transcribe } from '../lib/gnaniClient';
import { createMicRecorder } from '../lib/micRecorder';
import { mergeChapterTranslations, mergeWalkingRouteTranslations } from '../data/translations';

export default function GuidedWalkView({ monument, language = 'en', initialStopIndex = 0, onProgress, onComplete }) {
  const englishRoute = Array.isArray(monument?.walkingRoute) ? monument.walkingRoute : [];
  const route = useMemo(() => mergeWalkingRouteTranslations(englishRoute, monument?.id, language), [englishRoute, monument?.id, language]);
  const [stopIndex, setStopIndex] = useState(Math.min(initialStopIndex, Math.max(route.length - 1, 0)));
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [recording, setRecording] = useState(false);
  const [asking, setAsking] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [answer, setAnswer] = useState(null);
  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const utteranceRef = useRef(null);
  const requestRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const stop = route[stopIndex] || null;
  const rawChapters = monument?.audioChapters || [];
  const translatedChapters = useMemo(
    () => mergeChapterTranslations(rawChapters, monument?.id, language),
    [rawChapters, monument?.id, language]
  );
  const chapter = translatedChapters.find((entry) => entry.id === stop?.chapterId);

  useEffect(() => { onProgressRef.current?.(stopIndex); }, [stopIndex]);
  useEffect(() => () => {
    requestRef.current?.abort();
    recorderRef.current?.cleanup();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const stopSpeaking = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setStoryLoading(false);
  };

  const narrate = async (text) => {
    if (!text) return;
    stopSpeaking();
    setStoryLoading(true);
    setStoryError('');
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const url = await synthesize(text, language, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setStoryLoading(false); audioRef.current = null; };
      audio.onerror = () => { setStoryLoading(false); setStoryError('Audio playback failed. The route text is available below.'); };
      await audio.play();
      setStoryLoading(false);
    } catch (error) {
      if (controller.signal.aborted) return;
      setStoryLoading(false);
      if (!window.speechSynthesis) {
        setStoryError('Spoken audio is unavailable in this browser. Read the authored stop below.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = window.speechSynthesis.getVoices().find((entry) => entry.lang.toLowerCase().startsWith(language));
      if (voice) utterance.voice = voice;
      utteranceRef.current = utterance;
      utterance.onend = () => { utteranceRef.current = null; };
      window.speechSynthesis.speak(utterance);
      if (error?.name !== 'AbortError') setStoryError('Using your browser’s speech voice because Gnani audio is unavailable.');
    }
  };

  const handleNext = () => {
    stopSpeaking();
    setAnswer(null);
    if (stopIndex < route.length - 1) setStopIndex((index) => index + 1);
    else onComplete?.();
  };

  const startRecording = async (event) => {
    event.preventDefault();
    if (recording || asking) return;
    setQuestionError('');
    setAnswer(null);
    try {
      const recorder = createMicRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
    } catch {
      recorderRef.current?.cleanup();
      recorderRef.current = null;
      setQuestionError(`${getMicDeniedMessage(language)} You can still read the authored stop.`);
    }
  };

  const stopRecording = async (event) => {
    event?.preventDefault();
    const recorder = recorderRef.current;
    if (!recorder || !recorder.getIsRecording()) return;
    setRecording(false);
    setAsking(true);
    setQuestionError('');
    try {
      const audio = await recorder.stop();
      recorder.cleanup();
      recorderRef.current = null;
      const transcriptResult = await transcribe(audio);
      const question = transcriptResult.transcript?.trim();
      if (!question) throw new Error(getEmptyTranscriptMessage(language));
      const detectedLanguage = localeToLangCode(transcriptResult.detectedLanguage);
      const result = await askGuideQuestion(monument.id, question, detectedLanguage);
      setAnswer({ ...result, question });
      if (result.grounded && result.answer) narrate(result.answer);
    } catch (error) {
      setQuestionError(error.message || 'I could not understand that question. Try again.');
    } finally {
      setAsking(false);
    }
  };

  if (!route.length) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <section className="max-w-md w-full rounded-3xl bg-white border border-outline-variant/30 p-6 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-secondary">route</span>
          <h1 className="font-display text-2xl font-bold text-primary">This walk is being prepared</h1>
          <p className="text-sm text-on-surface-variant">Sarthi has no authored walking route for {monument?.title || 'this place'} yet. It won’t invent turns or stops.</p>
          <button onClick={onComplete} className="w-full min-h-12 rounded-2xl bg-primary text-on-primary text-sm font-bold">Finish this guide</button>
        </section>
      </div>
    );
  }

  const nextStop = route[stopIndex + 1];
  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-32 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="flex justify-between items-start gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">TRAVEL DAY · 4 OF 4</p>
            <h1 className="font-display text-3xl font-black text-primary mt-1">Guided walk</h1>
            <p className="text-xs text-on-surface-variant mt-1">{monument.title} · stop {stopIndex + 1} of {route.length}</p>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl">signpost</span>
        </header>

        <section className="relative h-48 rounded-3xl overflow-hidden bg-primary text-on-primary p-5 flex items-end">
          <img src={monument.heroImage || monument.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-primary-container">CURRENT STOP</p>
            <h2 className="font-display text-2xl font-bold mt-1">{stop.name}</h2>
            <p className="text-xs text-on-primary-container mt-1">{stop.storyChapter}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">near_me</span>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Follow this authored direction</h3>
          </div>
          <p className="text-sm leading-relaxed text-on-surface mt-2">{stop.direction}</p>
          <div className="mt-3 rounded-2xl bg-surface-container-low p-3 flex gap-2">
            <span className="material-symbols-outlined text-secondary">lightbulb</span>
            <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">Sarthi tip:</span> {stop.tip}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-outline">STORY CHAPTER</p>
              <h3 className="font-display text-lg font-bold text-primary mt-1">{chapter?.title || stop.storyChapter}</h3>
            </div>
            <button onClick={() => narrate(chapter?.transcript || stop.storyChapter)} disabled={storyLoading} className="min-h-12 min-w-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center disabled:opacity-50" aria-label="Listen to story chapter">
              <span className="material-symbols-outlined">{storyLoading ? 'auto_awesome' : 'volume_up'}</span>
            </button>
          </div>
          {storyLoading && <p role="status" className="text-[10px] text-primary mt-2">Sarthi is preparing your guide…</p>}
          <p className="text-xs text-on-surface-variant leading-relaxed mt-3">{chapter?.transcript || 'This stop is linked to the authored Sarthi chapter shown above.'}</p>
          {storyError && <p role="status" className="text-[10px] text-amber-800 mt-2">{storyError}</p>}
        </section>

        <section className="rounded-3xl border border-outline-variant/30 bg-zinc-950 p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">ASK ABOUT THIS PLACE</p>
              <p className="text-xs text-zinc-300 mt-1">{asking ? 'Sarthi is preparing your guide…' : 'Hold to ask in your voice. The answer is grounded in Sarthi’s authored notes.'}</p>
            </div>
            <button
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerCancel={stopRecording}
              onContextMenu={(event) => event.preventDefault()}
              disabled={asking}
              aria-label={recording ? 'Release to send your question' : 'Hold to ask a question'}
              className={`min-h-12 min-w-12 rounded-full flex items-center justify-center ${recording ? 'bg-red-500 text-white' : asking ? 'bg-amber-700 text-white' : 'bg-secondary text-on-secondary'}`}
            >
              <span className={`material-symbols-outlined ${asking ? 'animate-pulse' : ''}`}>{recording ? 'mic' : asking ? 'auto_awesome' : 'mic_none'}</span>
            </button>
          </div>
          {questionError && <p role="alert" className="text-xs text-amber-300">{questionError}</p>}
          {answer && (
            <div className="rounded-2xl bg-zinc-900 p-3">
              {answer.question && <p className="text-[10px] text-zinc-500">“{answer.question}”</p>}
              <p className="text-xs text-zinc-100 mt-1">{answer.answer || 'I don’t have a reliable answer in the authored notes for this question.'}</p>
              <p className="text-[9px] uppercase tracking-wider text-secondary mt-2">{answer.source === 'gemini' ? 'Gemini · grounded answer' : 'Local authored-fact fallback'}</p>
            </div>
          )}
        </section>

        {nextStop && (
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary">NEXT · {nextStop.name}</p>
            <p className="text-xs text-on-surface-variant mt-1">{nextStop.direction}</p>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant/30 bg-white/95 backdrop-blur px-4 pt-3 pb-safe">
        <div className="max-w-2xl mx-auto">
          <button onClick={handleNext} className="w-full min-h-12 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md">
            {nextStop ? `I’m here · ${nextStop.name}` : 'Complete guided walk'}
          </button>
        </div>
      </div>
    </div>
  );
}

