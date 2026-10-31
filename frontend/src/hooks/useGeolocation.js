import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Custom hook to watch the user's geolocation continuously.
 * Offers development simulation controls (e.g. warping to specific coords)
 * and reads optional query parameters for URL-based simulation.
 * 
 * @param {Object} options Configuration parameters
 * @param {boolean} options.enabled Whether to actively watch geolocation
 * @param {Object} options.initialLocation Initial location selected during onboarding
 * @param {Function} options.onPermissionDenied Callback when permission is denied
 */
export default function useGeolocation({ enabled, initialLocation, onPermissionDenied }) {
  const isSandboxInitial = !!(initialLocation && (initialLocation.isSandbox || initialLocation.isSimulated));

  // Callbacks are usually inline arrows, so keep the latest one in a ref. Using
  // the prop directly in the effect deps re-ran the watcher on every render.
  const onPermissionDeniedRef = useRef(onPermissionDenied);
  onPermissionDeniedRef.current = onPermissionDenied;

  const [coords, setCoords] = useState(() => {
    // 1. Check URL parameters for override first (?sim_lat=28.5933&sim_lng=77.2507)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get('sim_lat') || params.get('lat'));
      const lng = parseFloat(params.get('sim_lng') || params.get('lng'));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, isSimulated: true };
      }
    }

    // 2. Check initial location selection from onboarding
    if (initialLocation) {
      return {
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        isSimulated: isSandboxInitial,
      };
    }

    return null;
  });

  const [simulatedCoords, setSimulatedCoords] = useState(() => {
    if (coords?.isSimulated) {
      return { lat: coords.lat, lng: coords.lng };
    }
    if (isSandboxInitial) {
      return { lat: initialLocation.lat, lng: initialLocation.lng };
    }
    return null;
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!isSandboxInitial);

  // Sync state when initialLocation changes from outside (e.g. user completes LocationAccessView onboarding)
  useEffect(() => {
    if (!initialLocation) return;
    const isSandbox = !!(initialLocation.isSandbox || initialLocation.isSimulated);
    if (isSandbox) {
      setSimulatedCoords({ lat: initialLocation.lat, lng: initialLocation.lng });
      setCoords({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        isSimulated: true,
      });
      setError(null);
      setLoading(false);
    } else {
      setCoords({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        isSimulated: false,
      });
      setLoading(false);
    }
  }, [initialLocation]);

  useEffect(() => {
    if (!enabled) return;

    const isSandbox = !!(initialLocation && (initialLocation.isSandbox || initialLocation.isSimulated));

    // If simulated coordinates are set or sandbox is selected, bypass actual watchPosition GPS query
    if (simulatedCoords || isSandbox) {
      const target = simulatedCoords || initialLocation;
      setCoords({
        lat: target.lat,
        lng: target.lng,
        isSimulated: true,
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    setLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isSimulated: false,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Handle permission denial: only redirect if not in sandbox mode
        if (err.code === err.PERMISSION_DENIED) {
          if (isSandbox) {
            setCoords({
              lat: initialLocation.lat,
              lng: initialLocation.lng,
              isSimulated: true,
            });
            return;
          }
          if (onPermissionDeniedRef.current) {
            onPermissionDeniedRef.current();
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, simulatedCoords, initialLocation]);

  const updateSimulatedCoords = (newCoords) => {
    setSimulatedCoords(newCoords);
    if (!newCoords) {
      if (initialLocation && (initialLocation.isSandbox || initialLocation.isSimulated)) {
        // If we reset simulation but the initial onboarding selection was sandbox, default back to it
        setCoords({
          lat: initialLocation.lat,
          lng: initialLocation.lng,
          isSimulated: true,
        });
      } else {
        // Otherwise set to null and let watchPosition re-trigger
        setCoords(null);
      }
    }
  };

  // A fresh object per render made consumers' effects re-run forever, so the
  // coordinates are memoised on the underlying values instead.
  const location = useMemo(
    () => (coords ? { lat: coords.lat, lng: coords.lng } : null),
    [coords?.lat, coords?.lng]
  );

  return {
    location,
    isSimulated: !!coords?.isSimulated,
    error,
    loading,
    setSimulatedCoords: updateSimulatedCoords,
  };
}
