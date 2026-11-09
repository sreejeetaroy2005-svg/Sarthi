import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LocationAccessView from './views/LocationAccessView';
import LanguageOnboardingView from './views/LanguageOnboardingView';
import DestinationView from './views/DestinationView';
import TripDaysView from './views/TripDaysView';
import PlanningModeView from './views/PlanningModeView';
import GroupDetailsView from './views/GroupDetailsView';
import PlaceSelectionView from './views/PlaceSelectionView';
import ResumeTripView from './views/ResumeTripView';
import LandmarkDetailView from './views/LandmarkDetailView';
import LandmarkStoryView from './views/LandmarkStoryView';
import AudioPlayerModal from './components/AudioPlayerModal';
import RoutePlanView from './views/RoutePlanView';
import LiveGuideView from './views/LiveGuideView';
import ProfileView from './views/ProfileView';
import ItineraryView from './views/ItineraryView';
import QuickProfileView from './views/QuickProfileView';
import TripOverviewView from './views/TripOverviewView';
import GuidePassesView from './views/GuidePassesView';
import GettingThereView from './views/GettingThereView';
import ArrivalBriefingView from './views/ArrivalBriefingView';
import PhotoCheckInView from './views/PhotoCheckInView';
import GuidedWalkView from './views/GuidedWalkView';
import WhatNextView from './views/WhatNextView';
import TripSummaryView from './views/TripSummaryView';
import TripStoryView from './views/TripStoryView';
import HomeView from './views/HomeView';
import MyTripView from './views/MyTripView';
import PastTripsView from './views/PastTripsView';
import HomeBottomBar from './components/Navigation/HomeBottomBar';
import TripProgressHeader from './components/TripProgressHeader';
import { MONUMENTS, DEFAULT_USER_PROFILE } from './data/monuments';
import useGeolocation from './hooks/useGeolocation';
import { planTrip, normalizeSetup, DEFAULT_TRIP_SETUP, toISODate } from './lib/planner';
import { preselectPlaceIds } from './lib/placePicker';
import { canAccessGuideFeature, grantDemoEntitlement, readEntitlements, saveEntitlements } from './lib/entitlements';
import { calculateNextStep, calculateReturnTrip } from './lib/nextStep';
import { writeTripStory } from './lib/aiClient';
import { canTransition } from './lib/screenMachine';
import { cancelGnaniRequests } from './lib/gnaniClient';
import { announceLanguageChange, useT } from './i18n';
const TRIP_STARTED_KEY = 'sarthi_trip_started';
const LANGUAGE_CHOSEN_KEY = 'sarthi_language_chosen';
function readSavedItinerary() {
  try {
    const saved = localStorage.getItem('sarthi_itinerary');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
function readSavedTripSetup() {
  const base = normalizeSetup(DEFAULT_TRIP_SETUP);
  try {
    const saved = localStorage.getItem('sarthi_trip_setup');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...normalizeSetup(parsed),
        destination: parsed.destination || null,
        mode: parsed.mode || null,
        group: parsed.group || null,
        placeIds: Array.isArray(parsed.placeIds) ? parsed.placeIds : []
      };
    }
  } catch {
    // fall through to a fresh setup
  }
  return {
    ...base,
    destination: null,
    mode: null,
    group: null,
    placeIds: []
  };
}
function readTravelProgress() {
  try {
    return JSON.parse(localStorage.getItem('sarthi_travel_progress') || '{}');
  } catch {
    return {};
  }
}
function getTripClock(demoClockTime, offsetMinutes = 0) {
  const now = new Date();
  if (/^\d{2}:\d{2}$/.test(String(demoClockTime || ''))) {
    const [hours, minutes] = demoClockTime.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
  }
  now.setMinutes(now.getMinutes() + (Number(offsetMinutes) || 0));
  return now;
}
async function compressMemoryPhoto(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    if (!blob) return null;
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * New first-run flow: Welcome -> Language -> Quick profile (name, avatar, home city) -> Home
 * Returning users go directly to Home. Profile is reachable from everywhere.
 */
function readInitialStep() {
  const travel = readTravelProgress();
  // If trip is completed, go home
  if (localStorage.getItem('sarthi_trip_status') === 'completed') return 'home';
  // If trip is active, respect the travel flow
  if (localStorage.getItem('sarthi_trip_status') === 'active' && travel.placeId && ['getting_there', 'arrival_briefing', 'photo_checkin', 'guided_walk', 'travel_access', 'what_next', 'confirm_end_trip', 'trip_summary', 'trip_story'].includes(travel.step || '')) {
    return travel.step || 'getting_there';
  }
  // If trip was started but not completed, resume from saved step or home
  if (localStorage.getItem(TRIP_STARTED_KEY) === 'true') {
    // Check if there's a saved plan to resume
    const savedStep = localStorage.getItem('sarthi_planning_step');
    const savedItinerary = readSavedItinerary();
    if (savedItinerary?.totals?.stops > 0) {
      return savedStep === 'passes' ? 'passes' : 'resume';
    }
    return 'home';
  }
  // New first-run: check if language is chosen, then quick profile, then home
  if (!localStorage.getItem(LANGUAGE_CHOSEN_KEY)) return 'language';
  // Language chosen - check if quick profile is needed
  const hasProfile = localStorage.getItem('sarthi_quick_profile') === 'true';
  if (!hasProfile) return 'quick-profile';
  // Quick profile done - go to home
  return 'home';
}

export default function App() {
  // Planning flow (strict order):
  // language -> destination -> days -> mode -> group -> places -> itinerary -> overview -> passes -> travel day
  const [currentScreen, setCurrentScreen] = useState(() => ({
    id: readInitialStep(),
    data: {}
  }));
  const step = currentScreen.id;
  // Initialize quick profile if needed
  useEffect(() => {
    const hasProfile = localStorage.getItem('sarthi_quick_profile') === 'true';
    if (!hasProfile) {
      // Set default quick profile data
      const defaultProfile = {
        name: 'Traveler',
        avatar: '🧘',
        homeCity: 'Delhi'
      };
      localStorage.setItem('sarthi_user_profile', JSON.stringify(defaultProfile));
      localStorage.setItem('sarthi_quick_profile', 'true');
    }
  }, []);
  const t = useT();
  
  // Error state from ErrorBoundary
  const [hasError, setHasError] = useState(false);
  const errorReset = () => setHasError(false);

  const navigate = (target, data = {}) => {
    const from = currentScreen.id;
    // Allow quick-profile -> home transition
    if (from === 'quick-profile' && target === 'home') {
      // Allow it
    } else if (!canTransition(from, target)) {
      console.error(`[nav] blocked ${from} -> ${target}`);
      return false;
    }
    console.log(`[nav] ${from} -> ${target}`);
    setCurrentScreen({
      id: target,
      data
    });
    return true;
  };
  const setStep = target => navigate(target);
  const selectedMonument = step === 'place_detail' ? MONUMENTS.find(place => place.id === currentScreen.data.placeId) || null : null;
  const audioMonument = step === 'audio_guide' ? MONUMENTS.find(place => place.id === currentScreen.data.placeId) || null : null;
  const storyMonument = step === 'landmark_story' ? MONUMENTS.find(place => place.id === currentScreen.data.placeId) || null : null;
  const arMonument = step === 'live_guide' ? MONUMENTS.find(place => place.id === currentScreen.data.placeId) || null : null;
  const routeConfig = step === 'route_plan' ? currentScreen.data : null;
  const setAudioMonument = place => place ? navigate('audio_guide', {
    placeId: place.id,
    returnTo: step
  }) : navigate(currentScreen.data.returnTo || 'home');
  const setStoryMonument = place => place ? navigate('landmark_story', {
    placeId: place.id
  }) : navigate('home');
  const setArMonument = place => place ? navigate('live_guide', {
    placeId: place.id
  }) : navigate('home');

  // App-wide Toast notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, icon = 'info') => {
    setToast({
      message,
      icon
    });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 3000);
  };

  // App Core state (Persistent via LocalStorage)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('sarthi_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old language strings to new codes
      if (parsed.language === 'English') parsed.language = 'en';
      if (parsed.language === 'Hindi') parsed.language = 'hi';
      return parsed;
    }
    return {
      ...DEFAULT_USER_PROFILE,
      language: 'en'
    };
  });
  const userLanguage = userProfile?.language || 'en';

  // Hands-free setting (auto-narrate on proximity)
  const [handsFreeSetting, setHandsFreeSetting] = useState(() => {
    const saved = localStorage.getItem('sarthi_hands_free');
    return saved !== null ? JSON.parse(saved) : false;
  });
  useEffect(() => {
    localStorage.setItem('sarthi_hands_free', JSON.stringify(handsFreeSetting));
  }, [handsFreeSetting]);
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
    enabled: localStorage.getItem('sarthi_trip_status') === 'active' && ['getting_there', 'guided_walk', 'what_next', 'trip_summary'].includes(step),
    initialLocation: userLocation,
    onPermissionDenied: () => {
      showToast(t('toast.locationDenied'), 'location_off');
    }
  });
  const [dayPlan, setDayPlan] = useState(() => {
    const saved = localStorage.getItem('sarthi_day_plan');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [savedMonuments, setSavedMonuments] = useState(() => {
    const saved = localStorage.getItem('sarthi_saved_monuments');
    if (saved) return JSON.parse(saved);
    return [MONUMENTS[1], MONUMENTS[2]];
  });

  // Smart itinerary (rules-based plan) and the settings behind it.
  // The wizard stores its answers on the same object: destination, mode,
  // group and placeIds are ignored by the planner but persist across reloads.
  const [tripSetup, setTripSetup] = useState(readSavedTripSetup);
  const [itinerary, setItinerary] = useState(readSavedItinerary);
  const [entitlements, setEntitlements] = useState(readEntitlements);
  const [travel, setTravel] = useState(readTravelProgress);
  const [clockPulse, setClockPulse] = useState(0);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState('');
  useEffect(() => {
    localStorage.setItem('sarthi_planning_step', step);
    localStorage.setItem('sarthi_current_screen', step);
  }, [step]);
  useEffect(() => {
    localStorage.setItem('sarthi_travel_progress', JSON.stringify({
      ...travel,
      step
    }));
  }, [travel, step]);
  useEffect(() => {
    if (!['what_next', 'trip_summary'].includes(step)) return undefined;
    const timer = window.setInterval(() => setClockPulse(value => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [step]);
  useEffect(() => {
    if (step !== 'getting_there' || !travel.origin?.useLiveLocation || !currentCoords) return;
    setTravel(current => {
      if (!current.origin?.useLiveLocation || current.origin.lat === currentCoords.lat && current.origin.lng === currentCoords.lng) return current;
      return {
        ...current,
        origin: {
          ...current.origin,
          lat: currentCoords.lat,
          lng: currentCoords.lng
        }
      };
    });
  }, [step, currentCoords, travel.origin?.useLiveLocation]);
  const destinationPlaces = MONUMENTS.filter(place => !tripSetup.destination || tripSetup.destination.cities?.includes(place.city));

  // Proximity does not open narration. The user must explicitly choose Listen.

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
    localStorage.setItem('sarthi_trip_setup', JSON.stringify(tripSetup));
  }, [tripSetup]);
  useEffect(() => {
    if (itinerary) {
      localStorage.setItem('sarthi_itinerary', JSON.stringify(itinerary));
    } else {
      localStorage.removeItem('sarthi_itinerary');
    }
  }, [itinerary]);
  useEffect(() => {
    saveEntitlements(entitlements);
  }, [entitlements]);
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('sarthi_user_location', JSON.stringify(userLocation));
    } else {
      localStorage.removeItem('sarthi_user_location');
    }
  }, [userLocation]);

  // ─── Planning wizard (planning must come before Explore) ──────────
  const handleSelectLanguage = langCode => {
    const nextProfile = {
      ...userProfile,
      language: langCode
    };
    setUserProfile(nextProfile);
    // The destination screen mounts immediately, so persist before the i18n
    // event lets its hook read the selected language for the first render.
    localStorage.setItem('sarthi_user_profile', JSON.stringify(nextProfile));
    announceLanguageChange(langCode);
    localStorage.setItem(LANGUAGE_CHOSEN_KEY, 'true');
    setStep('destination');
  };
  const handleSelectDestination = destination => {
    // Only records the destination — it never opens a monument or Explore.
    setTripSetup(prev => ({
      ...prev,
      destination,
      placeIds: []
    }));
    setStep('days');
  };
  const handleConfirmDays = ({
    days,
    startDate,
    startTime
  }) => {
    setTripSetup(prev => ({
      ...prev,
      days,
      startDate: startDate || toISODate(new Date()),
      startTime: startTime || prev.startTime || '09:00'
    }));
    setStep('mode');
  };
  const handleSelectMode = mode => {
    setTripSetup(prev => ({
      ...prev,
      mode
    }));
    setStep('group');
  };
  const handleGroupContinue = group => {
    const seniors = group.tripType === 'senior' || group.counts.seniors > 0;
    const kids = group.counts.children > 0;
    const limitedWalking = group.needs.includes('limited_walking') || group.needs.includes('step_free');
    const nextSetup = {
      ...tripSetup,
      group,
      pace: group.pace,
      seniors,
      kids,
      limitedWalking
    };

    // Auto mode pre-selects from the group details; manual mode starts empty.
    const placeIds = tripSetup.mode === 'auto' ? preselectPlaceIds(destinationPlaces, nextSetup) : [];
    setTripSetup({
      ...nextSetup,
      placeIds
    });
    setStep('places');
  };
  const handleConfirmPlaces = ids => {
    const places = destinationPlaces.filter(place => ids.includes(place.id));
    if (!places.length) {
      showToast(t('toast.noPlaces'), 'info');
      return;
    }
    const nextSetup = {
      ...tripSetup,
      placeIds: ids
    };
    setTripSetup(nextSetup);
    setDayPlan(places);
    try {
      console.log('[handleConfirmPlaces] Calling planTrip with', places.length, 'places');
      console.log('[handleConfirmPlaces] tripSetup:', JSON.stringify(tripSetup));
      const next = planTrip(places, nextSetup);
      console.log('[handleConfirmPlaces] planTrip result:', next);
      setItinerary(next);
      setStep('itinerary');
      if (next && next.totals && next.totals.stops > 0) {
        showToast(t('toast.planReady', {
          stops: next.totals.stops,
          days: next.days.length
        }), 'route');
      } else {
        showToast(t('toast.noSchedule'), 'route');
      }
    } catch (error) {
      console.error('[handleConfirmPlaces] planTrip error:', error);
      showToast(t('toast.planError'), 'error');
      setStep('home');
    }
  };
  const enterHome = () => {
    cancelGnaniRequests();
    setToast(null);
    window.speechSynthesis?.cancel();
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    localStorage.setItem(TRIP_STARTED_KEY, 'true');
    navigate('home');
  };
  const handleConfirmStartLocation = location => {
    setUserLocation(location);
    if (location.isSandbox || location.isSimulated) {
      setSimulatedCoords({
        lat: location.lat,
        lng: location.lng
      });
    }
    navigate('home');
    showToast(t(location.isSandbox ? 'toast.demoWelcome' : 'toast.locationWelcome'), location.isSandbox ? 'explore' : 'my_location');
  };
  const startNewTrip = () => {
    ['sarthi_itinerary', 'sarthi_day_plan', 'sarthi_trip_setup', TRIP_STARTED_KEY, 'sarthi_travel_progress'].forEach(key => localStorage.removeItem(key));
    setTravel({});
    localStorage.removeItem('sarthi_trip_status');
    localStorage.removeItem('sarthi_current_screen');
    setItinerary(null);
    setDayPlan([]);
    setTripSetup({
      ...normalizeSetup(DEFAULT_TRIP_SETUP),
      destination: null,
      mode: null,
      group: null,
      placeIds: []
    });
    setStep(localStorage.getItem(LANGUAGE_CHOSEN_KEY) ? 'destination' : 'language');
    showToast(t('toast.newTrip'), 'edit_calendar');
  };
  const handleQuickProfileContinue = () => {
    // Mark quick profile as done
    localStorage.setItem('sarthi_quick_profile', 'true');
    // Save the profile and go to home
    setStep('home');
    showToast(t('toast.quickProfileDone'), 'check');
  };
  const handleResumeTrip = () => {
    setStep('passes');
  };
  const handleDemoUnlock = offer => {
    const next = grantDemoEntitlement(entitlements, offer);
    setEntitlements(next);
  };
  const passPlaces = [...new Set((itinerary?.days || []).flatMap(day => day.stops.map(stop => stop.id)))].map(id => MONUMENTS.find(place => place.id === id)).filter(Boolean);
  const firstDayPassPlaces = (itinerary?.days?.[0]?.stops || []).map(stop => MONUMENTS.find(place => place.id === stop.id)).filter(Boolean);
  const tripNow = getTripClock(userProfile?.demoClockTime, travel.clockOffsetMinutes);
  const travelPlace = MONUMENTS.find(place => place.id === travel.placeId) || null;
  const allTripPlaces = [...new Set((itinerary?.days || []).flatMap(day => day.stops.map(stop => stop.id)))].map(id => MONUMENTS.find(place => place.id === id)).filter(Boolean);
  const completedPlaces = (travel.completedPlaces || []).map(entry => ({
    ...entry,
    title: entry.title || MONUMENTS.find(place => place.id === entry.id)?.title || entry.id
  }));
  const completedPlaceIds = new Set(completedPlaces.map(place => place.id));
  const skippedPlaceIds = new Set(travel.skippedPlaceIds || []);
  const remainingTripPlaces = allTripPlaces.filter(place => !completedPlaceIds.has(place.id) && !skippedPlaceIds.has(place.id));
  const currentPlace = completedPlaces.length ? MONUMENTS.find(place => place.id === completedPlaces[completedPlaces.length - 1].id) : travelPlace;
  const groupNeeds = {
    ...(tripSetup.group || {}),
    seniors: Boolean(tripSetup.seniors),
    kids: Boolean(tripSetup.kids),
    vegetarian: Boolean(tripSetup.group?.needs?.includes('vegetarian'))
  };
  const nextStepPlan = currentPlace ? calculateNextStep({
    now: tripNow,
    location: travel.currentLocation || currentPlace.coords,
    currentPlace,
    completedStops: completedPlaces,
    remainingStops: remainingTripPlaces,
    groupNeeds,
    timeWalkedMinutes: travel.timeWalkedMinutes || 0,
    travelMode: travel.transport || 'auto',
    travelTimes: travel.travelTimes || {}
  }) : null;
  const returnLocation = travel.currentLocation || currentPlace?.coords || null;
  const returnTrip = calculateReturnTrip({
    now: tripNow,
    location: returnLocation,
    hotelOrigin: travel.hotelOrigin || null,
    travelMode: travel.transport || 'auto',
    travelTimes: travel.travelTimes || {}
  });
  const finishCurrentMonument = checkin => {
    if (!travelPlace) return;
    const plannedStop = (itinerary?.days || []).flatMap(day => day.stops).find(stop => stop.id === travelPlace.id);
    const walkedMinutes = Number(plannedStop?.inSiteWalkMinutes) || Math.max(15, (travelPlace.walkingRoute?.length || 2) * 8);
    const photoDataUrl = travel.pendingPhotoDataUrl || null;
    const completedAt = tripNow.toISOString();
    const nextCompleted = [...completedPlaces.filter(entry => entry.id !== travelPlace.id), {
      id: travelPlace.id,
      title: travelPlace.title,
      completedAt,
      checkinMethod: checkin?.method || travel.checkin?.method || 'manual',
      photoDataUrl
    }];
    const nextRemaining = allTripPlaces.filter(place => !nextCompleted.some(entry => entry.id === place.id) && !skippedPlaceIds.has(place.id));
    const bestLocation = currentCoords && !isSimulated ? {
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      name: `Near ${travelPlace.title}`
    } : {
      ...travelPlace.coords,
      name: `At ${travelPlace.title}`
    };
    setTravel(current => ({
      ...current,
      checkedIn: true,
      checkin: checkin || current.checkin || {
        placeId: travelPlace.id,
        method: 'manual'
      },
      completedPlaces: nextCompleted,
      completedStopIds: nextCompleted.map(entry => entry.id),
      timeWalkedMinutes: (Number(current.timeWalkedMinutes) || 0) + walkedMinutes,
      currentLocation: bestLocation,
      pendingPhotoDataUrl: null,
      remainingOrder: nextRemaining.map(place => place.id)
    }));
    if (nextRemaining.length) setStep('what_next');else finishTrip(nextCompleted, (Number(travel.timeWalkedMinutes) || 0) + walkedMinutes);
  };
  const finishTrip = (places = completedPlaces, walked = Number(travel.timeWalkedMinutes) || 0) => {
    cancelGnaniRequests();
    setToast(null);
    window.speechSynthesis?.cancel();
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    const completedAt = tripNow.toISOString();
    let archive = [];
    try {
      archive = JSON.parse(localStorage.getItem('sarthi_past_trips') || '[]');
    } catch {
      archive = [];
    }
    localStorage.setItem('sarthi_past_trips', JSON.stringify([{
      completedAt,
      places: places.map(place => place.title || place.id),
      timeWalkedMinutes: walked
    }, ...archive]));
    localStorage.setItem('sarthi_trip_status', 'completed');
    localStorage.setItem(TRIP_STARTED_KEY, 'false');
    setTravel(current => ({
      ...current,
      completedPlaces: places,
      completedStopIds: places.map(place => place.id),
      timeWalkedMinutes: walked,
      completedAt
    }));
    navigate('trip_summary');
  };
  const goToNextStop = (place, {
    originName,
    originLocation = null,
    offsetMinutes = 0,
    meal = null
  } = {}) => {
    if (!place) {
      setStep('trip_summary');
      return;
    }
    const from = originLocation?.coords || originLocation || travel.currentLocation || (currentCoords && !isSimulated ? currentCoords : currentPlace?.coords) || null;
    const origin = from ? {
      lat: from.lat,
      lng: from.lng,
      name: originName || `Near ${currentPlace?.title || 'your last stop'}`,
      isSandbox: false,
      isSimulated: false
    } : null;
    setTravel(current => ({
      ...current,
      placeId: place.id,
      origin,
      currentLocation: from,
      hotelOrigin: current.hotelOrigin || current.origin || userLocation || null,
      transport: current.transport || 'auto',
      departureAt: null,
      checkedIn: false,
      checkin: null,
      stopIndex: 0,
      clockOffsetMinutes: (Number(current.clockOffsetMinutes) || 0) + offsetMinutes,
      meals: meal ? [...(current.meals || []), {
        ...meal,
        at: tripNow.toISOString()
      }] : current.meals || []
    }));
    setStep('getting_there');
  };
  const skipNextStop = place => {
    setTravel(current => ({
      ...current,
      skippedPlaceIds: [...new Set([...(current.skippedPlaceIds || []), place.id])],
      remainingOrder: remainingTripPlaces.filter(entry => entry.id !== place.id).map(entry => entry.id)
    }));
    setToast({
      message: t('toast.skipped', { place: place.title }),
      icon: 'undo',
      action: () => {
        setTravel(current => ({
          ...current,
          skippedPlaceIds: (current.skippedPlaceIds || []).filter(id => id !== place.id)
        }));
        setToast(null);
      }
    });
    // Keep the trip active at What Next so the traveler can undo the final skip or confirm ending the day.
  };
  const handleWriteTripStory = async () => {
    if (storyLoading) return;
    setStoryLoading(true);
    setStoryError('');
    const photos = completedPlaces.filter(place => place.photoDataUrl).map(place => ({
      placeId: place.id,
      dataUrl: place.photoDataUrl
    }));
    try {
      const story = await writeTripStory({
        places: completedPlaces.map(({
          id
        }) => ({
          id
        })),
        photos,
        timeWalkedMinutes: travel.timeWalkedMinutes || 0,
        language: userLanguage
      });
      setTravel(current => ({
        ...current,
        story
      }));
    } catch (error) {
      const names = completedPlaces.map(place => place.title).join(', ');
      const fallback = {
        en: {
          title: 'A day among Delhi’s stories',
          summary: `You discovered ${names}, saved your check-in memories, and walked about ${travel.timeWalkedMinutes || 0} minutes. The day’s places and photos are now part of your Sarthi Trip Memory.`
        },
        hi: {
          title: 'दिल्ली की कहानियों के बीच एक दिन',
          summary: `आज आपने ${names} की सैर की। आपकी जगहें और तस्वीरें इस यात्रा को खास बनाती हैं।`
        },
        ta: {
          title: 'டெல்லிக் கதைகளுடன் ஒரு நாள்',
          summary: `இன்று நீங்கள் ${names} இடங்களைப் பார்த்தீர்கள். உங்கள் இடங்களும் புகைப்படங்களும் இந்தப் பயண நினைவாக இருக்கும்.`
        },
        bn: {
          title: 'দিল্লির গল্পে ভরা একটি দিন',
          summary: `আজ আপনি ${names} ঘুরে দেখেছেন। আপনার স্থান ও ছবিগুলি এই যাত্রার স্মৃতি হয়ে থাকবে।`
        }
      }[userLanguage] || {
        title: 'A day among Delhi’s stories',
        summary: `You discovered ${names} and saved the day in your Sarthi Trip Memory.`
      };
      setTravel(current => ({
        ...current,
        story: {
          ...fallback,
          fallback: true,
          source: 'fallback'
        }
      }));
      setStoryError(t('toast.storyFallback'));
    } finally {
      setStoryLoading(false);
    }
  };
  const handleAddToDayPlan = monument => {
    if (dayPlan.some(place => place.id === monument.id)) {
      showToast(t('toast.alreadyAdded', {
        place: monument.title
      }), 'info');
      return;
    }
    setDayPlan(current => [...current, monument]);
    showToast(t('toast.added', {
      place: monument.title
    }), 'add_task');
  };
  const handleToggleBookmark = monument => {
    if (savedMonuments.some(p => p.id === monument.id)) {
      setSavedMonuments(prev => prev.filter(p => p.id !== monument.id));
    } else {
      setSavedMonuments(prev => [...prev, monument]);
    }
  };
  const handleRemoveBookmark = id => {
    setSavedMonuments(prev => prev.filter(p => p.id !== id));
  };
  const handleResetOnboarding = () => {
    localStorage.removeItem('sarthi_day_plan');
    localStorage.removeItem('sarthi_saved_monuments');
    localStorage.removeItem('sarthi_user_profile');
    localStorage.removeItem('sarthi_user_location');
    localStorage.removeItem('sarthi_hands_free');
    localStorage.removeItem('sarthi_itinerary');
    localStorage.removeItem('sarthi_trip_setup');
    localStorage.removeItem(TRIP_STARTED_KEY);
    localStorage.removeItem('sarthi_travel_progress');
    localStorage.removeItem(LANGUAGE_CHOSEN_KEY);
    setUserLocation(null);
    setTravel({});
    setUserProfile({
      ...DEFAULT_USER_PROFILE,
      language: 'en'
    });
    setDayPlan([]);
    setSavedMonuments([MONUMENTS[1], MONUMENTS[2]]);
    setItinerary(null);
    setTripSetup({
      ...normalizeSetup(DEFAULT_TRIP_SETUP),
      destination: null,
      mode: null,
      group: null,
      placeIds: []
    });
    localStorage.removeItem('sarthi_trip_status');
    setStep('language');
    showToast(t('toast.reset'), 'restart_alt');
  };
  const handleUpdateTripSetup = patch => {
    const nextSetup = {
      ...tripSetup,
      ...patch
    };
    setTripSetup(nextSetup);

    // Rebuild from the current selection so pace/accessibility changes apply.
    const sources = dayPlan.length ? dayPlan : (itinerary?.days || []).flatMap(day => day.stops);
    if (itinerary && sources.length) {
      setItinerary(planTrip(sources, nextSetup));
    }
  };
  const handleStartTrip = () => {
    const firstStop = (itinerary?.days || []).find(day => day.stops.length)?.stops[0];
    const place = MONUMENTS.find(candidate => candidate.id === firstStop?.id);
    if (!place) {
      showToast(t('toast.noFirstStop'), 'info');
      return;
    }
    localStorage.removeItem(TRIP_STARTED_KEY);
    localStorage.setItem('sarthi_trip_status', 'active');
    setTravel(current => ({
      ...current,
      placeId: place.id,
      origin: current.origin || userLocation || null,
      hotelOrigin: current.hotelOrigin || current.origin || userLocation || null,
      transport: current.transport || 'auto',
      departureAt: null,
      checkedIn: false,
      stopIndex: 0,
      completedPlaces: [],
      completedStopIds: [],
      skippedPlaceIds: [],
      remainingOrder: [],
      timeWalkedMinutes: 0,
      clockOffsetMinutes: 0,
      meals: [],
      story: null
    }));
    setStep('getting_there');
    showToast(t('toast.gettingFirst', {
      place: place.title
    }), 'route');
  };
  const setTravelStep = nextStep => {
    setTravel(current => ({
      ...current,
      step: nextStep
    }));
    setStep(nextStep);
  };
  const travelCandidates = passPlaces;
  const requestTravelFeature = (feature, nextStep) => {
    if (canAccessGuideFeature(entitlements, travel.placeId, feature)) {
      setTravelStep(nextStep);
      return;
    }
    setTravel(current => ({
      ...current,
      pendingFeature: feature,
      pendingStep: nextStep
    }));
    setStep('travel_access');
  };
  const openTripStory = () => {
    setStep('trip_story');
    if (!travel.story) handleWriteTripStory();
  };
  const activeTrip = localStorage.getItem('sarthi_trip_status') === 'active';
  const continueActiveTrip = () => setStep(travel.checkedIn ? 'guided_walk' : travel.departureAt ? 'arrival_briefing' : 'getting_there');
  const pastTrips = (() => {
    try {
      return JSON.parse(localStorage.getItem('sarthi_past_trips') || '[]');
    } catch {
      return [];
    }
  })();
  const toastBanner = toast && <div role="status" className="fixed top-4 left-1/2 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl"><span className="flex-1">{toast.message}</span>{toast.action && <button onClick={toast.action} className="min-h-11 px-3 text-xs font-bold text-secondary">{t('common.undo')}</button>}<button onClick={() => setToast(null)} className="min-h-11 px-2 text-zinc-300">{t('common.dismiss')}</button></div>;
  if (step === 'home') return <>{toastBanner}<HomeView language={userLanguage} onLanguageChange={language => {
      const next = {
        ...userProfile,
        language
      };
      setUserProfile(next);
      announceLanguageChange(language);
    }} activeTrip={activeTrip} onPlan={() => setStep(localStorage.getItem(LANGUAGE_CHOSEN_KEY) ? 'destination' : 'language')} onContinue={continueActiveTrip} onPastTrips={() => setStep('past_trips')} /><HomeBottomBar screen={step} onNavigate={target => setStep(target)} /></>;
  if (step === 'my_trip') return <MyTripView itinerary={itinerary} activeTrip={activeTrip} onPlan={() => setStep('destination')} onContinue={continueActiveTrip} />;
  if (step === 'past_trips') return <PastTripsView trips={pastTrips} onHome={() => setStep('home')} />;
  if (step === 'profile') return <><ProfileView userProfile={userProfile} onUpdateProfile={profile => {
      setUserProfile(profile);
      if (profile.language) announceLanguageChange(profile.language);
    }} onResetOnboarding={handleResetOnboarding} onPlanNewTrip={startNewTrip} onShowToast={showToast} handsFreeSetting={handsFreeSetting} onToggleHandsFree={() => setHandsFreeSetting(prev => !prev)} /><HomeBottomBar screen={step} onNavigate={target => setStep(target)} /></>;
  if (step === 'confirm_end_trip') return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4"><section className="w-full rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-primary">{t('end.heading')}</h1><p className="mt-2 text-sm text-on-surface-variant">{t('end.help')}</p><button onClick={() => finishTrip()} className="mt-6 min-h-12 w-full rounded-2xl bg-primary text-sm font-bold text-on-primary">{t('end.confirm')}</button><button onClick={() => setStep('what_next')} className="mt-2 min-h-12 w-full rounded-2xl border border-outline-variant/40 text-sm font-bold text-primary">{t('end.keep')}</button></section></main>;
  if (step === 'audio_guide' && audioMonument) return <AudioPlayerModal monument={audioMonument} userLanguage={userLanguage} onClose={() => setStep(currentScreen.data.returnTo || 'place_detail')} autoPlay={false} />;
  if (step === 'landmark_story' && storyMonument) return <LandmarkStoryView monument={storyMonument} onClose={() => setStep('place_detail')} onOpenAudioGuide={place => setAudioMonument(place)} />;
  if (step === 'live_guide' && arMonument) return <LiveGuideView monument={arMonument} userLanguage={userLanguage} onClose={() => setStep('place_detail')} onShowToast={showToast} />;
  if (step === 'route_plan' && routeConfig) return <RoutePlanView origin={routeConfig.origin} destination={routeConfig.destination} onClose={() => setStep('my_trip')} />;
  if (step === 'place_detail' && selectedMonument) return <LandmarkDetailView monument={selectedMonument} onBack={() => setStep('home')} onOpenAudioGuide={place => setAudioMonument(place)} onOpenLiveGuide={place => setArMonument(place)} onAddToDayPlan={handleAddToDayPlan} onOpenStory={place => setStoryMonument(place)} isBookmarked={savedMonuments.some(saved => saved.id === selectedMonument.id)} onToggleBookmark={handleToggleBookmark} isInDayPlan={dayPlan.some(place => place.id === selectedMonument.id)} onShowToast={showToast} />;
  if (step === 'getting_there' && travelPlace) {
    return <>
      <TripProgressHeader place={travelPlace} screen={step} completed={completedPlaces.length} total={allTripPlaces.length} />
      <GettingThereView destination={travelPlace} origin={travel.origin} isSimulated={Boolean(travel.origin?.isSimulated || travel.origin?.isSandbox)} transport={travel.transport || 'auto'} departureAt={travel.departureAt} demoClockTime={userProfile?.demoClockTime} clockOffsetMinutes={travel.clockOffsetMinutes || 0} onOriginLabelChange={name => setTravel(current => ({
        ...current,
        originLabel: name
      }))} onTransportChange={transport => setTravel(current => ({
        ...current,
        transport
      }))} onDeparture={departureAt => setTravel(current => {
        const origin = current.origin ? {
          ...current.origin,
          name: current.originLabel || current.origin.name
        } : current.origin;
        return {
          ...current,
          departureAt,
          origin,
          hotelOrigin: current.hotelOrigin || origin
        };
      })} onSetOrigin={origin => setTravel(current => ({
        ...current,
        origin
      }))} onUseDemoOrigin={() => setTravel(current => ({
        ...current,
        origin: {
          lat: 28.6139,
          lng: 77.2090,
          name: current.originLabel || 'Connaught Place, Delhi (demo)',
          isSandbox: true,
          isSimulated: true
        }
      }))} onArrived={() => requestTravelFeature('arrivalBriefing', 'arrival_briefing')} />
      </>;
  }
  if (step === 'arrival_briefing' && travelPlace) {
    return <><TripProgressHeader place={travelPlace} screen={step} completed={completedPlaces.length} total={allTripPlaces.length} /><ArrivalBriefingView monument={travelPlace} language={userLanguage} onGotIt={() => requestTravelFeature('photoCheckIn', 'photo_checkin')} /></>;
  }
  if (step === 'photo_checkin' && travelPlace) {
    return <>
      <TripProgressHeader place={travelPlace} screen={step} completed={completedPlaces.length} total={allTripPlaces.length} />
      <PhotoCheckInView monument={travelPlace} language={userLanguage} itineraryCandidates={travelCandidates} onPhotoCaptured={async file => {
        setTravel(current => ({
          ...current,
          pendingPhotoDataUrl: null
        }));
        const photoDataUrl = await compressMemoryPhoto(file);
        if (photoDataUrl) setTravel(current => ({
          ...current,
          pendingPhotoDataUrl: photoDataUrl
        }));
      }} onPhotoCleared={() => setTravel(current => ({
        ...current,
        pendingPhotoDataUrl: null
      }))} onCheckedIn={checkin => {
        if (checkin.placeId !== travel.placeId) {
          const recognizedPlace = MONUMENTS.find(place => place.id === checkin.placeId);
          showToast(t('app.photoWrongPlace', {
            recognized: recognizedPlace?.title || t('app.anotherPlace'),
            place: travelPlace.title
          }), 'photo_camera');
          return;
        }
        setTravel(current => ({
          ...current,
          checkedIn: true,
          checkin
        }));
        requestTravelFeature('guidedWalk', 'guided_walk');
      }} onMonumentCompleted={() => finishCurrentMonument({
        placeId: travelPlace.id,
        method: 'manual'
      })} onBack={() => setTravelStep('arrival_briefing')} />
      </>;
  }
  if (step === 'guided_walk' && travelPlace) {
    return <>
      <TripProgressHeader place={travelPlace} screen={step} completed={completedPlaces.length} total={allTripPlaces.length} />
      <GuidedWalkView monument={travelPlace} language={userLanguage} initialStopIndex={travel.stopIndex || 0} onProgress={stopIndex => setTravel(current => current.stopIndex === stopIndex ? current : {
        ...current,
        stopIndex
      })} onComplete={() => finishCurrentMonument(travel.checkin)} />
      </>;
  }
  if (step === 'what_next' && currentPlace && nextStepPlan) {
    return <>
      {toastBanner}
      <TripProgressHeader place={currentPlace} screen={step} completed={completedPlaces.length} total={allTripPlaces.length} />
      <WhatNextView currentPlace={currentPlace} plan={nextStepPlan} onEat={restaurant => {
        const next = nextStepPlan.nextStop?.place;
        if (next && nextStepPlan.nextStop.feasible) goToNextStop(next, {
          originLocation: restaurant.coords,
          originName: `Near ${restaurant.name}`,
          meal: {
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            distance: restaurant.distance,
            coords: restaurant.coords,
            approx: restaurant.approx
          }
        });else {
          setTravel(current => ({
            ...current,
            meals: [...(current.meals || []), {
              name: restaurant.name,
              cuisine: restaurant.cuisine,
              distance: restaurant.distance,
              at: tripNow.toISOString()
            }]
          }));
          setStep('confirm_end_trip');
        }
      }} onContinue={place => goToNextStop(place)} onRest={(minutes, canContinue) => {
        const next = nextStepPlan.nextStop?.place;
        if (next && canContinue) goToNextStop(next, {
          offsetMinutes: minutes,
          originName: `Near ${currentPlace.title} after a ${minutes}-minute rest`
        });else setStep('confirm_end_trip');
      }} onSkip={skipNextStop} onEndDay={() => setStep('confirm_end_trip')} />
      </>;
  }
  if (step === 'trip_summary') {
    return <TripSummaryView completedPlaces={completedPlaces} timeWalkedMinutes={travel.timeWalkedMinutes || 0} returnTrip={returnTrip} hotelOrigin={travel.hotelOrigin} onCreateStory={openTripStory} onFinish={enterHome} />;
  }
  if (step === 'trip_story') {
    return <TripStoryView story={travel.story} places={completedPlaces} language={userLanguage} loading={storyLoading} error={storyError} onGenerate={handleWriteTripStory} onBack={() => setStep('trip_summary')} onFinish={enterHome} />;
  }
  if (step === 'travel_access' && travelPlace) {
    return <div className="min-h-screen bg-background p-5 flex items-center justify-center">
        <section className="max-w-md w-full rounded-3xl bg-white border border-outline-variant/30 p-6 text-center space-y-3 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-secondary">auto_awesome</span>
          <h1 className="font-display text-2xl font-bold text-primary">{t('app.unlockHeading')}</h1>
          <p className="text-sm text-on-surface-variant">{t('app.unlockHelp', {
            place: travelPlace.title
          })}</p>
          <button onClick={() => {
          handleDemoUnlock({
            offerId: `place:${travelPlace.id}`,
            placeIds: [travelPlace.id],
            peopleLimit: 1
          });
          setTravelStep(travel.pendingStep || 'arrival_briefing');
        }} className="w-full min-h-12 rounded-2xl bg-primary text-on-primary text-sm font-bold">{t("text|Demo unlock · continue")}</button>
          <button onClick={() => setTravelStep(travel.pendingFeature === 'arrivalBriefing' ? 'getting_there' : 'arrival_briefing')} className="text-xs font-bold text-primary">{t('app.goBack')}</button>
        </section>
      </div>;
  }

  // ─── Planning flow screens (one screen per step, each with Back) ────
  if (step === 'language') {
    return <LanguageOnboardingView onSelectLanguage={handleSelectLanguage} />;
  }
  if (step === 'quick-profile') {
    return <QuickProfileView onContinue={handleQuickProfileContinue} />;
  }
  if (step === 'resume') {
    return <ResumeTripView itinerary={itinerary} tripSetup={tripSetup} onResume={handleResumeTrip} onPlanNewTrip={startNewTrip} />;
  }
  if (step === 'destination') {
    return <DestinationView monuments={MONUMENTS} selectedId={tripSetup.destination?.id} onSelect={handleSelectDestination} onBack={() => setStep('language')} />;
  }
  if (step === 'days') {
    return <TripDaysView days={tripSetup.days} startDate={tripSetup.startDate} startTime={tripSetup.startTime} onContinue={handleConfirmDays} onBack={() => setStep('destination')} />;
  }
  if (step === 'mode') {
    return <PlanningModeView mode={tripSetup.mode} onContinue={handleSelectMode} onBack={() => setStep('days')} />;
  }
  if (step === 'group') {
    return <GroupDetailsView group={tripSetup.group} onContinue={handleGroupContinue} onBack={() => setStep('mode')} />;
  }
  if (step === 'places') {
    return <PlaceSelectionView places={destinationPlaces} initialSelected={tripSetup.placeIds || []} mode={tripSetup.mode} destinationName={tripSetup.destination?.name} onContinue={handleConfirmPlaces} onBack={() => setStep('group')} />;
  }
  if (step === 'itinerary') {
    return <ItineraryView itinerary={itinerary} onUpdateSetup={handleUpdateTripSetup} onChange={setItinerary} onSelectMonument={place => navigate('place_detail', {
      placeId: place.id
    })} onBack={() => setStep('places')} onOpenOverview={() => setStep('overview')} onShowToast={showToast} showProgress />;
  }
  if (step === 'overview') {
    return <TripOverviewView itinerary={itinerary} onBack={() => setStep('itinerary')} onEdit={() => setStep('itinerary')} onContinue={() => setStep('passes')} onSelectMonument={place => navigate('place_detail', {
      placeId: place.id
    })} showProgress />;
  }
  if (step === 'passes') {
    return <GuidePassesView places={passPlaces} dayPlaces={firstDayPassPlaces} entitlements={entitlements} onDemoUnlock={handleDemoUnlock} onStartTrip={handleStartTrip} onBack={() => setStep('overview')} />;
  }
  if (step === 'location') {
    return <LocationAccessView onNext={handleConfirmStartLocation} onBack={() => setStep('passes')} />;
  }
  // If there's an error from ErrorBoundary, show friendly error screen
  if (hasError) return <ErrorBoundary onReset={errorReset} />;
  
  return <><HomeView language={userLanguage} onLanguageChange={language => {
      const next = {
        ...userProfile,
        language
      };
      setUserProfile(next);
      announceLanguageChange(language);
    }} activeTrip={activeTrip} onPlan={() => setStep('destination')} onContinue={continueActiveTrip} onPastTrips={() => setStep('past_trips')} /><HomeBottomBar screen="home" onNavigate={target => setStep(target)} /></>;
}
