import React, { useState, useEffect, useRef } from 'react';
import { MONUMENTS } from '../data/monuments';
import { getDistanceInMeters } from '../utils/distance';

export default function ExploreView({ 
  onSelectMonument, 
  onAddToDayPlan, 
  onOpenLiveGuide,
  onOpenStory,
  onOpenAudioGuide,
  userLocation,
  isSimulated,
  setSimulatedCoords,
  savedMonuments = [],
  onToggleBookmark,
  dayPlan = [],
  onShowToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activePlaces, setActivePlaces] = useState(MONUMENTS);
  const [hoveredMonumentId, setHoveredMonumentId] = useState(null);
  
  // Custom Map Mock state
  const [mapCenter, setMapCenter] = useState({ lat: 28.5933, lng: 77.2507 }); // Delhi coordinate center
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // Proximity alerts & Simulation UI state
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [nearbyMonument, setNearbyMonument] = useState(null);
  const [isCardDismissed, setIsCardDismissed] = useState(false);
  const [nearbyDistance, setNearbyDistance] = useState(0);

  const PROXIMITY_THRESHOLD = 150; // meters

  // Format real-time distances in the sidebar dynamically
  const formatDistance = (monument) => {
    if (!userLocation) return monument.distance;
    const distMeters = getDistanceInMeters(
      userLocation.lat,
      userLocation.lng,
      monument.coords.lat,
      monument.coords.lng
    );
    if (distMeters < 1000) {
      return `${Math.round(distMeters)} m`;
    }
    return `${(distMeters / 1000).toFixed(1)} km`;
  };

  // Check proximity to all monuments continuously
  useEffect(() => {
    if (!userLocation) {
      setNearbyMonument(null);
      return;
    }

    let closestMon = null;
    let minDistance = Infinity;

    MONUMENTS.forEach(m => {
      const dist = getDistanceInMeters(
        userLocation.lat,
        userLocation.lng,
        m.coords.lat,
        m.coords.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestMon = m;
      }
    });

    if (closestMon && minDistance <= PROXIMITY_THRESHOLD) {
      if (!nearbyMonument || nearbyMonument.id !== closestMon.id) {
        setNearbyMonument(closestMon);
        setIsCardDismissed(false);
      }
      setNearbyDistance(Math.round(minDistance));
    } else {
      setNearbyMonument(null);
    }
  }, [userLocation, nearbyMonument]);

  // Center on user position when warped (simulated)
  useEffect(() => {
    if (userLocation && leafletMapRef.current && isSimulated) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, isSimulated]);

  // Handle first auto-center on load
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (userLocation && leafletMapRef.current && !hasAutoCentered.current) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14);
      hasAutoCentered.current = true;
    }
  }, [userLocation]);

  // Update user pulsing marker on Leaflet map dynamically
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = window.L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-30 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      userMarkerRef.current = window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(leafletMapRef.current);
    }
  }, [userLocation]);

  // Category listing
  const categories = ['All', 'Heritage', 'Spiritual', 'Culture', 'Food'];

  // Categories Color / Icon Helper
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'Heritage':
        return { color: 'bg-secondary', text: 'text-secondary', pinColor: '#974730', icon: 'account_balance' };
      case 'Spiritual':
        return { color: 'bg-tertiary', text: 'text-tertiary', pinColor: '#3a2b00', icon: 'self_improvement' };
      case 'Food':
        return { color: 'bg-yellow-600', text: 'text-yellow-600', pinColor: '#E9C46A', icon: 'restaurant' };
      default:
        return { color: 'bg-primary', text: 'text-primary', pinColor: '#162a5a', icon: 'explore' };
    }
  };

  // Filter monuments based on search & category
  useEffect(() => {
    let filtered = MONUMENTS;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.subtitle.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q)
      );
    }
    
    setActivePlaces(filtered);
  }, [searchQuery, selectedCategory]);

  // Leaflet map setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = window.L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      leafletMapRef.current = map;

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      updateMapMarkers(map);
    }
  }, [activePlaces]);

  const updateMapMarkers = (map) => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!window.L) return;

    activePlaces.forEach(place => {
      const theme = getCategoryTheme(place.category);
      
      const customIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative group cursor-pointer transform hover:scale-110 transition-transform">
            <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 42C18 42 36 27.5789 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.5789 18 42 18 42Z" fill="${theme.pinColor}"/>
              <circle cx="18" cy="17" r="10" fill="white"/>
            </svg>
            <span class="material-symbols-outlined absolute top-[7px] left-[8px] text-[18px]" style="color: ${theme.pinColor}; font-variation-settings: 'FILL' 1">${theme.icon}</span>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42]
      });

      const marker = window.L.marker([place.coords.lat, place.coords.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectMonument(place);
        });
      
      markersRef.current.push(marker);
    });
  };

  const handleRecenter = () => {
    if (leafletMapRef.current) {
      const center = userLocation || mapCenter;
      leafletMapRef.current.setView([center.lat, center.lng], 14);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col md:flex-row bg-surface">
      {/* Sidebar - Desktop list / search */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white h-full shadow-ambient-card border-r border-outline-variant/30 flex flex-col z-20 shrink-0">
        
        {/* Search Header Container */}
        <div className="p-5 pb-3 border-b border-outline-variant/20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-primary">Explore Delhi</h2>
            <span className="text-xs bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-full font-semibold">
              {activePlaces.length} Landmarks
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center bg-surface-container-low border border-outline-variant/40 rounded-full px-4.5 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-outline mr-2">search</span>
            <input 
              type="text" 
              placeholder="Search temples, tombs, food spots..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-sans text-on-surface placeholder:text-outline-variant"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-surface-container rounded-full" title="Clear search">
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>

          {/* Horizontal scroll category chips */}
          <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                    isActive 
                      ? 'bg-primary text-on-primary border-primary shadow-sm' 
                      : 'bg-surface hover:bg-surface-container-low text-on-surface-variant border-outline-variant/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Landmarks Scrollable List */}
        <div className="flex-grow overflow-y-auto hide-scroll p-4 space-y-3 bg-surface-container-lowest">
          {activePlaces.length > 0 ? (
            activePlaces.map((place) => {
              const isSaved = savedMonuments.some(s => s.id === place.id);
              const isInPlan = dayPlan.some(p => p.id === place.id);

              return (
                <div 
                  key={place.id}
                  onClick={() => onSelectMonument(place)}
                  onMouseEnter={() => setHoveredMonumentId(place.id)}
                  onMouseLeave={() => setHoveredMonumentId(null)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-4 hover:shadow-ambient-card hover:border-primary/20 bg-white ${
                    hoveredMonumentId === place.id ? 'border-primary bg-primary/[0.01]' : 'border-outline-variant/30'
                  }`}
                >
                  {/* Monument Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container relative">
                    <img src={place.image} alt={place.title} className="w-full h-full object-cover" />
                    {place.unescoStatus && (
                      <span className="absolute top-1 left-1 bg-secondary text-on-secondary text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shadow-sm">
                        UNESCO
                      </span>
                    )}
                  </div>

                  {/* Core Meta Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-outline">
                            {place.category}
                          </span>
                          <span className="text-outline-variant text-[10px]">•</span>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {formatDistance(place)}
                          </span>
                        </div>

                        {/* Bookmark quick button */}
                        {onToggleBookmark && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(place);
                              if (onShowToast) {
                                onShowToast(
                                  isSaved ? `Removed ${place.title} from Saved` : `Saved ${place.title}`,
                                  isSaved ? 'bookmark_remove' : 'bookmark_added'
                                );
                              }
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              isSaved ? 'text-secondary hover:bg-secondary/10' : 'text-outline hover:text-primary hover:bg-surface-container'
                            }`}
                            title={isSaved ? 'Remove bookmark' : 'Bookmark landmark'}
                          >
                            <span 
                              className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              {isSaved ? 'bookmark' : 'bookmark_border'}
                            </span>
                          </button>
                        )}
                      </div>

                      <h3 className="font-sans font-bold text-sm text-primary line-clamp-1">{place.title}</h3>
                      <p className="font-sans text-xs text-on-surface-variant mt-0.5 line-clamp-1 italic">{place.subtitle}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/20">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-xs font-bold text-on-surface">{place.rating}</span>
                        <span className="text-[10px] text-outline">({place.reviewsCount.toLocaleString()})</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToDayPlan(place);
                        }}
                        className={`text-xs font-bold flex items-center gap-0.5 transition-colors ${
                          isInPlan ? 'text-green-700' : 'text-secondary hover:text-secondary-container'
                        }`}
                        title={isInPlan ? 'Already in Day Plan' : 'Add to Day Plan'}
                      >
                        <span className="material-symbols-outlined text-sm font-bold">
                          {isInPlan ? 'check' : 'add'}
                        </span>
                        <span>{isInPlan ? 'In Plan' : 'Day Plan'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 space-y-2">
              <span className="material-symbols-outlined text-outline text-4xl">search_off</span>
              <h3 className="font-sans font-bold text-on-surface text-sm">No heritage sites found</h3>
              <p className="text-xs text-on-surface-variant max-w-[240px] mx-auto">
                Try searching for other keywords, checking filters, or resetting category selections.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-grow h-full relative z-10">
        
        {/* Actual Map Canvas Div */}
        <div ref={mapContainerRef} className="w-full h-full">
          {/* Fallback Custom Stylized Vector Canvas/SVG if Leaflet fails to mount offline */}
          <div className="absolute inset-0 bg-surface-container-low flex flex-col justify-center items-center pointer-events-none z-0">
            <div className="w-full h-full max-w-4xl p-6 opacity-30 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M 0,200 Q 150,180 300,280 T 600,260 T 800,320" stroke="#d9dadb" strokeWidth="20" fill="none" />
                <path d="M 200,0 Q 250,200 150,400 T 400,600" stroke="#d9dadb" strokeWidth="16" fill="none" />
                <path d="M 500,0 Q 450,200 650,400 T 500,600" stroke="#d9dadb" strokeWidth="12" fill="none" />
                <path d="M 600,0 Q 550,150 700,350 T 800,500" stroke="#9caee7" strokeWidth="48" strokeLinecap="round" opacity="0.6" fill="none" />
              </svg>
            </div>
            
            <div className="absolute bg-white/90 backdrop-blur border border-outline-variant/30 px-5 py-3 rounded-2xl shadow-ambient-card pointer-events-auto text-center space-y-1.5">
              <span className="material-symbols-outlined text-primary text-xl">my_location</span>
              <h4 className="text-xs font-bold text-primary">Sarthi Interactive Map Engine</h4>
              <p className="text-[10px] text-on-surface-variant max-w-[220px]">
                Click on the sidebar cards to view deep historical facts, audio guides and planning tools.
              </p>
            </div>
          </div>
        </div>

        {/* Map Control Actions overlay */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          {/* Dev Simulation Toggle button */}
          <button 
            onClick={() => setShowDevPanel(!showDevPanel)}
            className={`p-3 rounded-full shadow-ambient-card border flex items-center justify-center transition-colors transform active:scale-95 ${
              isSimulated 
                ? 'bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800' 
                : 'bg-white border-outline-variant/30 hover:bg-surface-container text-primary'
            }`}
            title="GPS Simulation Controls"
          >
            <span className="material-symbols-outlined">{isSimulated ? 'construction' : 'bug_report'}</span>
          </button>

          <button 
            onClick={handleRecenter}
            className="p-3 bg-white hover:bg-surface-container rounded-full shadow-ambient-card border border-outline-variant/30 flex items-center justify-center transition-colors transform active:scale-95"
            title="Recenter Map"
          >
            <span className="material-symbols-outlined text-primary">my_location</span>
          </button>
          
          <button 
            onClick={() => {
              if (leafletMapRef.current) {
                leafletMapRef.current.zoomIn();
              }
            }}
            className="p-3 bg-white hover:bg-surface-container rounded-full shadow-ambient-card border border-outline-variant/30 flex items-center justify-center transition-colors transform active:scale-95"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-primary">add</span>
          </button>

          <button 
            onClick={() => {
              if (leafletMapRef.current) {
                leafletMapRef.current.zoomOut();
              }
            }}
            className="p-3 bg-white hover:bg-surface-container rounded-full shadow-ambient-card border border-outline-variant/30 flex items-center justify-center transition-colors transform active:scale-95"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-primary">remove</span>
          </button>
        </div>

        {/* GPS Simulation Panel Overlay */}
        {showDevPanel && (
          <div className="absolute top-20 right-4 z-30 bg-white/95 backdrop-blur-md border border-outline-variant/30 rounded-3xl shadow-ambient-elevated p-5 w-[320px] space-y-4 font-sans animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <span className="material-symbols-outlined text-base">construction</span>
                <span>GPS Simulation Panel</span>
              </div>
              <button 
                onClick={() => setShowDevPanel(false)} 
                className="p-1 hover:bg-surface-container rounded-full text-outline"
                title="Close panel"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
            
            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <div className="space-y-0.5">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Status</span>
                <p className={`font-semibold ${isSimulated ? 'text-amber-600' : 'text-green-600'}`}>
                  {isSimulated ? '🔴 Simulated' : '🟢 Live GPS'}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">Coordinates</span>
                <p className="font-semibold text-on-surface truncate" title={`${userLocation?.lat?.toFixed(5) || 0}, ${userLocation?.lng?.toFixed(5) || 0}`}>
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'No GPS Signal'}
                </p>
              </div>
            </div>

            {/* Quick warp monuments */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Warp to Monument</label>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 hide-scroll">
                {MONUMENTS.map((m) => {
                  const isWarpedHere = userLocation && 
                    Math.abs(userLocation.lat - m.coords.lat) < 0.0001 &&
                    Math.abs(userLocation.lng - m.coords.lng) < 0.0001;

                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSimulatedCoords({ lat: m.coords.lat, lng: m.coords.lng });
                        if (onShowToast) onShowToast(`Warped to ${m.title}`, 'location_on');
                      }}
                      className={`p-2 text-[10px] font-bold border rounded-xl text-left truncate transition-all flex items-center gap-1.5 ${
                        isWarpedHere 
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                          : 'bg-white hover:bg-surface-container border-outline-variant/35 text-primary'
                      }`}
                      title={`Warp to ${m.title}`}
                    >
                      <span>📍</span>
                      <span className="truncate">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual coordinates inputs */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">Manual Override</label>
              <div className="flex gap-2">
                <div className="w-1/2 space-y-1">
                  <span className="text-[9px] text-outline font-medium">Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.5933"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full p-2.5 text-xs bg-surface border border-outline-variant/40 rounded-xl outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="w-1/2 space-y-1">
                  <span className="text-[9px] text-outline font-medium">Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.2507"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full p-2.5 text-xs bg-surface border border-outline-variant/40 rounded-xl outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const lat = parseFloat(customLat);
                  const lng = parseFloat(customLng);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setSimulatedCoords({ lat, lng });
                    if (onShowToast) onShowToast(`Applied custom coords (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'my_location');
                  }
                }}
                className="w-full py-2.5 text-[10px] font-bold bg-primary text-on-primary rounded-xl transition-all hover:bg-primary-container shadow-sm transform active:scale-95"
              >
                Apply Custom Coordinates
              </button>
            </div>

            {/* Reset controls */}
            {isSimulated && (
              <button
                onClick={() => {
                  setSimulatedCoords(null);
                  setCustomLat('');
                  setCustomLng('');
                  if (onShowToast) onShowToast('Reset to live GPS', 'restart_alt');
                }}
                className="w-full py-2 text-[10px] font-bold border border-outline-variant/50 text-secondary hover:bg-secondary/5 rounded-xl transition-colors"
              >
                Reset to Live GPS / Clear Override
              </button>
            )}
          </div>
        )}

        {/* Proximity Warning Slide-up Card */}
        {nearbyMonument && !isCardDismissed && (
          <div className="absolute bottom-20 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:w-[380px] z-40 bg-white/95 backdrop-blur-md border border-outline-variant/30 rounded-3xl shadow-ambient-elevated p-5 flex flex-col gap-4 font-sans animate-slide-up">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping shrink-0"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                    You're Nearby ({nearbyDistance}m away)
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-primary leading-tight">
                  {nearbyMonument.title}
                </h3>
              </div>
              <button 
                onClick={() => setIsCardDismissed(true)} 
                className="p-1 hover:bg-surface-container rounded-full transition-colors text-outline"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed font-normal">
              {nearbyMonument.overview ? nearbyMonument.overview.split('.')[0] + '.' : 'Discover the secrets of this historical marvel.'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenLiveGuide) onOpenLiveGuide(nearbyMonument);
                }}
                className="flex-grow bg-secondary hover:bg-secondary-container text-on-secondary text-xs font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 transform active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                <span>Live Guide</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenStory) onOpenStory(nearbyMonument);
                }}
                className="bg-surface hover:bg-surface-container border border-outline-variant/60 text-primary text-xs font-semibold py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-1 transform active:scale-95"
                title="Read Story"
              >
                <span className="material-symbols-outlined text-sm">menu_book</span>
                <span>Story</span>
              </button>

              <button
                onClick={() => onSelectMonument(nearbyMonument)}
                className="bg-surface hover:bg-surface-container border border-outline-variant/60 text-primary text-xs font-semibold py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-1 transform active:scale-95"
                title="View Details"
              >
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Details</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
