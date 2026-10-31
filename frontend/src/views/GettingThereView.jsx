import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getDistanceInMeters } from '../utils/distance';

const MODES = [
  { id: 'walk', label: 'Walk', icon: 'directions_walk', speedKmh: 4.5 },
  { id: 'auto', label: 'Auto', icon: 'electric_rickshaw', speedKmh: 15 },
  { id: 'cab', label: 'Cab', icon: 'local_taxi', speedKmh: 19 },
];

function timeLabel(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function GettingThereView({
  destination,
  origin,
  isSimulated,
  transport = 'auto',
  departureAt,
  demoClockTime,
  clockOffsetMinutes = 0,
  onOriginLabelChange,
  onTransportChange,
  onDeparture,
  onSetOrigin,
  onUseDemoOrigin,
  onArrived,
}) {
  const [originLabel, setOriginLabel] = useState(origin?.name || '');
  const [now, setNow] = useState(Date.now());
  const [locationError, setLocationError] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setOriginLabel(origin?.name || '');
  }, [origin?.name]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const selectedMode = MODES.find((mode) => mode.id === transport) || MODES[1];
  const demoBaseTime = useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(String(demoClockTime || ''))) return now + (Number(clockOffsetMinutes) || 0) * 60_000;
    const [hours, minutes] = demoClockTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const elapsed = Math.max(0, now - mountedAtRef.current);
    return date.getTime() + ((Number(clockOffsetMinutes) || 0) * 60_000) + elapsed;
  }, [now, demoClockTime, clockOffsetMinutes]);
  const route = useMemo(() => {
    if (!origin || !destination?.coords) return null;
    const meters = getDistanceInMeters(origin.lat, origin.lng, destination.coords.lat, destination.coords.lng);
    // This is a local estimate based on straight-line distance and a road/walk detour factor.
    const routeKm = meters / 1000 * (transport === 'walk' ? 1.12 : 1.3);
    const minutes = Math.max(meters < 120 ? 1 : 2, Math.ceil(routeKm / selectedMode.speedKmh * 60));
    return { meters, routeKm, minutes, arrivalAt: new Date(demoBaseTime + minutes * 60_000) };
  }, [origin, destination?.coords?.lat, destination?.coords?.lng, selectedMode.speedKmh, transport, demoBaseTime]);

  const requestLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('This browser does not provide device location. Use the Delhi demo start point.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => onSetOrigin({
        lat: coords.latitude,
        lng: coords.longitude,
        name: originLabel.trim() || 'Current location',
        isSandbox: false,
        isSimulated: false,
        useLiveLocation: true,
      }),
      () => setLocationError('Location was unavailable. You can continue with the Delhi demo start point.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const startVoiceInput = () => {
    setVoiceError('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError('Voice input is not supported here. Type your hotel or starting point instead.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results?.[0]?.[0]?.transcript?.trim();
      if (result) {
        setOriginLabel(result);
        onOriginLabelChange?.(result);
      }
    };
    recognition.onerror = () => setVoiceError('I could not hear that. Try again or type the location.');
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleLabelChange = (value) => {
    setOriginLabel(value);
    onOriginLabelChange?.(value);
  };

  return (
    <div className="min-h-screen bg-background pb-32 px-4 pt-5 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[.18em] text-secondary">TRAVEL DAY · 1 OF 4</p>
            <h1 className="font-display text-3xl font-black text-primary mt-1">Getting there</h1>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl">route</span>
        </header>

        <section className="relative overflow-hidden rounded-3xl min-h-44 bg-primary text-on-primary p-5 flex items-end shadow-sm">
          <img src={destination?.heroImage || destination?.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest text-on-primary-container font-bold">Your first stop</p>
            <h2 className="font-display text-2xl font-bold mt-1">{destination?.title || 'Your first monument'}</h2>
            <p className="text-xs text-on-primary-container mt-1">Let’s get you to the entrance. We’ll start the guide after you arrive.</p>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm space-y-3">
          <div>
            <h2 className="font-sans font-bold text-sm text-primary">Where are you leaving from?</h2>
            <p className="text-[11px] text-on-surface-variant mt-1">Add your hotel or starting point by text or voice.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={originLabel}
              onChange={(event) => handleLabelChange(event.target.value)}
              placeholder="Hotel name or starting point"
              aria-label="Hotel name or starting point"
              className="min-w-0 flex-1 rounded-2xl border border-outline-variant/50 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={startVoiceInput} aria-label="Speak hotel or starting point" className="min-h-12 min-w-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary/10">
              <span className="material-symbols-outlined">mic</span>
            </button>
          </div>
          {voiceError && <p role="status" className="text-[11px] text-amber-800">{voiceError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-outline">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${origin ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {origin ? `${isSimulated ? 'Demo start point' : 'Device location'} · route estimate ready` : 'Set a route location for an ETA'}
            </span>
            <span className="text-right">A typed hotel name is saved as your label; route distance uses device or demo coordinates.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={requestLocation} className="min-h-10 rounded-xl border border-outline-variant/50 px-3 py-2 text-[11px] font-bold text-primary">
              <span className="material-symbols-outlined text-[15px] align-middle mr-1">my_location</span>Use current location
            </button>
            <button onClick={onUseDemoOrigin} className="min-h-10 rounded-xl border border-outline-variant/50 px-3 py-2 text-[11px] font-bold text-primary">
              <span className="material-symbols-outlined text-[15px] align-middle mr-1">explore</span>Use Delhi demo start
            </button>
          </div>
          {locationError && <p role="status" className="text-[11px] text-amber-800">{locationError}</p>}
        </section>

        <section className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-sans font-bold text-sm text-primary">Choose how you’ll travel</h2>
            <p className="text-[11px] text-on-surface-variant mt-1">ETA recalculates with the clock and each location update.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onTransportChange(mode.id)}
                aria-pressed={transport === mode.id}
                className={`min-h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs font-bold ${transport === mode.id ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30' : 'border-outline-variant/40 text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined">{mode.icon}</span>{mode.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-outline">Estimated arrival</p>
              <p className="font-display text-xl font-bold text-primary mt-0.5">{route ? timeLabel(route.arrivalAt) : 'Set location'}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-sm font-bold text-on-surface">{route ? `${route.minutes} min` : '—'}</p>
              <p className="text-[10px] text-on-surface-variant">{route ? `${route.routeKm.toFixed(1)} km · ${selectedMode.label.toLowerCase()}` : 'route estimate'}</p>
            </div>
          </div>
          <p className="text-[10px] text-outline">Planning estimate from local coordinates; live road traffic and transit feeds are not connected.</p>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-white px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-outline">Departure log</p>
            <p className="text-xs font-semibold text-primary mt-0.5">{departureAt ? `Left at ${timeLabel(new Date(departureAt))}` : 'Not started yet'}</p>
          </div>
          <button onClick={() => onDeparture(new Date(demoBaseTime).toISOString())} className="min-h-11 rounded-xl bg-secondary px-4 text-xs font-bold text-on-secondary">
            {departureAt ? 'Update departure' : 'Leave now'}
          </button>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant/30 bg-white/95 backdrop-blur px-4 pt-3 pb-safe">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onArrived}
            disabled={!departureAt}
            className="w-full min-h-12 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-md disabled:opacity-40"
          >
            I’ve arrived at {destination?.title || 'the first stop'}
          </button>
        </div>
      </div>
    </div>
  );
}

