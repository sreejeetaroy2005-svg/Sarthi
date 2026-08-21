import React, { useState } from 'react';

export default function LocationAccessView({ onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const requestBrowserLocation = () => {
    setLoading(true);
    setErrorMsg('');
    
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        onNext({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Current Location"
        });
      },
      (error) => {
        setLoading(false);
        let msg = 'Could not access device location. Please search manually or use default location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please choose a city below or enable settings.';
        }
        setErrorMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const selectDelhiDefault = () => {
    onNext({
      lat: 28.5933,
      lng: 77.2507,
      name: "Delhi NCR"
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-xs font-semibold text-outline tracking-widest">STEP 2 OF 2</span>
        <div className="w-10"></div>
      </div>

      {/* Main core info container */}
      <div className="flex-grow flex flex-col justify-center items-center max-w-md mx-auto w-full z-10 py-6">
        <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>
        </div>

        <div className="text-center space-y-3 mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">Enable location access</h1>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
            Sarthi works by identifying nearby monuments as you wander, sending timely notifications of historical sites, audio narrations, and optimized paths.
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-4 mb-6 rounded-2xl bg-error-container/50 border border-error-container text-on-error-container text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-sm pt-0.5">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={requestBrowserLocation}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin border-2 border-on-primary border-t-transparent rounded-full w-5 h-5"></span>
            ) : (
              <>
                <span className="material-symbols-outlined">my_location</span>
                <span>Share Current Location</span>
              </>
            )}
          </button>

          <button
            onClick={selectDelhiDefault}
            className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-primary font-sans font-semibold py-4 px-6 rounded-2xl shadow-sm transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">explore</span>
            <span>Skip &amp; Use Delhi Sand Box</span>
          </button>
        </div>
      </div>

      {/* Footer message */}
      <div className="max-w-md mx-auto w-full z-10 text-center">
        <p className="font-sans text-xs text-outline">
          Your location data is processed locally to load regional maps and monument entries. We never sell your location tracking logs.
        </p>
      </div>
    </div>
  );
}
