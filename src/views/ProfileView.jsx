import React, { useState } from 'react';

export default function ProfileView({ userProfile, onUpdateProfile, onResetOnboarding }) {
  const [offlineDownloads, setOfflineDownloads] = useState(false);
  const [currentLang, setCurrentLang] = useState(userProfile?.language || 'English');

  const languages = ['English', 'Hindi', 'French', 'Spanish', 'German'];

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    onUpdateProfile({ ...userProfile, language: lang });
  };

  return (
    <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6">
      
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
        <div className="text-center md:text-left flex-grow space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-md">
            {userProfile?.level || "Heritage Scholar"}
          </span>
          <h2 className="font-display text-2xl font-bold text-primary mt-1">{userProfile?.name || "Aarav Sharma"}</h2>
          <p className="font-sans text-xs text-outline leading-tight">{userProfile?.email || "aarav.travels@sarthi.ai"}</p>
        </div>

        {/* Level XP scoreboard badge */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto">
          <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Exploration XP</span>
          <h3 className="font-display text-2xl font-black text-primary mt-0.5">{userProfile?.explorationScore || 840}</h3>
          <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Top 5% of Delhi Explorers</p>
        </div>
      </div>

      {/* Travel Stats grid block */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">architecture</span>
          <p className="text-[10px] uppercase font-bold text-outline">Sites Visited</p>
          <h4 className="font-display text-lg font-bold text-primary mt-0.5">{userProfile?.monumentsVisited || 12}</h4>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">headphones</span>
          <p className="text-[10px] uppercase font-bold text-outline">Audio Hours</p>
          <h4 className="font-display text-lg font-bold text-primary mt-0.5">{userProfile?.audioHoursListened || 14.5}h</h4>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-outline-variant/30 p-4 text-center shadow-sm flex flex-col justify-center items-center">
          <span className="material-symbols-outlined text-secondary text-2xl mb-1">explore</span>
          <p className="text-[10px] uppercase font-bold text-outline">Travel Style</p>
          <h4 className="font-sans text-xs font-bold text-primary mt-1 uppercase tracking-wide">
            {userProfile?.travelerType || "Historian"}
          </h4>
        </div>
      </div>

      {/* App configuration options checklist */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
        <h3 className="font-sans font-bold text-primary text-base">App Preferences</h3>

        <div className="space-y-3">
          
          {/* Language selector settings */}
          <div className="flex justify-between items-center py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">translate</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">Narration Language</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">Choose your audio guide speaking tongue</p>
              </div>
            </div>
            <select
              value={currentLang}
              onChange={handleLanguageChange}
              className="bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-xs text-primary font-bold focus:ring-1 focus:ring-primary outline-none"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Offline downloads selector switcher */}
          <div className="flex justify-between items-center py-2.5 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">download</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">Offline Map Downloads</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">Pre-download Delhi coordinates and audio transcripts</p>
              </div>
            </div>
            <button
              onClick={() => setOfflineDownloads(!offlineDownloads)}
              className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 ${
                offlineDownloads ? 'bg-primary' : 'bg-outline-variant/50'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${
                offlineDownloads ? 'translate-x-5.5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Dynamic theme switcher layout */}
          <div className="flex justify-between items-center py-2.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">contrast</span>
              <div>
                <h4 className="font-sans font-bold text-xs text-on-surface">Display theme</h4>
                <p className="font-sans text-[10px] text-on-surface-variant">Toggle dark / light display interface styles</p>
              </div>
            </div>
            <button 
              onClick={() => alert("Theme changing dynamically. Default theme matches DESIGN.md tokens.")}
              className="text-xs font-bold text-primary bg-surface border border-outline-variant/40 px-3.5 py-2 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              System Defaults
            </button>
          </div>

        </div>
      </div>

      {/* Badges Achievements board list */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
        <h3 className="font-sans font-bold text-primary text-base">Earned Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(userProfile?.badges || []).map((badge, idx) => (
            <div key={idx} className="border border-outline-variant/20 rounded-2xl p-4 text-center space-y-1.5 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 flex items-center justify-center mx-auto border border-secondary/15">
                <span className="material-symbols-outlined text-secondary text-2xl font-bold">
                  {badge.icon || "military_tech"}
                </span>
              </div>
              <h4 className="font-sans font-bold text-xs text-primary leading-tight">{badge.title}</h4>
              <p className="font-sans text-[9px] text-on-surface-variant leading-tight">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer resetting tools */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm text-center">
        <button
          onClick={onResetOnboarding}
          className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center justify-center gap-1 mx-auto hover:underline"
        >
          <span className="material-symbols-outlined text-sm font-bold">restart_alt</span>
          <span>Reset App Onboarding Preferences</span>
        </button>
      </div>

    </div>
  );
}
