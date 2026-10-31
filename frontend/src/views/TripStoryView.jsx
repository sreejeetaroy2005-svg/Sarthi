import React, { useEffect, useState } from 'react';
import { synthesize } from '../lib/gnaniClient';

export default function TripStoryView({ story, places = [], language = 'en', loading = false, error = '', onGenerate, onBack, onFinish }) {
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
        setSpeechError('Spoken playback is unavailable in this browser.');
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
    const text = `${story.title}\n\n${story.summary}\n\nVisited: ${places.map((place) => place.title).join(', ')}`;
    try {
      if (navigator.share) await navigator.share({ title: story.title, text });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error('Sharing is unavailable');
      setShareMessage(navigator.share ? 'Trip Story shared.' : 'Trip Story copied to clipboard.');
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setShareMessage('Could not share from this browser. You can select and copy the story text.');
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-10 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="flex justify-between items-start gap-3">
          <div><p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">TRIP MEMORY</p><h1 className="font-display text-3xl font-black text-primary mt-1">Your Trip Story</h1></div>
          <button onClick={onBack} className="p-2 rounded-full text-primary" aria-label="Back to trip summary"><span className="material-symbols-outlined">arrow_back</span></button>
        </header>

        {loading ? <div role="status" className="rounded-3xl bg-white p-8 text-center text-sm text-on-surface-variant"><span className="material-symbols-outlined animate-pulse text-secondary">auto_awesome</span><p className="mt-2">Sarthi is preparing your guide… Writing your Trip Story in your language.</p></div> : story ? (
          <>
            <article className="rounded-3xl bg-white border border-outline-variant/30 p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-bold text-secondary">{story.source === 'gemini' ? 'Written with Gemini' : 'Sarthi story · rules-based fallback'}</p>
              <h2 className="font-display text-2xl font-bold text-primary mt-2">{story.title}</h2>
              <p className="text-sm leading-relaxed text-on-surface mt-3">{story.summary}</p>
              <button onClick={speak} className="mt-4 min-h-10 rounded-xl bg-primary/5 px-4 text-xs font-bold text-primary"><span className="material-symbols-outlined text-sm align-middle mr-1">{speaking ? 'volume_up' : 'play_arrow'}</span>Listen to your story</button>
              {speechError && <p role="status" className="text-[10px] text-amber-800 mt-2">{speechError}</p>}
            </article>
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {places.map((place) => <figure key={place.id} className="rounded-2xl overflow-hidden bg-white border border-outline-variant/30">
                {place.photoDataUrl ? <img src={place.photoDataUrl} alt={`Trip photo from ${place.title}`} className="w-full aspect-square object-cover" /> : <div className="aspect-square bg-primary/5 flex items-center justify-center"><span className="material-symbols-outlined text-3xl text-primary">account_balance</span></div>}
                <figcaption className="p-2 text-[10px] font-bold text-primary">{place.title}</figcaption>
              </figure>)}
            </section>
            <button onClick={share} className="w-full min-h-12 rounded-2xl bg-secondary text-on-secondary text-sm font-bold"><span className="material-symbols-outlined align-middle mr-2">ios_share</span>Share Trip Story</button>
            {shareMessage && <p role="status" className="text-xs text-center text-on-surface-variant">{shareMessage}</p>}
          </>
        ) : <div className="rounded-3xl bg-white p-5 text-sm text-on-surface-variant">Your Trip Story is ready to create.</div>}

        {error && <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
        {!story && !loading && <button onClick={onGenerate} className="w-full min-h-12 rounded-2xl bg-secondary text-on-secondary text-sm font-bold">Write my story</button>}
        <button onClick={onFinish} className="w-full min-h-11 rounded-2xl border border-outline-variant/40 text-xs font-bold text-primary">Finish for today</button>
      </div>
    </div>
  );
}

