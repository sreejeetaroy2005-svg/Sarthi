import React, { useState } from 'react';

export default function LandmarkDetailView({ 
  monument, 
  onBack, 
  onOpenAudioGuide, 
  onOpenLiveGuide, 
  onAddToDayPlan, 
  onOpenStory,
  isBookmarked = false,
  onToggleBookmark,
  isInDayPlan = false,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!monument) return null;

  const handleShare = async () => {
    const shareData = {
      title: `${monument.title} - Sarthi Cultural Guide`,
      text: `${monument.title}: ${monument.subtitle}. Explore with Sarthi smart travel guide!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to clipboard
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      setCopiedShare(true);
      if (onShowToast) onShowToast('Link copied to clipboard!', 'content_copy');
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      if (onShowToast) onShowToast('Unable to share in this browser', 'error');
    }
  };

  const handleBookmarkClick = () => {
    if (onToggleBookmark) {
      onToggleBookmark(monument);
      if (onShowToast) {
        onShowToast(
          isBookmarked ? `Removed ${monument.title} from Saved` : `Saved ${monument.title} to Bookmarks`,
          isBookmarked ? 'bookmark_remove' : 'bookmark_added'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 relative animate-fade-in">
      
      {/* Hero Header Area */}
      <div className="h-[280px] md:h-[400px] w-full relative overflow-hidden bg-primary-container shrink-0">
        <img 
          src={monument.heroImage || monument.image} 
          alt={monument.title} 
          className="w-full h-full object-cover"
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75"></div>

        {/* Back navigation button */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/35 transition-all shadow-md flex items-center justify-center transform active:scale-95"
          title="Back"
        >
          <span className="material-symbols-outlined font-bold text-white">arrow_back</span>
        </button>

        {/* Share & Bookmark overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            className={`p-3 backdrop-blur-md rounded-full transition-all shadow-md flex items-center justify-center transform active:scale-95 ${
              copiedShare ? 'bg-green-600 text-white' : 'bg-white/20 hover:bg-white/35 text-white'
            }`}
            title="Share Landmark"
          >
            <span className="material-symbols-outlined text-white">
              {copiedShare ? 'check' : 'share'}
            </span>
          </button>
          
          <button 
            onClick={handleBookmarkClick}
            className={`p-3 backdrop-blur-md rounded-full transition-all shadow-md flex items-center justify-center transform active:scale-95 ${
              isBookmarked 
                ? 'bg-secondary text-on-secondary shadow-lg' 
                : 'bg-white/20 hover:bg-white/35 text-white'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Monument'}
          >
            <span 
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isBookmarked ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>

        {/* Landmark Title overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {monument.unescoStatus && (
              <span className="bg-secondary text-on-secondary font-sans text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md">
                UNESCO World Heritage
              </span>
            )}
            <span className="bg-primary/50 backdrop-blur-md text-on-primary font-sans text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
              {monument.category}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            {monument.title}
          </h1>
          <p className="font-sans text-sm md:text-base text-on-primary-container italic mt-1 font-light opacity-90">
            {monument.subtitle}
          </p>
        </div>
      </div>

      {/* Floating Info Stats Panel */}
      <div className="max-w-4xl mx-auto w-full px-4 -mt-8 z-20">
        <div className="bg-white rounded-2xl shadow-ambient-elevated border border-outline-variant/30 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="border-r border-outline-variant/30 last:border-none pr-2">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Built Period</span>
            <p className="font-sans text-sm font-bold text-primary mt-0.5">{monument.builtYear || 'Ancient'}</p>
          </div>
          <div className="sm:border-r border-outline-variant/30 last:border-none px-2">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Avg Duration</span>
            <p className="font-sans text-sm font-bold text-primary mt-0.5">{monument.avgTimeSpent}</p>
          </div>
          <div className="border-r border-outline-variant/30 last:border-none px-2">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Best Time</span>
            <p className="font-sans text-xs font-bold text-primary mt-1 line-clamp-1">{monument.bestTimeToVisit.split('(')[0]}</p>
          </div>
          <div className="last:border-none pl-2">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider">User Score</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-sm font-bold text-primary">{monument.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Main Contents Grid */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Overview and narrative */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onOpenAudioGuide(monument)}
              className="flex-grow bg-primary hover:bg-primary-container text-on-primary font-sans font-bold py-4 px-6 rounded-2xl shadow-md transform active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">headphones</span>
              <span>Start Audio Guide</span>
            </button>
            
            <button
              onClick={() => onOpenLiveGuide(monument)}
              className="flex-grow bg-secondary hover:bg-secondary-container text-on-secondary font-sans font-bold py-4 px-6 rounded-2xl shadow-md transform active:scale-95 transition-all flex items-center justify-center gap-2 border border-secondary"
            >
              <span className="material-symbols-outlined">center_focus_strong</span>
              <span>Activate Live AR Guide</span>
            </button>
          </div>

          {/* Navigation tab bar */}
          <div className="border-b border-outline-variant/30 flex">
            {['overview', 'highlights', 'practical'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-5 text-sm font-bold capitalize transition-all border-b-2 -mb-0.5 ${
                  activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="space-y-4 font-sans text-sm text-on-surface-variant leading-relaxed">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <p className="text-base text-on-surface font-light">{monument.overview}</p>
                
                {/* Historical Fact Callout card */}
                {monument.storyContent && (
                  <div className="p-5 rounded-2xl bg-primary-fixed/30 border border-primary-fixed flex flex-col gap-3">
                    <h4 className="font-display text-lg font-bold text-primary">The Historical Narrative</h4>
                    <p className="text-xs text-on-primary-fixed-variant leading-relaxed line-clamp-3">
                      {monument.storyContent.intro} {monument.storyContent.bodyParagraphs[0]}
                    </p>
                    <button 
                      onClick={() => onOpenStory(monument)}
                      className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 mt-1 self-start group"
                    >
                      <span>Read Full Editorial Story</span>
                      <span className="material-symbols-outlined text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="space-y-3">
                <h3 className="font-display text-lg font-bold text-primary mb-2">Must-See Spot Highlights</h3>
                <ul className="space-y-2.5">
                  {monument.keyHighlights.map((hl, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="material-symbols-outlined text-green-600 text-base mt-0.5">check_circle</span>
                      <span className="text-on-surface text-sm font-medium">{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'practical' && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-outline-variant/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-outline">Opening Hours</span>
                    <p className="text-sm text-on-surface font-semibold mt-0.5">{monument.openingHours}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-outline">Entry Fee Details</span>
                    <p className="text-xs text-on-surface font-semibold mt-0.5 leading-snug">{monument.entryFee}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-outline">Patron &amp; Dynasty</span>
                    <p className="text-sm text-on-surface font-semibold mt-0.5">{monument.patron || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-outline">Architect / Design</span>
                    <p className="text-sm text-on-surface font-semibold mt-0.5">{monument.architect || 'Vedic Guilds'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Travel companion, itinerary addition & dining details */}
        <div className="space-y-5">
          
          {/* Day plan addition panel */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">event_available</span>
              <h3 className="font-sans font-bold text-primary text-base">Plan this stop</h3>
            </div>
            
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              Add this monument to your Day Plan to auto-schedule travel routes, calculate metro connection steps, and optimize timings.
            </p>
            
            <button
              onClick={() => onAddToDayPlan(monument)}
              className={`w-full font-sans font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-98 border ${
                isInDayPlan
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-surface hover:bg-surface-container border-outline-variant/60 text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {isInDayPlan ? 'check_circle' : 'add'}
              </span>
              <span>{isInDayPlan ? 'In Your Day Plan ✓' : 'Add to Day Plan'}</span>
            </button>
          </div>

          {/* Dining Section nearby */}
          {monument.nearbyDining && monument.nearbyDining.length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-xl">restaurant</span>
                <h3 className="font-sans font-bold text-primary text-base">Culinary Stops Nearby</h3>
              </div>
              
              <div className="space-y-3">
                {monument.nearbyDining.map((dining, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-outline-variant/20 last:border-none pb-2 last:pb-0">
                    <div>
                      <h4 className="font-sans font-bold text-xs text-on-surface leading-tight">{dining.name}</h4>
                      <p className="font-sans text-[10px] text-on-surface-variant mt-0.5">{dining.cuisine} • {dining.distance}</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <span className="material-symbols-outlined text-[10px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[10px] font-bold text-amber-900">{dining.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
