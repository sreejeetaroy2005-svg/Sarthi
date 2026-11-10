import React, { useState, useEffect, useRef } from 'react';
import LocationAccessView from './views/LocationAccessView';
import LanguageOnboardingView from './views/LanguageOnboardingView';
import DestinationView from './views/DestinationView';
import TripDaysView from './views/TripDaysView';
import PlanningModeView from './views/PlanningModeView';
import GroupDetailsView from './views/GroupDetailsView';
import PlaceSelectionView from './views/PlaceSelectionView';
import ResumeTripView from './views/ResumeTripView';
import ExploreView from './views/ExploreView';
import LandmarkDetailView from './views/LandmarkDetailView';
import LandmarkStoryView from './views/LandmarkStoryView';
import AudioPlayerModal from './components/AudioPlayerModal';
import DayPlanView from './views/DayPlanView';
import RoutePlanView from './views/RoutePlanView';
import LiveGuideView from './views/LiveGuideView';
import SavedTripsView from './views/SavedTripsView';
import ProfileView from './views/ProfileView';
import ItineraryView from './views/ItineraryView';
import TripOverviewView from './views/TripOverviewView';
import GuidePassesView from './views/GuidePassesView';
import GettingThereView from './views/GettingThereView';
import ArrivalBriefingView from './views/ArrivalBriefingView';
import PhotoCheckInView from './views/PhotoCheckInView';
import GuidedWalkView from './views/GuidedWalkView';
import WhatNextView from './views/WhatNextView';
import TripSummaryView from './views/TripSummaryView';
import TripStoryView from './views/TripStoryView';

import Header from './components/Navigation/Header';
import BottomNav from './components/Navigation/BottomNav';
import { MONUMENTS, DEFAULT_USER_PROFILE } from './data/monuments';
import useGeolocation from './hooks/useGeolocation';
import { getDistanceInMeters } from './utils/distance';
import { planTrip, normalizeSetup, DEFAULT_TRIP_SETUP, toISODate } from './lib/planner';
import { preselectPlaceIds } from './lib/placePicker';
import { canAccessGuideFeature, grantDemoEntitlement, readEntitlements, saveEntitlements } from './lib/entitlements';
import { calculateNextStep, calculateReturnTrip } from './lib/nextStep';
import { writeTripStory } from './lib/aiClient';

const TRIP_STARTED_KEY = 'sarthi_trip_started';
const LANGUAGE_CHOSEN_KEY = 'sarthi_language_chosen';

function seedDemoMode() {
  const monument = MONUMENTS.find((place) => place.id === 'humayun-tomb');
  if (!monument) return;
  localStorage.setItem(LANGUAGE_CHOSEN_KEY, 'true');
  localStorage.removeItem(TRIP_STARTED_KEY);
  localStorage.setItem('sarthi_planning_step', 'dashboard');
  localStorage.setItem('sarthi_hands_free', 'true');
  localStorage.setItem('sarthi_user_profile', JSON.stringify({ ...DEFAULT_USER_PROFILE, language: 'en' }));
  localStorage.setItem('sarthi_user_location', JSON.stringify({ ...monument.coords, name: 'Humayun’s Tomb (simulated)', isSimulated: true }));
  localStorage.setItem('sarthi_trip_setup', JSON.stringify({
    ...normalizeSetup(DEFAULT_TRIP_SETUP),
    destination: { city: 'New Delhi', cities: ['New Delhi'] },
    days: 1,
    mode: 'manual',
    group: { tripType: 'solo', counts: { adults: 1, children: 0, seniors: 0 }, needs: [], pace: 'moderate' },
    placeIds: [monument.id],
  }));
  localStorage.setItem('sarthi_day_plan', JSON.stringify([monument]));
  localStorage.setItem('sarthi_itinerary', JSON.stringify({ days: [], totals: { stops: 0 } }));
  localStorage.setItem('sarthi_entitlements', JSON.stringify(readEntitlements()));
  localStorage.removeItem('sarthi_travel_progress');
}

