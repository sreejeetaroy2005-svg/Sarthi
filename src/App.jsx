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
import useGeolocation from './hooks/useGeolocation';
import { getDistanceInMeters } from './utils/distance';

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

  // App-wide Toast notification state
  const [toast, setToast] = useState(null); // { message, icon }

  const showToast = (message, icon = 'info') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // App Core state (Persistent via LocalStorage)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('sarthi_user_profile');
    return saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
  });

  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('sarthi_user_location');
    return saved ? JSON.parse(saved) : null;
  });

  // Continuously track user's active geolocation
  const {
    location: currentCoords,
    isSimulated,
    error: geoError,
    setSimulatedCoords
  } = useGeolocation({
    enabled: step === 'dashboard',
    initialLocation: userLocation,
    onPermissionDenied: () => {
      if (!userLocation || !userLocation.isSandbox) {
        setStep('location_access');
      }
    }
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

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('sarthi_user_location', JSON.stringify(userLocation));
    } else {
      localStorage.removeItem('sarthi_user_location');
    }
  }, [userLocation]);

  // Actions Callbacks
  const handleCompleteWelcome = () => {
    setStep('traveler_type');
  };

  const handleSelectTravelerType = (typeId) => {
    setUserProfile(prev => ({ ...prev, travelerType: typeId }));
    setStep('location_access');
  };

  const handleSelectLocation = (location) => {
    setUserLocation(location);
    localStorage.setItem('sarthi_onboarded', 'true');
    setStep('dashboard');
    showToast('Welcome to Delhi Heritage Guide!', 'explore');
  };

  const handleAddToDayPlan = (monument) => {
    if (dayPlan.some(p => p.id === monument.id)) {
      showToast(`"${monument.title}" is already in your Day Plan`, 'info');
      return;
    }
    setDayPlan(prev => [...prev, monument]);
    showToast(`Added "${monument.title}" to your Day Plan!`, 'add_task');
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

  const handleImportItinerary = (itinerary) => {
    const matchedStops = [];
    if (itinerary.stopIds) {
      itinerary.stopIds.forEach(id => {
        const found = MONUMENTS.find(m => m.id === id);
        if (found && !dayPlan.some(p => p.id === found.id)) {
          matchedStops.push(found);
        }
      });
    }

    if (matchedStops.length > 0) {
      setDayPlan(prev => [...prev, ...matchedStops]);
      showToast(`Imported ${matchedStops.length} stops from "${itinerary.title}" to Day Plan!`, 'checklist');
    } else {
      showToast(`Stops from "${itinerary.title}" are already in your plan!`, 'info');
    }
    setSelectedMonument(null);
    setActiveTab('plan');
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('sarthi_onboarded');
    localStorage.removeItem('sarthi_day_plan');
    localStorage.removeItem('sarthi_saved_monuments');
    localStorage.removeItem('sarthi_user_profile');
    localStorage.removeItem('sarthi_user_location');
    setUserLocation(null);
    setUserProfile(DEFAULT_USER_PROFILE);
    setDayPlan([MONUMENTS[0], MONUMENTS[3]]);
    setSavedMonuments([MONUMENTS[1], MONUMENTS[2]]);
    setStep('welcome');
    showToast('Preferences and data reset successfully.', 'restart_alt');
  };

  // Render Onboarding Views
  if (step === 'welcome') return <WelcomeView onNext={handleCompleteWelcome} />;
  if (step === 'traveler_type') return <TravelerTypeView onNext={handleSelectTravelerType} onBack={() => setStep('welcome')} />;
  if (step === 'location_access') return <LocationAccessView onNext={handleSelectLocation} onBack={() => setStep('traveler_type')} />;

  // Render active popup overlay screens if triggered
  if (arMonument) {
    return (
      <LiveGuideView 
        monument={arMonument} 
        onClose={() => setArMonument(null)} 
        onShowToast={showToast}
      />
    );
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
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900/95 backdrop-blur-md text-white border border-zinc-700 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up text-xs font-semibold max-w-sm">
          <span className="material-symbols-outlined text-secondary text-lg">
            {toast.icon || 'info'}
          </span>
          <span className="flex-grow">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-0.5 hover:bg-zinc-800 rounded-full text-zinc-400">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

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
            isBookmarked={savedMonuments.some(s => s.id === selectedMonument.id)}
            onToggleBookmark={handleToggleBookmark}
            isInDayPlan={dayPlan.some(p => p.id === selectedMonument.id)}
            onShowToast={showToast}
          />
        ) : (
          /* Render Active Dashboard Tabs */
          <>
            {activeTab === 'explore' && (
              <ExploreView 
                onSelectMonument={(m) => setSelectedMonument(m)} 
                onAddToDayPlan={handleAddToDayPlan}
                onOpenLiveGuide={(m) => setArMonument(m)}
                onOpenStory={(m) => setStoryMonument(m)}
                onOpenAudioGuide={(m) => setAudioMonument(m)}
                userLocation={currentCoords}
                isSimulated={isSimulated}
                setSimulatedCoords={setSimulatedCoords}
                savedMonuments={savedMonuments}
                onToggleBookmark={handleToggleBookmark}
                dayPlan={dayPlan}
                onShowToast={showToast}
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
                onImportItinerary={handleImportItinerary}
                onShowToast={showToast}
              />
            )}
            
            {activeTab === 'profile' && (
              <ProfileView 
                userProfile={userProfile} 
                onUpdateProfile={setUserProfile} 
                onResetOnboarding={handleResetOnboarding}
                onShowToast={showToast}
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
        onOpenAR={() => {
          const nearest = currentCoords ? MONUMENTS.reduce((prev, curr) => {
            const distPrev = getDistanceInMeters(currentCoords.lat, currentCoords.lng, prev.coords.lat, prev.coords.lng);
            const distCurr = getDistanceInMeters(currentCoords.lat, currentCoords.lng, curr.coords.lat, curr.coords.lng);
            return distCurr < distPrev ? curr : prev;
          }) : null;
          setArMonument(selectedMonument || nearest || MONUMENTS[0]);
        }} 
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
