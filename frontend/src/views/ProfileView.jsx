import { useT } from "../i18n/index";
import React, { useState } from 'react';
import { formatNumber } from '../i18n';
export default function ProfileView({
  userProfile,
  onUpdateProfile,
  onResetOnboarding,
  onPlanNewTrip,
  onShowToast,
  handsFreeSetting = true,
  onToggleHandsFree
}) {
  const t = useT();
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(userProfile?.name || 'Aarav Sharma');
  const [userEmail, setUserEmail] = useState(userProfile?.email || 'aarav.travels@sarthi.ai');

  // Supported languages for Gnani TTS/STT — label → language code mapping
  const languages = [{
    label: 'English',
    code: 'en'
  }, {
    label: 'हिन्दी',
    code: 'hi'
  }, {
    label: 'தமிழ்',
    code: 'ta'
  }, {
    label: 'বাংলা',
    code: 'bn'
  }];
  const themes = ['Light Standard', 'Dark Elegance', 'Heritage Warm'];
  const currentTheme = userProfile?.theme || 'Light Standard';
  const themeLabel = theme => t(({ 'Light Standard': 'theme.light', 'Dark Elegance': 'theme.dark', 'Heritage Warm': 'theme.warm' })[theme] || 'theme.light');
  const currentLang = userProfile?.language || 'en';
  const levelKey = ({ 'Heritage Master': 'profile.level.master', 'Heritage Scholar': 'profile.level.scholar' })[userProfile?.level] || 'profile.level.scholar';
  const offlineDownloads = userProfile?.offlineDownloads ?? false;
  const handleLanguageChange = e => {
    const langCode = e.target.value;
    const langObj = languages.find(l => l.code === langCode);
    onUpdateProfile({
      ...userProfile,
      language: langCode
    });
    if (onShowToast) onShowToast(t('toast.languageSet', { language: langObj?.label || langCode }), 'translate');
  };
  const handleToggleOffline = () => {
    const next = !offlineDownloads;
    onUpdateProfile({
      ...userProfile,
      offlineDownloads: next
    });
    if (onShowToast) {
      onShowToast(t(next ? 'toast.offlineEnabled' : 'toast.offlineDisabled'), next ? 'download_done' : 'cloud_off');
    }
  };
  const handleCycleTheme = () => {
    const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    onUpdateProfile({
      ...userProfile,
      theme: nextTheme
    });
    if (onShowToast) onShowToast(t('toast.themeChanged', { theme: themeLabel(nextTheme) }), 'palette');
  };
  const handleSaveProfile = () => {
    onUpdateProfile({
      ...userProfile,
      name: userName,
      email: userEmail
    });
    setIsEditingName(false);
    if (onShowToast) onShowToast(t('toast.profileSaved'), 'check');
  };
  return <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Profile Header card with status scores */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        {/* Avatar badge */}
        <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary relative shrink-0">
          <span className="material-symbols-outlined text-secondary text-4xl font-bold">person</span>
          <div className="absolute bottom-0 right-0 bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
            <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
          </div>
        </div>

        {/* User core description metadata */}
        <div className="text-center md:text-left flex-grow space-y-1.5 w-full md:w-auto">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] uppercase font-bold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-md">
              {t(levelKey)}
            </span>
            <button onClick={() => setIsEditingName(!isEditingName)} className="min-h-11 text-xs text-outline hover:text-primary flex items-center gap-0.5" title={t("text|Edit Profile")}>
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{isEditingName ? t('common.cancel') : t('text|Edit')}</span>
            </button>
          </div>

          {isEditingName ? <div className="space-y-2 pt-2">
              <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder={t("text|Your Name")} className="w-full text-sm font-bold text-primary border border-outline-variant/60 rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary" />
              <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder={t("text|Email Address")} className="w-full text-xs text-outline border border-outline-variant/60 rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container">{t("text|Save Changes")}</button>
            </div> : <>
              <h2 className="font-display text-2xl font-bold text-primary mt-1">{userProfile?.name || userName}</h2>
              <p className="font-sans text-xs text-outline leading-tight">{userProfile?.email || userEmail}</p>
            </>}
        </div>

        {/* Level XP scoreboard badge */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto">
          <span className="text-[9px] uppercase font-bold text-primary tracking-widest">{t("text|Exploration XP")}</span>
          <h3 className="font-display text-2xl font-black text-primary mt-0.5">{formatNumber(userProfile?.explorationScore || 840)}</h3>
          <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">{t("text|Top 5% of Delhi Explorers")}</p>
        </div>
      </div>

      {/* Travel Stats grid block */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">architecture</span>
          <p className="text-[10px] uppercase font-bold text-outline">{t("text|Sites Visited")}</p>
          <h4 className="font-display text-lg font-bold text-primary mt-0.5">{formatNumber(userProfile?.monumentsVisited || 12)}</h4>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">headphones</span>
          <p className="text-[10px] uppercase font-bold text-outline">{t("text|Audio Hours")}</p>
          <h4 className="font-display text-lg font-bold text-primary mt-0.5">{formatNumber(userProfile?.audioHoursListened || 14.5)} {t('profile.hourAbbr')}</h4>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm flex flex-col justify-center items-center">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">explore</span>
          <p className="text-[10px] uppercase font-bold text-outline">{t("text|Travel Style")}</p>
          <h4 className="font-sans text-xs font-bold text-primary mt-1 uppercase tracking-wide">
            {t(`profile.traveler.${userProfile?.travelerType || 'historian'}`)}
          </h4>
        </div>
      </div>

      {/* App configuration options checklist */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
        <h3 className="font-sans font-bold text-primary text-base">{t("text|App Preferences")}</h3>

        <div className="space-y-3">
          
          {/* Language selector settings */}
          <div className="flex justify-between items-center py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">translate</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">{t("text|Narration Language")}</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">{t("text|Choose your audio guide speaking tongue")}</p>
              </div>
            </div>
            <select aria-label={t("text|Narration Language")} value={currentLang} onChange={handleLanguageChange} className="min-h-11 bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs text-primary font-bold focus:ring-1 focus:ring-primary outline-none cursor-pointer">
              {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
            </select>
          </div>

          {/* Hands-free Auto-narration Switch */}
          <div className="flex justify-between items-center py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">podcasts</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">{t("text|Hands-free Auto-Narration")}</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">{t("text|Automatically speak story when entering 150m of a monument")}</p>
              </div>
            </div>
            <button onClick={() => {
            if (onToggleHandsFree) onToggleHandsFree();
            if (onShowToast) {
              onShowToast(t(!handsFreeSetting ? 'toast.handsFreeEnabled' : 'toast.handsFreeDisabled'), !handsFreeSetting ? 'headphones' : 'headset_off');
            }
          }} className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${handsFreeSetting ? 'bg-primary' : 'bg-outline-variant/50'}`} title={t("text|Toggle Hands-free Auto-narration")}>
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${handsFreeSetting ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">{t("text|Demo clock")}</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">{t("text|Set today’s time to preview meals, fatigue, and monument closing rules.")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input aria-label={t("text|Demo clock time")} type="time" value={userProfile?.demoClockTime || ''} onChange={event => onUpdateProfile({
              ...userProfile,
              demoClockTime: event.target.value
            })} className="rounded-xl border border-outline-variant/50 bg-surface px-3 py-2 text-xs font-bold text-primary" />
              {userProfile?.demoClockTime && <button onClick={() => onUpdateProfile({
              ...userProfile,
              demoClockTime: ''
            })} className="text-[10px] font-bold text-primary">{t("text|Use live time")}</button>}
            </div>
          </div>

          {/* Offline downloads selector switcher */}
          <div className="flex justify-between items-center py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">download</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">{t("text|Offline Map Downloads")}</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">{t("text|Pre-download Delhi coordinates and audio transcripts")}</p>
              </div>
            </div>
            <button onClick={handleToggleOffline} className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${offlineDownloads ? 'bg-primary' : 'bg-outline-variant/50'}`} title={t("text|Toggle Offline Downloads")}>
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${offlineDownloads ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Dynamic theme switcher layout */}
          <div className="flex justify-between items-center py-2.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">palette</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">{t("text|Display Theme")}</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">{t("text|Switch UI color scheme and contrast")}</p>
              </div>
            </div>
            <button onClick={handleCycleTheme} className="text-xs font-bold text-primary bg-surface border border-outline-variant/40 px-3.5 py-2 rounded-xl hover:bg-surface-container-low transition-all shadow-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">sync</span>
              <span>{themeLabel(currentTheme)}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Badges Achievements board list */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
        <h3 className="font-sans font-bold text-primary text-base">{t("text|Earned Badges")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(userProfile?.badges || []).map((badge, idx) => <div key={idx} className="border border-outline-variant/20 rounded-2xl p-4 text-center space-y-1.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 flex items-center justify-center mx-auto border border-secondary/15">
                <span className="material-symbols-outlined text-secondary text-2xl font-bold">
                  {badge.icon || "military_tech"}
                </span>
              </div>
              <h4 className="font-sans font-bold text-xs text-primary leading-tight">{badge.title}</h4>
              <p className="font-sans text-[9px] text-on-surface-variant leading-tight">{badge.desc}</p>
            </div>)}
        </div>
      </div>

      {/* Trip controls */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-sans font-bold text-primary text-base">{t("text|Your trip")}</h3>
          <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">{t("text|Clear the current plan and start the planning wizard again.")}</p>
        </div>
        <button onClick={onPlanNewTrip} className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors shrink-0">
          <span className="material-symbols-outlined text-sm">edit_calendar</span>
          <span>{t("text|Plan a new trip")}</span>
        </button>
      </div>

      {/* Developer resetting tools */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm text-center">
        <button onClick={onResetOnboarding} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center justify-center gap-1.5 mx-auto hover:underline p-2 rounded-xl">
          <span className="material-symbols-outlined text-sm font-bold">restart_alt</span>
          <span>{t("text|Reset App Onboarding & Data Preferences")}</span>
        </button>
      </div>

    </div>;
}
