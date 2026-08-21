import React, { useState, useEffect } from 'react';
import WelcomeView from './views/WelcomeView';
import TravelerTypeView from './views/TravelerTypeView';
import LocationAccessView from './views/LocationAccessView';
import ExploreView from './views/ExploreView';
import LandmarkDetailView from './views/LandmarkDetailView';
import LandmarkStoryView from './views/LandmarkStoryView';
import AudioPlayerModal from './components/AudioPlayerModal';
import DayPlanView from './views/DayPlanView';
import RoutePlanView from './views/RoutePlanView';
import LiveGuideView from './views/LiveGuideView';
import SavedTripsView from './views/SavedTripsView';
import ProfileView from './views/ProfileView';

import Header from './components/Navigation/Header';
import BottomNav from './components/Navigation/BottomNav';
import { MONUMENTS, DEFAULT_USER_PROFILE } from './data/monuments';

export default function App() {
  // Onboarding / Navigation state
  const [step, setStep] = useState(() => localStorage.getItem('sarthi_onboarded') ? 'dashboard' : 'welcome');
  const [activeTab, setActiveTab] = useState('explore'); // explore | plan | saved | profile

  // Selected details / Modal overlay layers
  const [selectedMonument, setSelectedMonument] = useState(null);
  const [storyMonument, setStoryMonument] = useState(null);
  const [audioMonument, setAudioMonument] = useState(null);
  const [arMonument, setArMonument] = useState(null);
  const [routeConfig, setRouteConfig] = useState(null); // { origin, destination }

  // App Core state (Persistent via LocalStorage)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('sarthi_user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
  });

  const [dayPlan, setDayPlan] = useState(() => {
    const saved = localStorage.getItem('sarthi_day_plan');
    if (saved) return JSON.parse(saved);
    // Default initial mock day plan: Humayun's Tomb, Lotus Temple
    return [MONUMENTS[0], MONUMENTS[3]];
  });

  const [savedMonuments, setSavedMonuments] = useState(() => {
    const saved = localStorage.getItem('sarthi_saved_monuments');
    if (saved) return JSON.parse(saved);
    // Initial bookmark: Qutub Minar, Akshardham
    return [MONUMENTS[1], MONUMENTS[2]];
  });

  // Sync to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('sarthi_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('sarthi_day_plan', JSON.stringify(dayPlan));
  }, [dayPlan]);

  useEffect(() => {
    localStorage.setItem('sarthi_saved_monuments', JSON.stringify(savedMonuments));
  }, [savedMonuments]);

  // Actions Callbacks
  const handleCompleteWelcome = () => {
    setStep('traveler_type');
  };

  const handleSelectTravelerType = (typeId) => {
    setUserProfile(prev => ({ ...prev, travelerType: typeId }));
    setStep('location_access');
  };

  const handleSelectLocation = (location) => {
    localStorage.setItem('sarthi_onboarded', 'true');
    setStep('dashboard');
  };

  const handleAddToDayPlan = (monument) => {
    if (dayPlan.some(p => p.id === monument.id)) {
      alert(`"${monument.title}" is already in your Day Plan!`);
      return;
    }
    setDayPlan(prev => [...prev, monument]);
    alert(`Added "${monument.title}" to your Day Plan!`);
  };

  const handleToggleBookmark = (monument) => {
    if (savedMonuments.some(p => p.id === monument.id)) {
      setSavedMonuments(prev => prev.filter(p => p.id !== monument.id));
    } else {
      setSavedMonuments(prev => [...prev, monument]);
    }
  };

  const handleRemoveBookmark = (id) => {
    setSavedMonuments(prev => prev.filter(p => p.id !== id));
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('sarthi_onboarded');
    localStorage.removeItem('sarthi_day_plan');
    localStorage.removeItem('sarthi_saved_monuments');
    localStorage.removeItem('sarthi_user_profile');
    setUserProfile(DEFAULT_USER_PROFILE);
    setDayPlan([MONUMENTS[0], MONUMENTS[3]]);
    setSavedMonuments([MONUMENTS[1], MONUMENTS[2]]);
    setStep('welcome');
  };

  // Render Onboarding Views
  if (step === 'welcome') return <WelcomeView onNext={handleCompleteWelcome} />;
  if (step === 'traveler_type') return <TravelerTypeView onNext={handleSelectTravelerType} onBack={() => setStep('welcome')} />;
  if (step === 'location_access') return <LocationAccessView onNext={handleSelectLocation} onBack={() => setStep('traveler_type')} />;

  // Render active popup overlay screens if triggered
  if (arMonument) {
    return <LiveGuideView monument={arMonument} onClose={() => setArMonument(null)} />;
  }

  if (storyMonument) {
    return (
      <LandmarkStoryView 
        monument={storyMonument} 
        onClose={() => setStoryMonument(null)} 
        onOpenAudioGuide={(m) => {
          setStoryMonument(null);
          setAudioMonument(m);
        }}
      />
    );
  }

  if (routeConfig) {
    return (
      <RoutePlanView 
        origin={routeConfig.origin} 
        destination={routeConfig.destination} 
        onClose={() => setRouteConfig(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      
      {/* Top Navbar layout (Desktop only) */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />

      {/* Main viewport area */}
      <main className="flex-grow w-full relative">
        
        {/* If viewing a selected Monument detail profile */}
        {selectedMonument ? (
          <LandmarkDetailView 
            monument={selectedMonument}
            onBack={() => setSelectedMonument(null)}
            onOpenAudioGuide={(m) => setAudioMonument(m)}
            onOpenLiveGuide={(m) => setArMonument(m)}
            onAddToDayPlan={handleAddToDayPlan}
            onOpenStory={(m) => setStoryMonument(m)}
          />
        ) : (
          /* Render Active Dashboard Tabs */
          <>
            {activeTab === 'explore' && (
              <ExploreView 
                onSelectMonument={(m) => setSelectedMonument(m)} 
                onAddToDayPlan={handleAddToDayPlan}
                userLocation={null} 
              />
            )}
            
            {activeTab === 'plan' && (
              <DayPlanView 
                dayPlan={dayPlan} 
                setDayPlan={setDayPlan} 
                onSelectMonument={(m) => setSelectedMonument(m)}
                onOpenRoute={(origin, destination) => setRouteConfig({ origin, destination })} 
              />
            )}
            
            {activeTab === 'saved' && (
              <SavedTripsView 
                savedMonuments={savedMonuments} 
                onRemoveBookmark={handleRemoveBookmark}
                onSelectMonument={(m) => setSelectedMonument(m)}
              />
            )}
            
            {activeTab === 'profile' && (
              <ProfileView 
                userProfile={userProfile} 
                onUpdateProfile={setUserProfile} 
                onResetOnboarding={handleResetOnboarding}
              />
            )}
          </>
        )}

      </main>

      {/* Mobile Bottom Glass nav bar */}
      <BottomNav 
        activeTab={selectedMonument ? null : activeTab} 
        setActiveTab={(tab) => {
          setSelectedMonument(null);
          setActiveTab(tab);
        }}
        onOpenAR={() => setArMonument(selectedMonument || MONUMENTS[0])} 
      />

      {/* Floating Audio Guide Player popup */}
      {audioMonument && (
        <AudioPlayerModal 
          monument={audioMonument} 
          onClose={() => setAudioMonument(null)} 
        />
      )}

    </div>
  );
}
