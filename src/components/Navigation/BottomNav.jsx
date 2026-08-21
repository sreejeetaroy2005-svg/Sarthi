import React from 'react';

export default function BottomNav({ activeTab, setActiveTab, onOpenAR }) {
  const tabs = [
    { id: 'explore', label: 'Explore', icon: 'map' },
    { id: 'plan', label: 'Day Plan', icon: 'calendar_today' },
    { id: 'ar', label: 'Live AR', icon: 'center_focus_strong', isSpecial: true },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
    { id: 'profile', label: 'Profile', icon: 'person' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-ambient-bottom px-4 pb-safe pt-2">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={onOpenAR}
                className="flex flex-col items-center justify-center -translate-y-4 transform active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-lg border-4 border-background hover:bg-secondary-container animate-ar-pulse">
                  <span className="material-symbols-outlined text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {tab.icon}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-secondary mt-1">{tab.label}</span>
              </button>
            );
          }

          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 transform active:scale-95 ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'
              }`}
            >
              <span 
                className="material-symbols-outlined text-2xl" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
              >
                {tab.icon}
              </span>
              <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
