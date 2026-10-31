import React, { useState } from 'react';

export default function RoutePlanView({ origin, destination, onClose }) {
  const [activeTransport, setActiveTransport] = useState('auto');

  if (!origin || !destination) return null;

  // Transit calculations mock
  const transportModes = [
    { id: 'walking', label: 'Walking', icon: 'directions_walk', time: '28 min', dist: '1.9 km', cost: 'Free' },
    { id: 'auto', label: 'Auto-Rickshaw', icon: 'rickshaw', time: '8 min', dist: '2.1 km', cost: '₹50 - ₹70' },
    { id: 'metro', label: 'Delhi Metro', icon: 'subway', time: '14 min', dist: '3.4 km', cost: '₹20' },
    { id: 'taxi', label: 'Cab/Taxi', icon: 'local_taxi', time: '7 min', dist: '2.2 km', cost: '₹120 - ₹150' }
  ];

  const currentMode = transportModes.find(m => m.id === activeTransport) || transportModes[1];

  // Route step guidance lists
  const getRouteSteps = (mode) => {
    switch (mode) {
      case 'walking':
        return [
          { text: "Exit Humayun's Tomb West Gateway and head west on Entrance Road", dist: "150m" },
          { text: "Turn left onto Mathura Road (NH-2) sidewalk", dist: "800m" },
          { text: "Cross the pedestrian flyover near Nizamuddin Police Station", dist: "100m" },
          { text: "Turn right onto Lodhi Road and continue straight to destination entrance", dist: "850m" }
        ];
      case 'metro':
        return [
          { text: "Walk 600m to Jawaharlal Nehru Stadium Metro Station (Violet Line)", dist: "6 min" },
          { text: "Board Violet Line Metro towards Raja Nahar Singh", dist: "1 stop" },
          { text: "De-board at JLN Stadium / Jangpura Gate and exit through Gate 2", dist: "2 min" },
          { text: "Walk 400m along Lodhi Road to destination entrance", dist: "4 min" }
        ];
      case 'taxi':
      case 'auto':
      default:
        return [
          { text: "Board your vehicle at Humayun's Tomb main parking lot dropoff lane", dist: "0m" },
          { text: "Head west toward Mathura Road (NH-2)", dist: "300m" },
          { text: "Take Lodhi Road flyover bypass toward Nizamuddin Flyover roundabout", dist: "1.2 km" },
          { text: "Merge onto Lodhi Road and pull over at main visitor gate", dist: "600m" }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      
      {/* Header bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center gap-3 z-30 border-b border-outline-variant/30">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-sans font-bold text-sm text-primary">Directions &amp; Route</h1>
          <p className="font-sans text-[10px] text-on-surface-variant font-medium">From {origin.title} to {destination.title}</p>
        </div>
      </div>

      {/* Mini Mock Map Header */}
      <div className="h-[200px] w-full bg-primary-container relative overflow-hidden shrink-0 border-b border-outline-variant/20">
        {/* Simple stylized SVG for route direction paths */}
        <div className="absolute inset-0 bg-[#f3f4f5]">
          <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-60">
            <path d="M 50,150 Q 150,50 350,100" stroke="#757780" strokeWidth="6" strokeLinecap="round" strokeDasharray="5 5" fill="none" />
            <path d="M 50,150 Q 150,50 350,100" stroke="#974730" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        
        {/* Nodes pins labels */}
        <div className="absolute left-[50px] top-[140px] flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-on-primary">A</span>
          </div>
          <span className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-primary mt-1 border shadow-sm">
            {origin.title.split(' ')[0]}
          </span>
        </div>

        <div className="absolute left-[330px] top-[90px] flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-secondary border-2 border-white flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-on-secondary">B</span>
          </div>
          <span className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-secondary mt-1 border shadow-sm">
            {destination.title.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Main Core Transit details card grid */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Horizontal transport switcher buttons */}
        <div className="grid grid-cols-4 gap-2">
          {transportModes.map((mode) => {
            const isSelected = activeTransport === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveTransport(mode.id)}
                className={`py-3 px-1 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm text-center ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-outline-variant/30 bg-white text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {mode.icon === 'rickshaw' ? 'airport_shuttle' : mode.icon}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Mode Summary Row */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-outline">Estimated Travel Time</span>
            <h3 className="font-display text-2xl font-bold text-primary mt-0.5">{currentMode.time}</h3>
            <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">Distance: {currentMode.dist} • Cost: {currentMode.cost}</p>
          </div>
          <span className="material-symbols-outlined text-4xl text-primary/10">directions_run</span>
        </div>

        {/* Step-by-Step Guidance List */}
        <div className="space-y-4">
          <h3 className="font-sans font-bold text-sm text-primary uppercase tracking-wider">Navigation Instructions</h3>
          
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40">
            {getRouteSteps(activeTransport).map((step, idx) => {
              return (
                <div key={idx} className="relative pl-9 flex gap-3 justify-between items-start">
                  
                  {/* Step node bullet */}
                  <div className="absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-container border border-primary z-10"></div>
                  
                  <div className="flex-grow">
                    <p className="font-sans text-xs text-on-surface leading-normal">{step.text}</p>
                  </div>
                  
                  <span className="text-[10px] font-bold text-outline shrink-0 pt-0.5">{step.dist}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
