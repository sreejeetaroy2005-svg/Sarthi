import { useT } from "../i18n/index";
import React, { useState } from 'react';
import { MONUMENTS } from '../data/monuments';
export default function SavedTripsView({
  savedMonuments = [],
  onRemoveBookmark,
  onSelectMonument,
  onImportItinerary,
  onShowToast
}) {
  const t = useT();
  const [activeSubTab, setActiveSubTab] = useState('places');
  const [copiedItineraryId, setCopiedItineraryId] = useState(null);

  // Static pre-curated cultural routes / itineraries mapped to real monument IDs
  const culturalItineraries = [{
    id: 'delhi-mughal',
    title: "Mughal Architecture Tour",
    stopIds: ['humayun-tomb', 'red-fort', 'safdarjung-tomb'],
    stops: "Humayun's Tomb -> Red Fort -> Safdarjung Tomb",
    duration: "1 Day (6 Hours)",
    difficulty: "Moderate Walking",
    desc: "Deep-dive into the architectural lineage of double domes and Charbagh gardens.",
    image: "https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?q=80&w=600&auto=format&fit=crop"
  }, {
    id: 'delhi-spiritual',
    title: "Delhi Spiritual & Peace Trail",
    stopIds: ['lotus-temple', 'akshardham-temple', 'nizamuddin-dargah'],
    stops: "Lotus Temple -> Akshardham -> Nizamuddin Dargah",
    duration: "1 Day (8 Hours)",
    difficulty: "Leisurely Pace",
    desc: "Experience ancient ritual chants, silent meditation halls, and qawwali music.",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=600&auto=format&fit=crop"
  }, {
    id: 'delhi-food',
    title: "Old Delhi Heritage Food Trail",
    stopIds: ['red-fort', 'humayun-tomb'],
    stops: "Chandni Chowk -> Karim's -> Paranthe Wali Gali",
    duration: "Half-Day (4 Hours)",
    difficulty: "Dense Crowd Navigation",
    desc: "Traces food recipes preserved since Shah Jahan's royal kitchen reigns.",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=600&auto=format&fit=crop"
  }];
  const handleShareItinerary = async itinerary => {
    const text = `${itinerary.title} (${itinerary.duration}): ${itinerary.desc}\nStops: ${itinerary.stops}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary.title,
          text,
          url: window.location.href
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // fallback
        }
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItineraryId(itinerary.id);
      if (onShowToast) onShowToast('Itinerary details copied to clipboard!', 'content_copy');
      setTimeout(() => setCopiedItineraryId(null), 2500);
    } catch {
      if (onShowToast) onShowToast('Could not share itinerary', 'error');
    }
  };
  const handleImport = itinerary => {
    if (onImportItinerary) {
      onImportItinerary(itinerary);
    }
  };
  return <div className="min-h-screen bg-background pb-28 pt-4 px-4 max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Title */}
      <div>
        <h1 className="font-display text-3xl font-black text-primary">{t("text|Your Saved Trips")}</h1>
        <p className="font-sans text-xs text-on-surface-variant mt-0.5">{t("text|Bookmarks, custom walks, and curated heritage tours")}</p>
      </div>

      {/* Sub Tabs Toggle bar */}
      <div className="flex border-b border-outline-variant/30">
        <button onClick={() => setActiveSubTab('places')} className={`py-3 px-5 text-sm font-bold capitalize transition-all border-b-2 -mb-0.5 ${activeSubTab === 'places' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>{t("text|Saved Places (")}{savedMonuments.length})
        </button>
        
        <button onClick={() => setActiveSubTab('itineraries')} className={`py-3 px-5 text-sm font-bold capitalize transition-all border-b-2 -mb-0.5 ${activeSubTab === 'itineraries' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}>{t("text|Curated Walks (")}{culturalItineraries.length})
        </button>
      </div>

      {/* Sub-tab view layouts */}
      <div className="space-y-4">
        {activeSubTab === 'places' && (savedMonuments.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedMonuments.map(place => <div key={place.id} className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-ambient-card hover:border-primary/20 transition-all flex flex-col justify-between">
                  <div onClick={() => onSelectMonument(place)} className="h-40 w-full relative overflow-hidden bg-surface-container cursor-pointer group">
                    <img src={place.image} alt={place.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 left-2 bg-primary/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase">
                      {place.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="cursor-pointer" onClick={() => onSelectMonument(place)}>
                      <h3 className="font-sans font-bold text-sm text-primary line-clamp-1 hover:underline">{place.title}</h3>
                      <p className="font-sans text-[11px] text-on-surface-variant line-clamp-1 italic">{place.subtitle}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-500" style={{
                  fontVariationSettings: "'FILL' 1"
                }}>star</span>
                        <span className="text-xs font-bold text-on-surface">{place.rating}</span>
                      </div>
                      
                      <button onClick={() => {
                onRemoveBookmark(place.id);
                if (onShowToast) onShowToast(`Removed ${place.title} from Saved`, 'bookmark_remove');
              }} className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5 p-1 rounded hover:bg-red-50 transition-colors" title={t("text|Remove bookmark")}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>{t("text|Remove")}</span>
                      </button>
                    </div>
                  </div>
                </div>)}
            </div> : <div className="text-center py-20 bg-white border border-outline-variant/30 rounded-3xl space-y-4">
              <span className="material-symbols-outlined text-outline text-5xl">bookmark_border</span>
              <h3 className="font-sans font-bold text-on-surface text-base">{t("text|No saved monuments yet")}</h3>
              <p className="font-sans text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">{t("text|Click the bookmark icon on any monument card in the Explore or Detail view to save it here.")}</p>
            </div>)}

        {activeSubTab === 'itineraries' && <div className="space-y-4">
            {culturalItineraries.map(itinerary => <div key={itinerary.id} className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-ambient-card hover:border-primary/20 transition-all flex flex-col md:flex-row">
                {/* Visual Thumbnail image */}
                <div className="h-44 md:h-auto md:w-48 relative overflow-hidden bg-surface-container shrink-0">
                  <img src={itinerary.image} alt={itinerary.title} className="w-full h-full object-cover" />
                </div>

                {/* Details layout panel */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold text-secondary tracking-widest">{itinerary.duration}</span>
                      <span className="text-[9px] font-bold text-outline bg-surface px-2 py-0.5 rounded border border-outline-variant/30">{itinerary.difficulty}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-primary">{itinerary.title}</h3>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {itinerary.desc}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-fixed/30 border border-primary-fixed/50 px-3 py-1.5 rounded-lg w-fit">
                      <span className="material-symbols-outlined text-xs">route</span>
                      <span>{t("text|Stops:")}{itinerary.stops}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleImport(itinerary)} className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 transform active:scale-95">
                      <span className="material-symbols-outlined text-sm">add_task</span>
                      <span>{t("text|Import Route to Day Plan")}</span>
                    </button>
                    
                    <button onClick={() => handleShareItinerary(itinerary)} className={`p-2.5 border rounded-xl transition-all flex items-center justify-center transform active:scale-95 ${copiedItineraryId === itinerary.id ? 'bg-green-50 text-green-700 border-green-300' : 'border-outline-variant/60 hover:bg-surface-container-low text-primary'}`} title={t("text|Share Itinerary")}>
                      <span className="material-symbols-outlined text-sm">
                        {copiedItineraryId === itinerary.id ? 'check' : 'share'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>

    </div>;
}
