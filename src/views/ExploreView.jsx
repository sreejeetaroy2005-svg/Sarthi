import React, { useState, useEffect, useRef } from 'react';
import { MONUMENTS } from '../data/monuments';

export default function ExploreView({ onSelectMonument, onAddToDayPlan, userLocation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activePlaces, setActivePlaces] = useState(MONUMENTS);
  const [hoveredMonumentId, setHoveredMonumentId] = useState(null);
  
  // Custom Map Mock state (Leaflet acts as the main map engine, but we render a responsive fallback svg map structure for offline / instant render)
  const [mapCenter, setMapCenter] = useState({ lat: 28.5933, lng: 77.2507 }); // Delhi coordinate center
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

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
    // Check if Leaflet L is loaded globally or imported
    if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
      // Clean up previous map if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      // Initialize map
      const map = window.L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      leafletMapRef.current = map;

      // Add a clean tile layer (CartoDB Positron style coordinates map)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add custom zoom control at bottom right
      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Draw custom pins for monuments
      updateMapMarkers(map);
    }
  }, [activePlaces]);

  const updateMapMarkers = (map) => {
    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!window.L) return;

    activePlaces.forEach(place => {
      const theme = getCategoryTheme(place.category);
      
      // Custom HTML Marker matching Terracotta / Saffron teardrops
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
      leafletMapRef.current.setView([mapCenter.lat, mapCenter.lng], 13);
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
              <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-surface-container rounded-full">
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
              const theme = getCategoryTheme(place.category);
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
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-outline">
                          {place.category}
                        </span>
                        <span className="text-outline-variant text-[10px]">•</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {place.distance}
                        </span>
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
                        className="text-xs font-bold text-secondary hover:text-secondary-container flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                        <span>Day Plan</span>
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
              {/* Complex SVG layout for heritage coordinates map background */}
              <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Winding roads grid */}
                <path d="M 0,200 Q 150,180 300,280 T 600,260 T 800,320" stroke="#d9dadb" strokeWidth="20" fill="none" />
                <path d="M 200,0 Q 250,200 150,400 T 400,600" stroke="#d9dadb" strokeWidth="16" fill="none" />
                <path d="M 500,0 Q 450,200 650,400 T 500,600" stroke="#d9dadb" strokeWidth="12" fill="none" />
                {/* Yamuna river line */}
                <path d="M 600,0 Q 550,150 700,350 T 800,500" stroke="#9caee7" strokeWidth="48" strokeLinecap="round" opacity="0.6" fill="none" />
              </svg>
            </div>
            
            {/* Interactive hint overlay if leaflet doesn't boot */}
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
          >
            <span className="material-symbols-outlined text-primary">remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
