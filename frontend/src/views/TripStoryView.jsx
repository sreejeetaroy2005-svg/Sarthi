import { useT } from "../i18n/index";
import React, { useEffect, useState } from 'react';
import { synthesize } from '../lib/gnaniClient';
export default function TripStoryView({
  story,
  places = [],
  language = 'en',
  loading = false,
  error = '',
  onGenerate,
  onBack,
  onFinish
}) {
  const t = useT();
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const speak = async () => {
    if (!story?.summary) return;
    setSpeechError('');
    try {
      const url = await synthesize(`${story.title}. ${story.summary}`, language);
      const audio = new Audio(url);
      audio.onended = () => setSpeaking(false);
      await audio.play();
      setSpeaking(true);
    } catch {
      if (!window.speechSynthesis) {
        setSpeechError(t('story.speechUnavailable'));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(`${story.title}. ${story.summary}`);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };
  const share = async () => {
    const text = `${story.title}\n\n${story.summary}\n\n${t('story.visited', { places: places.map(place => place.title).join(', ') })}`;
    try {
      if (navigator.share) await navigator.share({
        title: story.title,
        text
      });else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);else throw new Error('Sharing is unavailable');
      setShareMessage(navigator.share ? t('story.shared') : t('story.copied'));
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setShareMessage(t('story.shareFailed'));
    }
  };
  return <div className="min-h-screen bg-background px-4 pt-5 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header><p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">{t("text|TRIP MEMORY")}</p><h1 className="font-display text-3xl font-black text-primary mt-1">{t("text|Your Trip Story")}</h1><p className="mt-2 text-sm text-on-surface-variant">{t("text|Your places and check-in photos from today.")}</p></header>

        {loading ? <div role="status" className="rounded-3xl bg-white p-8 text-center text-sm text-on-surface-variant"><span className="material-symbols-outlined animate-pulse text-secondary">auto_awesome</span><p className="mt-2">{t("text|Sarthi is preparing your guide… Writing your Trip Story in your language.")}</p></div> : story ? <>
            <article className="rounded-3xl bg-white border border-outline-variant/30 p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-bold text-secondary">{t(story.source === 'gemini' ? 'story.sourceGemini' : 'story.sourceFallback')}</p>
              <h2 className="font-display text-2xl font-bold text-primary mt-2">{story.title}</h2>
              <p className="text-sm leading-relaxed text-on-surface mt-3">{story.summary}</p>
              <details className="mt-4"><summary className="min-h-11 cursor-pointer rounded-xl bg-primary/5 px-4 py-3 text-xs font-bold text-primary">{t("text|More story options")}</summary><button onClick={speak} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 px-4 text-xs font-bold text-primary">{speaking ? t('story.stopListening') : t('story.listen')}</button><button onClick={share} className="mt-2 min-h-11 w-full rounded-xl border border-outline-variant/40 px-4 text-xs font-bold text-primary">{t("text|Share Trip Story")}</button></details>
              {speechError && <p role="status" className="text-[10px] text-amber-800 mt-2">{speechError}</p>}
            </article>
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {places.map(place => <figure key={place.id} className="rounded-2xl overflow-hidden bg-white border border-outline-variant/30">
                {place.photoDataUrl ? <img src={place.photoDataUrl} alt={`Trip photo from ${place.title}`} className="w-full aspect-square object-cover" /> : <div className="aspect-square bg-primary/5 flex items-center justify-center"><span className="material-symbols-outlined text-3xl text-primary">account_balance</span></div>}
                <figcaption className="p-2 text-[10px] font-bold text-primary">{place.title}</figcaption>
              </figure>)}
            </section>
            {shareMessage && <p role="status" className="text-xs text-center text-on-surface-variant">{shareMessage}</p>}
          </> : <div className="rounded-3xl bg-white p-5 text-sm text-on-surface-variant">{t("text|Your Trip Story is ready to create.")}</div>}

        {error && <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
        {!story && !loading && <button onClick={onGenerate} className="w-full min-h-12 rounded-2xl bg-secondary text-on-secondary text-sm font-bold">{t("text|Write my story")}</button>}
        <div className="fixed inset-x-0 bottom-0 border-t border-outline-variant/30 bg-white/95 px-4 pb-safe pt-3"><button onClick={onFinish} className="mx-auto block min-h-12 w-full max-w-2xl rounded-2xl bg-primary text-sm font-bold text-on-primary">{t("text|Finish and go Home")}</button></div>
      </div>
    </div>;
}