function GnaniStatusBanner({ connected }) {
  if (connected !== false) return null;
  return (
    <div role="status" className="fixed top-3 left-1/2 -translate-x-1/2 z-[120] rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-800 shadow-lg">
      Gnani voice not connected
    </div>
  );
}

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
        placeIds: Array.isArray(parsed.placeIds) ? parsed.placeIds : [],
      };
    }
  } catch {
    // fall through to a fresh setup
  }
  return { ...base, destination: null, mode: null, group: null, placeIds: [] };
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
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    if (!blob) return null;
    return await new Promise((resolve) => {
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
 * Planning comes first: a finished trip that was already started opens the
 * dashboard, a saved plan offers Resume, and otherwise the wizard starts at
 * the first unanswered step.
 */
function readInitialStep() {
  if (new URLSearchParams(window.location.search).get('demo') === '1') return 'dashboard';
  const travel = readTravelProgress();
  if (travel.placeId && ['getting_there', 'arrival_briefing', 'photo_checkin', 'guided_walk', 'travel_access', 'what_next', 'trip_summary', 'trip_story'].includes(travel.step)) return travel.step;
  if (localStorage.getItem(TRIP_STARTED_KEY) === 'true') return 'dashboard';
  const savedItinerary = readSavedItinerary();
  const savedStep = localStorage.getItem('sarthi_planning_step');
  if (savedItinerary?.totals?.stops > 0) return savedStep === 'passes' ? 'passes' : 'resume';
  const resumableSteps = ['destination', 'days', 'mode', 'group', 'places'];
  if (resumableSteps.includes(savedStep)) return savedStep;
  if (!localStorage.getItem(LANGUAGE_CHOSEN_KEY)) return 'language';
  return 'destination';
}

export default function App() {
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const demoSeededRef = useRef(false);
  if (isDemoMode && !demoSeededRef.current) {
    seedDemoMode();
    demoSeededRef.current = true;
  }
  const [demoStartConfirmed, setDemoStartConfirmed] = useState(!isDemoMode);

  // Planning flow (strict order):
  // language -> destination -> days -> mode -> group -> places -> itinerary -> overview -> passes -> travel day
  const [step, setStep] = useState(readInitialStep);
  const [activeTab, setActiveTab] = useState('explore'); // explore | plan | saved | profile
  const [planScreen, setPlanScreen] = useState('day'); // day | itinerary | overview

  // Selected details / Modal overlay layers
  const [selectedMonument, setSelectedMonument] = useState(null);
  const [storyMonument, setStoryMonument] = useState(null);
  const [audioMonument, setAudioMonument] = useState(null);
  const [arMonument, setArMonument] = useState(null);
  const [routeConfig, setRouteConfig] = useState(null);

  // Hands-free flow state
  const [autoPlayNarration, setAutoPlayNarration] = useState(false);
  const [showMicPromptInGuide, setShowMicPromptInGuide] = useState(false);

  // App-wide Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, icon = 'info') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3000);
  };

  // App Core state (Persistent via LocalStorage)
  const [userProfile, setUserProfile] = useState(() => {
    if (isDemoMode) return { ...DEFAULT_USER_PROFILE, language: 'en' };
    const saved = localStorage.getItem('sarthi_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old language strings to new codes
      if (parsed.language === 'English') parsed.language = 'en';
      if (parsed.language === 'Hindi') parsed.language = 'hi';
      return parsed;
    }
    return { ...DEFAULT_USER_PROFILE, language: 'en' };
  });

  const userLanguage = userProfile?.language || 'en';

  // Hands-free setting (auto-narrate on proximity)
  const [handsFreeSetting, setHandsFreeSetting] = useState(() => {
    const saved = localStorage.getItem('sarthi_hands_free');
    return saved !== null ? JSON.parse(saved) : true; // enabled by default
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
    enabled: ['dashboard', 'getting_there', 'guided_walk', 'what_next', 'trip_summary'].includes(step),
    initialLocation: userLocation,
    onPermissionDenied: () => {
      showToast('Location permission denied — using your saved demo location.', 'location_off');
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
  const [gnaniConnected, setGnaniConnected] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/gnani/health')
      .then((response) => {
        if (!response.ok) throw new Error(`health returned ${response.status}`);
        return response.json();
      })
      .then((health) => {
        const connected = health.gnaniConfigured === true && health.mockMode !== true;
        console.info(`[Gnani] real Gnani ${connected ? 'active' : 'inactive'} (mockMode=${Boolean(health.mockMode)})`);
        if (active) setGnaniConnected(connected);
      })
      .catch((error) => {
        console.warn('[Gnani] health check failed; real Gnani is inactive:', error.message);
        if (active) setGnaniConnected(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('sarthi_planning_step', step);
  }, [step]);

  useEffect(() => {
    localStorage.setItem('sarthi_travel_progress', JSON.stringify({ ...travel, step }));
  }, [travel, step]);

  useEffect(() => {
    if (!['what_next', 'trip_summary'].includes(step)) return undefined;
    const timer = window.setInterval(() => setClockPulse((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 'getting_there' || !travel.origin?.useLiveLocation || !currentCoords) return;
    setTravel((current) => {
      if (!current.origin?.useLiveLocation ||
          (current.origin.lat === currentCoords.lat && current.origin.lng === currentCoords.lng)) return current;
      return { ...current, origin: { ...current.origin, lat: currentCoords.lat, lng: currentCoords.lng } };
    });
  }, [step, currentCoords, travel.origin?.useLiveLocation]);

  const destinationPlaces = MONUMENTS.filter((place) => (
    !tripSetup.destination || tripSetup.destination.cities?.includes(place.city)
  ));

  // Proximity auto-narration tracking
  const lastAutoNarratedRef = useRef(null);
  const PROXIMITY_THRESHOLD = 150;

  // ─── Hands-free: auto-trigger narration on proximity ──────────────
  useEffect(() => {
    if (isDemoMode && !demoStartConfirmed) return;
    if (!handsFreeSetting || !currentCoords || step !== 'dashboard' || audioMonument || arMonument) return;

    let closestMon = null;
    let minDistance = Infinity;

    MONUMENTS.forEach(m => {
      const dist = getDistanceInMeters(
        currentCoords.lat, currentCoords.lng,
        m.coords.lat, m.coords.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestMon = m;
      }
    });

    if (closestMon && minDistance <= PROXIMITY_THRESHOLD) {
      // Don't re-trigger for the same monument
      if (lastAutoNarratedRef.current !== closestMon.id) {
        lastAutoNarratedRef.current = closestMon.id;
        setAudioMonument(closestMon);
        setAutoPlayNarration(true);
        showToast(`Starting narration for ${closestMon.title}`, 'headphones');
      }
    }
  }, [currentCoords, handsFreeSetting, step, audioMonument, arMonument, isDemoMode, demoStartConfirmed]);

  // ─── Narration end handler (hands-free flow) ──────────────────────
  const handleNarrationEnd = () => {
    if (audioMonument && handsFreeSetting) {
      // Open Live Guide with mic prompt
      const mon = audioMonument;
      setAudioMonument(null);
      setAutoPlayNarration(false);
      setShowMicPromptInGuide(true);
      setArMonument(mon);
    }
  };

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
  const handleSelectLanguage = (langCode) => {
    setUserProfile(prev => ({ ...prev, language: langCode }));
    localStorage.setItem(LANGUAGE_CHOSEN_KEY, 'true');
    setStep('destination');
  };

  const handleSelectDestination = (destination) => {
    // Only records the destination — it never opens a monument or Explore.
    setTripSetup(prev => ({
      ...prev,
      destination,
      placeIds: [],
    }));
    setStep('days');
  };

  const handleConfirmDays = ({ days, startDate, startTime }) => {
    setTripSetup(prev => ({
      ...prev,
      days,
      startDate: startDate || toISODate(new Date()),
      startTime: startTime || prev.startTime || '09:00',
    }));
    setStep('mode');
  };

  const handleSelectMode = (mode) => {
    setTripSetup(prev => ({ ...prev, mode }));
    setStep('group');
  };

  const handleGroupContinue = (group) => {
    const seniors = group.tripType === 'senior' || group.counts.seniors > 0;
    const kids = group.counts.children > 0;
    const limitedWalking = group.needs.includes('limited_walking') || group.needs.includes('step_free');
    const nextSetup = {
      ...tripSetup,
      group,
      pace: group.pace,
      seniors,
      kids,
      limitedWalking,
    };

    // Auto mode pre-selects from the group details; manual mode starts empty.
    const placeIds = tripSetup.mode === 'auto'
      ? preselectPlaceIds(destinationPlaces, nextSetup)
      : [];

    setTripSetup({ ...nextSetup, placeIds });
    setStep('places');
  };

  const handleConfirmPlaces = (ids) => {
    const places = destinationPlaces.filter(place => ids.includes(place.id));
    if (!places.length) {
      showToast('Select at least one place to build an itinerary', 'info');
      return;
    }

    const nextSetup = { ...tripSetup, placeIds: ids };
    setTripSetup(nextSetup);
    setDayPlan(places);
    const next = planTrip(places, nextSetup);
    setItinerary(next);
    setStep('itinerary');
    showToast(
      next.totals.stops
        ? `Itinerary ready — ${next.totals.stops} stops over ${next.days.length} day${next.days.length > 1 ? 's' : ''}`
        : 'None of these stops fit the schedule',
      'route'
    );
  };

  const enterDashboard = () => {
    localStorage.setItem(TRIP_STARTED_KEY, 'true');
    setTravel((current) => ({ ...current, step: 'dashboard' }));
    setSelectedMonument(null);
    setPlanScreen('day');
    setActiveTab('explore');
    setStep('dashboard');
  };

  const openAudioGuide = (monument) => {
    setAutoPlayNarration(isDemoMode);
    setAudioMonument(monument);
  };

  const handleConfirmStartLocation = (location) => {
    setUserLocation(location);
    if (location.isSandbox || location.isSimulated) {
      setSimulatedCoords({ lat: location.lat, lng: location.lng });
    }
    enterDashboard();
    showToast(
      location.isSandbox ? 'Demo location set — welcome to Delhi!' : 'Location set — welcome to Delhi!',
      location.isSandbox ? 'explore' : 'my_location'
    );
  };

  const startNewTrip = () => {
    [
      'sarthi_itinerary',
      'sarthi_day_plan',
      'sarthi_trip_setup',
      TRIP_STARTED_KEY,
      'sarthi_travel_progress',
    ].forEach(key => localStorage.removeItem(key));

    setTravel({});
    setItinerary(null);
    setDayPlan([]);
    setTripSetup({
      ...normalizeSetup(DEFAULT_TRIP_SETUP),
      destination: null,
      mode: null,
      group: null,
      placeIds: [],
    });
    setPlanScreen('day');
    setStep(localStorage.getItem(LANGUAGE_CHOSEN_KEY) ? 'destination' : 'language');
    showToast('New trip started — pick a destination', 'edit_calendar');
  };

  const handleResumeTrip = () => {
    setStep('passes');
  };

  const handleDemoUnlock = (offer) => {
    const next = grantDemoEntitlement(entitlements, offer);
    setEntitlements(next);
  };

  const passPlaces = [...new Set((itinerary?.days || []).flatMap((day) => day.stops.map((stop) => stop.id)))]
    .map((id) => MONUMENTS.find((place) => place.id === id))
    .filter(Boolean);
  const firstDayPassPlaces = (itinerary?.days?.[0]?.stops || [])
    .map((stop) => MONUMENTS.find((place) => place.id === stop.id))
    .filter(Boolean);

  const tripNow = getTripClock(userProfile?.demoClockTime, travel.clockOffsetMinutes);
  const travelPlace = MONUMENTS.find((place) => place.id === travel.placeId) || null;
  const allTripPlaces = [...new Set((itinerary?.days || []).flatMap((day) => day.stops.map((stop) => stop.id)))]
    .map((id) => MONUMENTS.find((place) => place.id === id))
    .filter(Boolean);
  const completedPlaces = (travel.completedPlaces || []).map((entry) => ({
    ...entry,
    title: entry.title || MONUMENTS.find((place) => place.id === entry.id)?.title || entry.id,
  }));
  const completedPlaceIds = new Set(completedPlaces.map((place) => place.id));
  const skippedPlaceIds = new Set(travel.skippedPlaceIds || []);
  const remainingTripPlaces = allTripPlaces.filter((place) => !completedPlaceIds.has(place.id) && !skippedPlaceIds.has(place.id));
  const currentPlace = completedPlaces.length
    ? MONUMENTS.find((place) => place.id === completedPlaces[completedPlaces.length - 1].id)
    : travelPlace;
  const groupNeeds = {
    ...(tripSetup.group || {}),
    seniors: Boolean(tripSetup.seniors),
    kids: Boolean(tripSetup.kids),
    vegetarian: Boolean(tripSetup.group?.needs?.includes('vegetarian')),
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
    travelTimes: travel.travelTimes || {},
  }) : null;
  const returnLocation = travel.currentLocation || currentPlace?.coords || null;
  const returnTrip = calculateReturnTrip({
    now: tripNow,
    location: returnLocation,
    hotelOrigin: travel.hotelOrigin || null,
    travelMode: travel.transport || 'auto',
    travelTimes: travel.travelTimes || {},
  });

  const finishCurrentMonument = (checkin) => {
    if (!travelPlace) return;
    const plannedStop = (itinerary?.days || []).flatMap((day) => day.stops).find((stop) => stop.id === travelPlace.id);
    const walkedMinutes = Number(plannedStop?.inSiteWalkMinutes) || Math.max(15, (travelPlace.walkingRoute?.length || 2) * 8);
    const photoDataUrl = travel.pendingPhotoDataUrl || null;
    const completedAt = tripNow.toISOString();
    const nextCompleted = [...completedPlaces.filter((entry) => entry.id !== travelPlace.id), {
      id: travelPlace.id,
      title: travelPlace.title,
      completedAt,
      checkinMethod: checkin?.method || travel.checkin?.method || 'manual',
      photoDataUrl,
    }];
    const nextRemaining = allTripPlaces.filter((place) => !nextCompleted.some((entry) => entry.id === place.id) && !skippedPlaceIds.has(place.id));
    const bestLocation = currentCoords && !isSimulated
      ? { lat: currentCoords.lat, lng: currentCoords.lng, name: `Near ${travelPlace.title}` }
      : { ...travelPlace.coords, name: `At ${travelPlace.title}` };
    setTravel((current) => ({
      ...current,
      checkedIn: true,
      checkin: checkin || current.checkin || { placeId: travelPlace.id, method: 'manual' },
      completedPlaces: nextCompleted,
      completedStopIds: nextCompleted.map((entry) => entry.id),
      timeWalkedMinutes: (Number(current.timeWalkedMinutes) || 0) + walkedMinutes,
      currentLocation: bestLocation,
      pendingPhotoDataUrl: null,
      remainingOrder: nextRemaining.map((place) => place.id),
    }));
    setStep(nextRemaining.length ? 'what_next' : 'trip_summary');
  };

  const goToNextStop = (place, { originName, originLocation = null, offsetMinutes = 0, meal = null } = {}) => {
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
      isSimulated: false,
    } : null;
    setTravel((current) => ({
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
      meals: meal ? [...(current.meals || []), { ...meal, at: tripNow.toISOString() }] : current.meals || [],
    }));
    setStep('getting_there');
  };

  const skipNextStop = (place) => {
    setTravel((current) => ({ ...current, skippedPlaceIds: [...new Set([...(current.skippedPlaceIds || []), place.id])], remainingOrder: remainingTripPlaces.filter((entry) => entry.id !== place.id).map((entry) => entry.id) }));
    const remainingAfterSkip = remainingTripPlaces.filter((entry) => entry.id !== place.id);
    if (!remainingAfterSkip.length) setStep('trip_summary');
  };

  const handleWriteTripStory = async () => {
    if (storyLoading) return;
    setStoryLoading(true);
    setStoryError('');
    const photos = completedPlaces.filter((place) => place.photoDataUrl).map((place) => ({ placeId: place.id, dataUrl: place.photoDataUrl }));
    try {
      const story = await writeTripStory({
        places: completedPlaces.map(({ id }) => ({ id })),
        photos,
        timeWalkedMinutes: travel.timeWalkedMinutes || 0,
        language: userLanguage,
      });
      setTravel((current) => ({ ...current, story }));
    } catch (error) {
      const names = completedPlaces.map((place) => place.title).join(', ');
      const fallback = {
        en: { title: 'A day among Delhi’s stories', summary: `You discovered ${names}, saved your check-in memories, and walked about ${travel.timeWalkedMinutes || 0} minutes. The day’s places and photos are now part of your Sarthi Trip Memory.` },
        hi: { title: 'दिल्ली की कहानियों के बीच एक दिन', summary: `आज आपने ${names} की सैर की। आपकी जगहें और तस्वीरें इस यात्रा को खास बनाती हैं।` },
        ta: { title: 'டெல்லிக் கதைகளுடன் ஒரு நாள்', summary: `இன்று நீங்கள் ${names} இடங்களைப் பார்த்தீர்கள். உங்கள் இடங்களும் புகைப்படங்களும் இந்தப் பயண நினைவாக இருக்கும்.` },
        bn: { title: 'দিল্লির গল্পে ভরা একটি দিন', summary: `আজ আপনি ${names} ঘুরে দেখেছেন। আপনার স্থান ও ছবিগুলি এই যাত্রার স্মৃতি হয়ে থাকবে।` },
      }[userLanguage] || { title: 'A day among Delhi’s stories', summary: `You discovered ${names} and saved the day in your Sarthi Trip Memory.` };
      setTravel((current) => ({ ...current, story: { ...fallback, fallback: true, source: 'fallback' } }));
      setStoryError('The story service could not be reached. Sarthi used its local rules-based summary.');
    } finally {
      setStoryLoading(false);
    }
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
    setUserProfile({ ...DEFAULT_USER_PROFILE, language: 'en' });
    setDayPlan([]);
    setSavedMonuments([MONUMENTS[1], MONUMENTS[2]]);
    setItinerary(null);
    setTripSetup({
      ...normalizeSetup(DEFAULT_TRIP_SETUP),
      destination: null,
      mode: null,
      group: null,
      placeIds: [],
    });
    setPlanScreen('day');
    lastAutoNarratedRef.current = null;
    setStep('language');
    showToast('Preferences and data reset successfully.', 'restart_alt');
  };

  // ─── Smart itinerary actions ─────────────────────────────────────
  const handleOpenItinerary = () => {
    if (!itinerary?.totals?.stops) {
      if (!dayPlan.length) {
        showToast('Add places to your Day Plan first', 'info');
        return;
      }
      const next = planTrip(dayPlan, tripSetup);
      setItinerary(next);
      showToast(
        next.totals.stops
          ? `Itinerary ready — ${next.totals.stops} stops over ${next.days.length} day${next.days.length > 1 ? 's' : ''}`
          : 'None of these stops fit the schedule',
        'route'
      );
    }
    setPlanScreen('itinerary');
  };

  const handleUpdateTripSetup = (patch) => {
    const nextSetup = { ...tripSetup, ...patch };
    setTripSetup(nextSetup);

    // Rebuild from the current selection so pace/accessibility changes apply.
    const sources = dayPlan.length
      ? dayPlan
      : (itinerary?.days || []).flatMap((day) => day.stops);
    if (itinerary && sources.length) {
      setItinerary(planTrip(sources, nextSetup));
    }
  };

  const handleStartTrip = () => {
    if (isDemoMode && !travel.placeId) {
      setActiveTab('explore');
      setStep('dashboard');
      return;
    }
    const firstStop = (itinerary?.days || []).find((day) => day.stops.length)?.stops[0];
    const place = MONUMENTS.find((candidate) => candidate.id === firstStop?.id);
    if (!place) {
      showToast('Your itinerary has no first stop. Return to the plan and add a place.', 'info');
      return;
    }
    localStorage.removeItem(TRIP_STARTED_KEY);
    setTravel((current) => ({
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
      story: null,
    }));
    setStep('getting_there');
    showToast(`Getting there — first stop: ${place.title}`, 'route');
  };

  const setTravelStep = (nextStep) => {
    setTravel((current) => ({ ...current, step: nextStep }));
    setStep(nextStep);
  };

  const travelCandidates = passPlaces;
  const requestTravelFeature = (feature, nextStep) => {
    if (canAccessGuideFeature(entitlements, travel.placeId, feature)) {
      setTravelStep(nextStep);
      return;
    }
    setTravel((current) => ({ ...current, pendingFeature: feature, pendingStep: nextStep }));
    setStep('travel_access');
  };

  const openTripStory = () => {
    setStep('trip_story');
    if (!travel.story) handleWriteTripStory();
  };

  if (step === 'getting_there' && travelPlace) {
    return (
      <GettingThereView
        destination={travelPlace}
        origin={travel.origin}
        isSimulated={Boolean(travel.origin?.isSimulated || travel.origin?.isSandbox)}
        transport={travel.transport || 'auto'}
        departureAt={travel.departureAt}
        demoClockTime={userProfile?.demoClockTime}
        clockOffsetMinutes={travel.clockOffsetMinutes || 0}
        onOriginLabelChange={(name) => setTravel((current) => ({ ...current, originLabel: name }))}
        onTransportChange={(transport) => setTravel((current) => ({ ...current, transport }))}
        onDeparture={(departureAt) => setTravel((current) => {
          const origin = current.origin ? { ...current.origin, name: current.originLabel || current.origin.name } : current.origin;
          return { ...current, departureAt, origin, hotelOrigin: current.hotelOrigin || origin };
        })}
        onSetOrigin={(origin) => setTravel((current) => ({ ...current, origin }))}
        onUseDemoOrigin={() => setTravel((current) => ({
          ...current,
          origin: { lat: 28.6139, lng: 77.2090, name: current.originLabel || 'Connaught Place, Delhi (demo)', isSandbox: true, isSimulated: true },
        }))}
        onArrived={() => requestTravelFeature('arrivalBriefing', 'arrival_briefing')}
      />
    );
  }

  if (step === 'arrival_briefing' && travelPlace) {
    return <ArrivalBriefingView monument={travelPlace} language={userLanguage} onGotIt={() => requestTravelFeature('photoCheckIn', 'photo_checkin')} />;
  }

  if (step === 'photo_checkin' && travelPlace) {
    return (
      <PhotoCheckInView
        monument={travelPlace}
        language={userLanguage}
        itineraryCandidates={travelCandidates}
        onPhotoCaptured={async (file) => {
          setTravel((current) => ({ ...current, pendingPhotoDataUrl: null }));
          const photoDataUrl = await compressMemoryPhoto(file);
          if (photoDataUrl) setTravel((current) => ({ ...current, pendingPhotoDataUrl: photoDataUrl }));
        }}
        onPhotoCleared={() => setTravel((current) => ({ ...current, pendingPhotoDataUrl: null }))}
        onCheckedIn={(checkin) => {
          if (checkin.placeId !== travel.placeId) {
            const recognizedPlace = MONUMENTS.find((place) => place.id === checkin.placeId);
            showToast(`That photo looks like ${recognizedPlace?.title || 'another planned place'}. Check in at ${travelPlace.title} to start this walk.`, 'photo_camera');
            return;
          }
          setTravel((current) => ({ ...current, checkedIn: true, checkin }));
          requestTravelFeature('guidedWalk', 'guided_walk');
        }}
        onMonumentCompleted={() => finishCurrentMonument({ placeId: travelPlace.id, method: 'manual' })}
        onBack={() => setTravelStep('arrival_briefing')}
      />
    );
  }

  if (step === 'guided_walk' && travelPlace) {
    return (
      <GuidedWalkView
        monument={travelPlace}
        language={userLanguage}
        initialStopIndex={travel.stopIndex || 0}
        onProgress={(stopIndex) => setTravel((current) => current.stopIndex === stopIndex ? current : ({ ...current, stopIndex }))}
        onComplete={() => finishCurrentMonument(travel.checkin)}
      />
    );
  }

  if (step === 'what_next' && currentPlace && nextStepPlan) {
    return (
      <WhatNextView
        currentPlace={currentPlace}
        plan={nextStepPlan}
        onEat={(restaurant) => {
          const next = nextStepPlan.nextStop?.place;
          if (next && nextStepPlan.nextStop.feasible) goToNextStop(next, { originLocation: restaurant.coords, originName: `Near ${restaurant.name}`, meal: { name: restaurant.name, cuisine: restaurant.cuisine, distance: restaurant.distance, coords: restaurant.coords, approx: restaurant.approx } });
          else {
            setTravel((current) => ({ ...current, meals: [...(current.meals || []), { name: restaurant.name, cuisine: restaurant.cuisine, distance: restaurant.distance, at: tripNow.toISOString() }] }));
            setStep('trip_summary');
          }
        }}
        onContinue={(place) => goToNextStop(place)}
        onRest={(minutes, canContinue) => {
          const next = nextStepPlan.nextStop?.place;
          if (next && canContinue) goToNextStop(next, { offsetMinutes: minutes, originName: `Near ${currentPlace.title} after a ${minutes}-minute rest` });
          else setStep('trip_summary');
        }}
        onSkip={skipNextStop}
        onEndDay={() => setStep('trip_summary')}
      />
    );
  }

  if (step === 'trip_summary') {
    return (
      <TripSummaryView
        completedPlaces={completedPlaces}
        timeWalkedMinutes={travel.timeWalkedMinutes || 0}
        returnTrip={returnTrip}
        hotelOrigin={travel.hotelOrigin}
        onCreateStory={openTripStory}
        onFinish={enterDashboard}
      />
    );
  }

  if (step === 'trip_story') {
    return (
      <TripStoryView
        story={travel.story}
        places={completedPlaces}
        language={userLanguage}
        loading={storyLoading}
        error={storyError}
        onGenerate={handleWriteTripStory}
        onBack={() => setStep('trip_summary')}
        onFinish={enterDashboard}
      />
    );
  }

  if (step === 'travel_access' && travelPlace) {
    return (
      <div className="min-h-screen bg-background p-5 flex items-center justify-center">
        <section className="max-w-md w-full rounded-3xl bg-white border border-outline-variant/30 p-6 text-center space-y-3 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-secondary">auto_awesome</span>
          <h1 className="font-display text-2xl font-bold text-primary">Unlock this part of your guide</h1>
          <p className="text-sm text-on-surface-variant">Arrival briefings, photo check-in, and authored walks are included in the {travelPlace.title} Guide Pass. The demo unlock is saved on this device.</p>
          <button onClick={() => {
            handleDemoUnlock({ offerId: `place:${travelPlace.id}`, placeIds: [travelPlace.id], peopleLimit: 1 });
            setTravelStep(travel.pendingStep || 'arrival_briefing');
          }} className="w-full min-h-12 rounded-2xl bg-primary text-on-primary text-sm font-bold">Demo unlock · continue</button>
          <button onClick={() => setTravelStep(travel.pendingFeature === 'arrivalBriefing' ? 'getting_there' : 'arrival_briefing')} className="text-xs font-bold text-primary">Go back</button>
        </section>
      </div>
    );
  }

  // ─── Planning flow screens (one screen per step, each with Back) ────
  if (step === 'language') {
    return <LanguageOnboardingView onSelectLanguage={handleSelectLanguage} />;
  }

  if (step === 'resume') {
    return (
      <ResumeTripView
        itinerary={itinerary}
        tripSetup={tripSetup}
        onResume={handleResumeTrip}
        onPlanNewTrip={startNewTrip}
      />
    );
  }

  if (step === 'destination') {
    return (
      <DestinationView
        monuments={MONUMENTS}
        selectedId={tripSetup.destination?.id}
        onSelect={handleSelectDestination}
        onBack={() => setStep('language')}
      />
    );
  }

  if (step === 'days') {
    return (
      <TripDaysView
        days={tripSetup.days}
        startDate={tripSetup.startDate}
        startTime={tripSetup.startTime}
        onContinue={handleConfirmDays}
        onBack={() => setStep('destination')}
      />
    );
  }

  if (step === 'mode') {
    return (
      <PlanningModeView
        mode={tripSetup.mode}
        onContinue={handleSelectMode}
        onBack={() => setStep('days')}
      />
    );
  }

  if (step === 'group') {
    return (
      <GroupDetailsView
        group={tripSetup.group}
        onContinue={handleGroupContinue}
        onBack={() => setStep('mode')}
      />
    );
  }

  if (step === 'places') {
    return (
      <PlaceSelectionView
        places={destinationPlaces}
        initialSelected={tripSetup.placeIds || []}
        mode={tripSetup.mode}
        destinationName={tripSetup.destination?.name}
        onContinue={handleConfirmPlaces}
        onBack={() => setStep('group')}
      />
    );
  }

  if (step === 'itinerary') {
    return (
      <ItineraryView
        itinerary={itinerary}
        onUpdateSetup={handleUpdateTripSetup}
        onChange={setItinerary}
        onBack={() => setStep('places')}
        onOpenOverview={() => setStep('overview')}
        onShowToast={showToast}
          showProgress
      />
    );
  }

  if (step === 'overview') {
    return (
      <TripOverviewView
        itinerary={itinerary}
        onBack={() => setStep('itinerary')}
        onEdit={() => setStep('itinerary')}
        onContinue={() => setStep('passes')}
        showProgress
      />
    );
  }

  if (step === 'passes') {
    return (
      <GuidePassesView
        places={passPlaces}
        dayPlaces={firstDayPassPlaces}
        entitlements={entitlements}
        onDemoUnlock={handleDemoUnlock}
        onStartTrip={handleStartTrip}
        onBack={() => setStep('overview')}
      />
    );
  }

  if (step === 'location') {
    return (
      <LocationAccessView
        onNext={handleConfirmStartLocation}
        onBack={() => setStep('passes')}
      />
    );
  }

  // Render active popup overlay screens if triggered
  if (arMonument) {
    return (
      <>
      <GnaniStatusBanner connected={gnaniConnected} />
      <LiveGuideView
        monument={arMonument}
        userLanguage={userLanguage}
        onClose={() => { setArMonument(null); setShowMicPromptInGuide(false); }}
        onShowToast={showToast}
        showMicPrompt={showMicPromptInGuide}
      />
      </>
    );
  }

  if (storyMonument) {
    return (
      <>
      <GnaniStatusBanner connected={gnaniConnected} />
      <LandmarkStoryView
        monument={storyMonument}
        onClose={() => setStoryMonument(null)}
        onOpenAudioGuide={(m) => {
          setStoryMonument(null);
          openAudioGuide(m);
        }}
      />
      </>
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
      <GnaniStatusBanner connected={gnaniConnected} />

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

      {isDemoMode && !demoStartConfirmed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-primary/70 backdrop-blur-sm p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="demo-start-title" className="w-full max-w-sm rounded-3xl border border-white/30 bg-white p-6 text-center shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary">Humayun’s Tomb · Audio Demo</p>
            <h1 id="demo-start-title" className="mt-2 font-display text-2xl font-bold text-primary">Ready to explore?</h1>
            <button
              type="button"
              autoFocus
              onClick={() => setDemoStartConfirmed(true)}
              className="mt-5 min-h-12 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md hover:bg-primary-container"
            >
              Tap to start the demo
            </button>
          </section>
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
            onOpenAudioGuide={openAudioGuide}
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
                onOpenAudioGuide={openAudioGuide}
                userLocation={currentCoords}
                isSimulated={isSimulated}
                setSimulatedCoords={setSimulatedCoords}
                savedMonuments={savedMonuments}
                onToggleBookmark={handleToggleBookmark}
                dayPlan={dayPlan}
                onShowToast={showToast}
                hasResumableTrip={Boolean(travel.placeId && remainingTripPlaces.length)}
                onResumeTrip={() => setStep(completedPlaces.length ? 'what_next' : 'getting_there')}
              />
            )}

            {activeTab === 'plan' && (
              planScreen === 'itinerary' ? (
                <ItineraryView
                  itinerary={itinerary}
                  onUpdateSetup={handleUpdateTripSetup}
                  onChange={setItinerary}
                  onBack={() => setPlanScreen('day')}
                  onOpenOverview={() => setPlanScreen('overview')}
                  onSelectMonument={(m) => setSelectedMonument(m)}
                  onShowToast={showToast}
                />
              ) : planScreen === 'overview' ? (
                <TripOverviewView
                  itinerary={itinerary}
                  onBack={() => setPlanScreen('itinerary')}
                  onEdit={() => setPlanScreen('itinerary')}
                  onContinue={() => setStep('passes')}
                  onSelectMonument={(m) => setSelectedMonument(m)}
                />
              ) : (
                <DayPlanView
                  dayPlan={dayPlan}
                  setDayPlan={setDayPlan}
                  onSelectMonument={(m) => setSelectedMonument(m)}
                  onOpenRoute={(origin, destination) => setRouteConfig({ origin, destination })}
                  onOpenItinerary={handleOpenItinerary}
                  hasItinerary={Boolean(itinerary?.totals?.stops)}
                />
              )
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
                onPlanNewTrip={startNewTrip}
                onShowToast={showToast}
                handsFreeSetting={handsFreeSetting}
                onToggleHandsFree={() => setHandsFreeSetting(prev => !prev)}
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
          userLanguage={userLanguage}
          onClose={() => { setAudioMonument(null); setAutoPlayNarration(false); }}
          onNarrationEnd={handleNarrationEnd}
          autoPlay={autoPlayNarration}
          onLanguageChange={(language) => setUserProfile((profile) => ({ ...profile, language }))}
        />
      )}

    </div>
  );
}
