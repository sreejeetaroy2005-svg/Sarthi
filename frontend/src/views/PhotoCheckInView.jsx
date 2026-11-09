import { useT } from "../i18n/index";
import React, { useEffect, useRef, useState } from 'react';
import { identifyPlaceFromPhoto } from '../lib/aiClient';
import { getCameraDeniedMessage } from '../lib/gnaniClient';
export default function PhotoCheckInView({
  monument,
  itineraryCandidates = [],
  language = 'en',
  onCheckedIn,
  onPhotoCaptured,
  onPhotoCleared,
  onMonumentCompleted,
  onBack
}) {
  const t = useT();
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const requestRef = useRef(null);
  useEffect(() => {
    if (!photo) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => () => requestRef.current?.abort(), []);
  const checkPhoto = async file => {
    setPhoto(file);
    setError('');
    setResult(null);
    setChecking(true);
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const candidates = [...new Set([monument?.id, ...itineraryCandidates.map(place => place.id)].filter(Boolean))];
      const response = await identifyPlaceFromPhoto(file, candidates, language, {
        signal: controller.signal
      });
      if (!controller.signal.aborted) setResult(response);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || 'Photo check-in could not run. Try another image.');
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  };
  const retake = () => {
    requestRef.current?.abort();
    setChecking(false);
    setPhoto(null);
    setResult(null);
    setError('');
    onPhotoCleared?.();
    if (inputRef.current) inputRef.current.value = '';
  };
  const openCamera = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      inputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
      stream.getTracks().forEach(track => track.stop());
      inputRef.current?.click();
    } catch {
      setError(getCameraDeniedMessage(language));
      // Keep the file chooser available as a friendly alternative to camera access.
      inputRef.current?.click();
    }
  };
  return <div className="min-h-screen bg-background px-4 pt-5 pb-40 animate-fade-in">
      <div className="max-w-xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">{t("text|TRAVEL DAY · 3 OF 4")}</p>
            <h1 className="font-display text-3xl font-black text-primary mt-1">{t("text|Photo check-in")}</h1>
            <p className="text-sm text-on-surface-variant mt-2">{t("text|Show Sarthi what you’re looking at. We’ll compare it with your planned places.")}</p>
          </div>
          <button onClick={onBack} aria-label={t("text|Back to arrival briefing")} className="p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        </header>

        <section className="rounded-3xl overflow-hidden border border-outline-variant/30 bg-white shadow-sm">
          <div className="relative h-[min(55vh,420px)] bg-zinc-950 flex items-center justify-center">
            {preview ? <img src={preview} alt={t("text|Photo selected for check-in")} className="w-full h-full object-contain" /> : <div className="text-center text-white/80 px-6">
                <span className="material-symbols-outlined text-6xl">photo_camera</span>
                <p className="text-sm font-semibold mt-3">{t("text|Ready to identify a landmark")}</p>
                <p className="text-xs text-white/60 mt-1">{t("text|Your photo is sent securely to Sarthi’s server for this check only.")}</p>
              </div>}
          </div>
          <div className="p-4 space-y-3">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={t("text|Take or choose a monument photo")} onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              onPhotoCaptured?.(file);
              checkPhoto(file);
            }
          }} className="sr-only" />
            {photo && <button onClick={retake} className="min-h-11 rounded-xl border border-outline-variant/50 px-4 py-2.5 text-xs font-bold text-primary">{t("text|Retake or choose another")}</button>}

            {checking && <div role="status" className="rounded-2xl bg-primary/5 px-4 py-3 text-xs font-semibold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse">auto_awesome</span><span>{t("text|Sarthi is preparing your guide… Checking your photo against")}{itineraryCandidates.length || 1}{t("text|planned place")}{(itineraryCandidates.length || 1) === 1 ? '' : 's'}.</span>
              </div>}
            {result?.match && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" role="status">
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-800">{result.source === 'gemini' ? 'Gemini matched' : 'Sarthi demo match'}</p>
                <p className="font-display text-lg font-bold text-emerald-950 mt-1">{t("text|Yes, this is")}{result.landmark}{t("text|at")}{result.placeName}.</p>
                <p className="text-xs text-emerald-900 mt-1">{result.reason}</p>

              </div>}
            {result && !result.match && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4" role="status">
                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800">{result.source === 'gemini' ? 'Gemini result' : 'Fallback result'}</p>
                <p className="font-bold text-sm text-amber-950">{t("text|We couldn’t confirm that view.")}</p>
                <p className="text-xs text-amber-900 mt-1">{result.reason}</p>
              </div>}
            {error && <p role="alert" className="rounded-2xl bg-error-container/40 p-3 text-xs text-on-surface">{error}</p>}
          </div>
        </section>

        <div className="rounded-2xl border border-outline-variant/30 bg-white p-4">
          <p className="text-xs text-on-surface-variant">{t("text|Can’t get a clear photo? You can check in manually and continue to your authored route.")}</p>
          <button onClick={() => onCheckedIn({
          placeId: monument.id,
          method: 'manual',
          result: null
        })} className="mt-2 min-h-11 rounded-xl px-2 text-left text-xs font-bold text-primary underline underline-offset-2">{t("text|I’m here · check in manually")}</button>
          <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-on-surface-variant">{t("text|More options")}</summary><button onClick={() => onMonumentCompleted?.()} className="min-h-11 w-full rounded-xl border border-outline-variant/40 text-xs font-bold text-primary">{t("text|Mark this monument completed")}</button></details>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/30 bg-white/95 px-4 pb-safe pt-3 backdrop-blur"><div className="mx-auto max-w-xl"><button disabled={checking} onClick={() => {
          if (result?.match && result.placeId === monument.id) onCheckedIn({
            placeId: result.placeId,
            method: 'photo',
            result
          });else if (photo) onCheckedIn({
            placeId: monument.id,
            method: 'manual',
            result: null
          });else openCamera();
        }} className="min-h-12 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-50">{checking ? 'Checking your photo…' : result?.match && result.placeId === monument.id ? 'Confirm check-in · Start guided walk' : photo ? 'Continue with manual check-in' : 'Take a photo to check in'}</button></div></div>
    </div>;
}
