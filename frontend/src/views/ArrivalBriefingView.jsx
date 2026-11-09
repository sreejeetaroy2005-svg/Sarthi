import { useT } from "../i18n/index";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { synthesize } from '../lib/gnaniClient';
import { getTranslatedVisitorGuidelines } from '../data/translations';
const SECTIONS = [['Dress code', 'dressCode', 'checkroom'], ['Footwear', 'footwear', 'hiking'], ['Bags and cameras', 'bagsAndCameras', 'photo_camera'], ['Security', 'security', 'security'], ['Tickets', 'ticketCounter', 'confirmation_number'], ['Closing time', 'hours', 'schedule']];
export default function ArrivalBriefingView({
  monument,
  language = 'en',
  onGotIt
}) {
  const t = useT();
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const guidelines = getTranslatedVisitorGuidelines(monument?.visitorGuidelines || {}, monument?.id, language);
  const briefingText = useMemo(() => [`Welcome to ${monument?.title || 'the monument'}.`, ...SECTIONS.map(([title, key]) => `${title}. ${guidelines[key] || ''}`), 'Photo spots. ' + (guidelines.photoSpots || []).map(spot => `${spot.name}. ${spot.tip}`).join(' ')].filter(Boolean).join(' '), [monument?.title, guidelines]);
  const stop = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    window.speechSynthesis?.cancel();
    audioRef.current = null;
    utteranceRef.current = null;
    setSpeaking(false);
    setLoading(false);
  };
  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);
  const listen = async () => {
    if (speaking || loading) {
      stop();
      return;
    }
    setLoading(true);
    setSpeechError('');
    try {
      const url = await synthesize(briefingText, language);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeaking(false);
        setSpeechError('Audio playback failed. You can still read the briefing below.');
      };
      await audio.play();
      setLoading(false);
      setSpeaking(true);
    } catch {
      setLoading(false);
      if (!window.speechSynthesis) {
        setSpeechError('Spoken audio is unavailable in this browser. You can still read the briefing below.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(briefingText);
      const locale = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';
      utterance.lang = locale;
      const voice = window.speechSynthesis.getVoices().find(entry => entry.lang.toLowerCase().startsWith(language));
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setSpeechError('Spoken audio is unavailable. You can still read the briefing below.');
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };
  return <div className="min-h-screen bg-background px-4 pt-5 pb-28 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header>
          <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">{t("text|TRAVEL DAY · 2 OF 4")}</p>
          <h1 className="font-display text-3xl font-black text-primary mt-1">{t("text|Arrival briefing")}</h1>
          <p className="text-sm text-on-surface-variant mt-2">{t("text|A few useful things to know before you enter")}{monument?.title}.</p>
        </header>

        <div className="flex items-center justify-between gap-3 rounded-3xl bg-primary p-5 text-on-primary shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-primary-container font-bold">{t("text|Your guide, hands-free")}</p>
            <p className="font-display text-lg font-bold mt-1">{t("text|Listen to this briefing")}</p>
          </div>
          <button onClick={listen} aria-pressed={speaking} className="min-h-12 min-w-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
            <span className="material-symbols-outlined">{loading ? 'auto_awesome' : speaking ? 'stop' : 'volume_up'}</span>
          </button>
        </div>
        {loading && <p role="status" className="text-xs text-primary">{t("text|Sarthi is preparing your guide…")}</p>}
        {speechError && <p role="status" className="text-xs text-amber-800">{speechError}</p>}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(([title, key, icon]) => <article key={key} className="rounded-2xl border border-outline-variant/30 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-lg">{icon}</span>
                <h2 className="font-sans font-bold text-xs text-primary">{title}</h2>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant mt-2">{guidelines[key] || 'Check current instructions with the monument staff.'}</p>
            </article>)}
        </section>

        <section className="rounded-3xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <h2 className="font-sans font-bold text-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">photo_camera</span>{t("text|Photo spots")}</h2>
          <div className="mt-3 space-y-3">
            {(guidelines.photoSpots || []).map((spot, index) => <div key={spot.name} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/5 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
                <div><p className="text-xs font-bold text-on-surface">{spot.name}</p><p className="text-[11px] text-on-surface-variant mt-0.5">{spot.tip}</p></div>
              </div>)}
          </div>
          {guidelines.officialTicketsUrl && <a href={guidelines.officialTicketsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-4 rounded-xl border border-outline-variant/50 px-3 py-2 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">confirmation_number</span>{t("text|Official tickets · ASI")}<span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>}
        </section>

        <p className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[11px] leading-relaxed text-amber-950">
          {guidelines.notice || 'Check posted visitor guidance at the site. Rules and opening times can change.'}
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant/30 bg-white/95 backdrop-blur px-4 pt-3 pb-safe">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => {
          stop();
          onGotIt();
        }} className="w-full min-h-12 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md">{t("text|Got it · Check in with a photo")}</button>
        </div>
      </div>
    </div>;
}
