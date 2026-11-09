import { useT } from "../../i18n/index";
import React from 'react';
export default function Header({
  activeTab,
  setActiveTab,
  userProfile
}) {
  const t = useT();
  const tabs = [{
    id: 'explore',
    label: 'Explore'
  }, {
    id: 'plan',
    label: 'Day Plan'
  }, {
    id: 'saved',
    label: 'Saved Trips'
  }, {
    id: 'profile',
    label: 'Profile'
  }];
  return <header className="hidden md:flex justify-between items-center px-6 py-4 w-full top-0 sticky z-50 shadow-sm bg-white/95 backdrop-blur-md border-b border-outline-variant/30">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl font-bold" style={{
        fontVariationSettings: "'FILL' 1"
      }}>explore</span>
        <h1 className="font-display text-2xl font-bold text-primary tracking-tight">{t("text|Sarthi")}</h1>
        <span className="text-[10px] uppercase font-bold tracking-widest bg-secondary-fixed text-secondary px-2 py-0.5 rounded-full ml-2">{t("text|Beta")}</span>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-2">
        {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 transform active:scale-95 ${isActive ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}>
              {tab.label}
            </button>;
      })}
      </nav>

      {/* Profile info & stats pill */}
      <div className="flex items-center gap-4">
        {userProfile && <div className="hidden lg:flex items-center gap-2 bg-primary-fixed/40 px-3.5 py-1.5 rounded-full border border-primary-fixed">
            <span className="material-symbols-outlined text-primary text-sm font-bold">military_tech</span>
            <span className="text-xs font-bold text-on-primary-fixed-variant">
              {userProfile.level} ({userProfile.explorationScore}{t("text|XP)")}</span>
          </div>}
        
        <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center border border-secondary/20 overflow-hidden cursor-pointer" onClick={() => setActiveTab('profile')}>
          <span className="material-symbols-outlined text-secondary font-semibold">person</span>
        </div>
      </div>
    </header>;
}
