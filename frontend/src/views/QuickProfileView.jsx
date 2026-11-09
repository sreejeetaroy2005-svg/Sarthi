import React, { useState } from 'react';
import { useT } from '../i18n';

export default function QuickProfileView({ onContinue }) {
  const t = useT();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧘');
  const [homeCity, setHomeCity] = useState('Delhi');

  const avatars = ['🧘', '🧑‍🦱', '👩‍🦰', '👨‍🦱', '👩‍🦲', '🧔', '👱‍♀️', '👨‍🦳'];

  const handleContinue = () => {
    const defaultProfile = {
      name: name || 'Traveler',
      avatar: selectedAvatar,
      homeCity: homeCity || 'Delhi'
    };
    localStorage.setItem('sarthi_user_profile', JSON.stringify(defaultProfile));
    localStorage.setItem('sarthi_quick_profile', 'true');
    onContinue();
  };

  return (
    <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-sm mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-secondary mb-4">person</span>
        <h1 className="font-display text-3xl font-bold text-primary mb-2">{t('text|Quick Profile')}</h1>
        <p className="text-sm text-on-surface-variant mb-8">{t('text|Tell us a bit about yourself to get started')}</p>
      </div>

      {/* Name input */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary">face</span>
          <span className="font-sans font-bold text-lg text-on-surface">{t('text|Name')}</span>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('text|Your Name')}
          className="w-full text-sm font-bold text-primary border border-outline-variant/60 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Avatar selection */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary">face</span>
          <span className="font-sans font-bold text-lg text-on-surface">{t('text|Avatar')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {avatars.map(avatar => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAvatar === avatar ? 'bg-primary text-on-primary' : 'bg-surface/50 text-on-surface'} transition-all border border-outline-variant/30`}
            >
              <span className="material-symbols-outlined text-lg">{avatar}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Home city */}
      <div className="bg-white rounded-3xl border border-outline-variant/30 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary">location_on</span>
          <span className="font-sans font-bold text-lg text-on-surface">{t('text|Home City')}</span>
        </div>
        <input
          type="text"
          value={homeCity}
          onChange={e => setHomeCity(e.target.value)}
          placeholder={t('text|Your Home City')}
          className="w-full text-sm font-bold text-primary border border-outline-variant/60 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Continue button */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          className="w-full min-h-12 rounded-2xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">done</span>
          <span>{t('text|Get Started')}</span>
        </button>
      </div>
    </div>
  );
}