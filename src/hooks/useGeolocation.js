import { useState, useEffect } from 'react';

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
        isSimulated: !!initialLocation.isSandbox
      };
    }

    return null;
  });

  const [simulatedCoords, setSimulatedCoords] = useState(() => {
    if (coords?.isSimulated) {
      return { lat: coords.lat, lng: coords.lng };
    }
    return null;
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    // If simulated coordinates are set, bypass the actual watchPosition GPS query
    if (simulatedCoords) {
      setCoords({
        lat: simulatedCoords.lat,
        lng: simulatedCoords.lng,
        isSimulated: true
      });
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
          isSimulated: false
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Handle permission denial: only redirect if they aren't using the default sandbox
        if (err.code === err.PERMISSION_DENIED) {
          if (onPermissionDenied) {
            onPermissionDenied();
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, simulatedCoords, onPermissionDenied]);

  const updateSimulatedCoords = (newCoords) => {
    setSimulatedCoords(newCoords);
    if (!newCoords) {
      if (initialLocation && initialLocation.isSandbox) {
        // If we reset simulation but the initial onboarding selection was sandbox, default back to it
        setCoords({
          lat: initialLocation.lat,
          lng: initialLocation.lng,
          isSimulated: true
        });
      } else {
        // Otherwise set to null and let watchPosition re-trigger
        setCoords(null);
      }
    }
  };

  return {
    location: coords ? { lat: coords.lat, lng: coords.lng } : null,
    isSimulated: !!coords?.isSimulated,
    error,
    loading,
    setSimulatedCoords: updateSimulatedCoords
  };
}
