import React, { useState, useEffect, useRef } from 'react';
import { synthesize } from '../lib/gnaniClient';
import WizardProgress from '../components/PlanWizard/WizardProgress';
import { useT } from '../i18n';

/**
 * LanguageOnboardingView — first-launch language selection with big native-script buttons.
 *
 * Props:
 *   onSelectLanguage(langCode) - called with 'en', 'hi', 'ta', or 'bn'
 */
export default function LanguageOnboardingView({
  onSelectLanguage
}) {
  const t = useT();
  const [selectedLang, setSelectedLang] = useState(null);
  const [isGreeting, setIsGreeting] = useState(false);
  const ttsAbortRef = useRef(null);

  // Leaving the screen aborts the greeting request still queued for us.
  useEffect(() => {
    return () => {
      if (ttsAbortRef.current) ttsAbortRef.current.abort();
    };
  }, []);
  const languages = [{
    code: 'hi',
    label: 'हिन्दी',
    sublabel: 'Hindi',
    // TRANSLATION-REVIEW: Hindi greeting
    greeting: 'सार्थी में आपका स्वागत है! भारत की विरासत को अपनी भाषा में खोजें।',
    color: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
    activeColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-400',
    icon: '🕉️'
  }, {
    code: 'ta',
    label: 'தமிழ்',
    sublabel: 'Tamil',
    // TRANSLATION-REVIEW: Tamil greeting
    greeting: 'சார்த்தியில் உங்களை வரவேற்கிறோம்! இந்தியாவின் பாரம்பரியத்தை உங்கள் மொழியில் கண்டறியுங்கள்.',
    color: 'bg-red-50 border-red-300 hover:bg-red-100',
    activeColor: 'bg-red-100 border-red-500 ring-2 ring-red-400',
    icon: '🏛️'
  }, {
    code: 'bn',
    label: 'বাংলা',
    sublabel: 'Bengali',
    // TRANSLATION-REVIEW: Bengali greeting
    greeting: 'সার্থীতে আপনাকে স্বাগতম! আপনার ভাষায় ভারতের ঐতিহ্য আবিষ্কার করুন।',
    color: 'bg-green-50 border-green-300 hover:bg-green-100',
    activeColor: 'bg-green-100 border-green-500 ring-2 ring-green-400',
    icon: '🌸'
  }, {
    code: 'en',
    label: 'English',
    sublabel: 'English',
    greeting: "Welcome to Sarthi! Discover India's heritage in your language.",
    color: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
    activeColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-400',
    icon: '🗺️'
  }];
  const handleSelect = async lang => {
    if (isGreeting) return;
    setSelectedLang(lang.code);
    setIsGreeting(true);
    const controller = new AbortController();
    ttsAbortRef.current = controller;

    // Try to play the greeting via Gnani TTS
    try {
      const blobUrl = await synthesize(lang.greeting, lang.code, {
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      const audio = new Audio(blobUrl);
      audio.onended = () => {
        onSelectLanguage(lang.code);
      };
      audio.onerror = () => {
        // Fall back — just proceed after a short delay
        setTimeout(() => onSelectLanguage(lang.code), 1000);
      };
      await audio.play();
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') return;
      console.warn('Gnani TTS greeting failed:', err.message);
      // Fall back to Web Speech or just continue
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(lang.greeting);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.includes(lang.code)) || voices.find(v => v.lang.includes('en'));
        if (voice) utterance.voice = voice;
        utterance.onend = () => onSelectLanguage(lang.code);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => onSelectLanguage(lang.code), 1500);
      }
    }
  };
  return <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{
          fontVariationSettings: "'FILL' 1"
        }}>explore</span>
          <span className="font-display text-2xl font-bold text-primary tracking-tight">{t("text|Sarthi")}</span>
        </div>
        <span className="font-sans text-xs font-semibold tracking-wider text-secondary bg-secondary-fixed/50 px-3 py-1.5 rounded-full">
          {t('app.brandLine')}
        </span>
      </div>

      <div className="z-10 w-full max-w-5xl mx-auto mt-5">
        <WizardProgress step={1} />
        <p className="text-[10px] text-outline text-center mt-2 tracking-widest font-semibold">{t('wizard.step', {
          step: 1,
          total: 9
        })}</p>
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col justify-center items-center my-8 z-10 max-w-md mx-auto w-full">
        <div className="text-center mb-8 space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary leading-tight">
            {t('language.heading')}
          </h1>
          <p className="font-sans text-on-surface-variant text-sm px-4 leading-relaxed">
            {t('language.subtitle')}
          </p>
        </div>

        {/* Language buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {languages.map(lang => {
          const isActive = selectedLang === lang.code;
          return <button key={lang.code} onClick={() => handleSelect(lang)} disabled={isGreeting} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all transform active:scale-95 shadow-sm ${isActive ? lang.activeColor : lang.color} ${isGreeting && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <span className="text-3xl">{lang.icon}</span>
                <span className="font-display text-2xl font-bold text-primary">{lang.label}</span>
                <span className="text-xs text-on-surface-variant font-medium">{lang.sublabel}</span>
              </button>;
        })}
        </div>

        {/* Greeting status */}
        {isGreeting && selectedLang && <div className="mt-6 flex items-center gap-2 bg-surface-container border border-outline-variant/30 px-5 py-3 rounded-full animate-pulse">
            <span className="material-symbols-outlined text-secondary text-lg animate-bounce">volume_up</span>
            <span className="text-sm font-semibold text-primary">
              {t('language.greeting', {
            language: languages.find(l => l.code === selectedLang)?.sublabel
          })}
            </span>
          </div>}
      </div>

      {/* Footer hint */}
      <div className="z-10 text-center">
        <p className="text-xs text-outline">
          {t('language.hint')}
        </p>
      </div>
    </div>;
}
