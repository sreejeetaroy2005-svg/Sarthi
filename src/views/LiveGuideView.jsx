import React, { useState, useEffect, useRef } from 'react';

export default function LiveGuideView({ monument, onClose, onShowToast }) {
  const [stream, setStream] = useState(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [aiSpeechResponse, setAiSpeechResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(null);
  const [capturedFlash, setCapturedFlash] = useState(false);

  const videoRef = useRef(null);

  // Generate dynamic questions tailored to the active monument
  const getDynamicQuestions = (m) => {
    if (!m) return [];

    const specificQuestions = {
      'humayun-tomb': [
        { q: "Why is it built of red sandstone?", a: "The red sandstone was sourced from Rajasthan, symbolizing imperial grandeur and power, contrasted with white marble representing spiritual purity." },
        { q: "Where is the main entrance?", a: "The main entrance is the West Gate where you entered. There is also a South Gate, which was traditionally reserved for the royal family." },
        { q: "Who is buried in the main chamber?", a: "The central chamber houses the cenotaph of Emperor Humayun. The surrounding chambers contain graves of his wives and later Mughal princes." },
        { q: "How does it connect to the Taj Mahal?", a: "It is the direct architectural prototype of the Taj Mahal. The double-dome and Charbagh gardens were scaled up 60 years later by Shah Jahan." }
      ],
      'qutub-minar': [
        { q: "How tall is the tower?", a: "Qutub Minar stands at 72.5 meters tall with 379 steps, making it the tallest brick minaret in the world." },
        { q: "What is the Iron Pillar nearby?", a: "The 1600-year-old Gupta period Iron Pillar is famous for its rust-resistant metallurgy, baffling modern scientists." },
        { q: "Who commissioned the construction?", a: "Qutb-ud-din Aibak started construction in 1199 AD, and it was completed by his successor Iltutmish." }
      ],
      'red-fort': [
        { q: "What is the Diwan-i-Khas?", a: "The Hall of Private Audiences once housed the legendary Peacock Throne and is engraved with 'If there is a paradise on earth, it is this'." },
        { q: "Why is it called Red Fort?", a: "Because of its massive red sandstone enclosing walls that stretch over 2.4 kilometers in Old Delhi." },
        { q: "When was it built?", a: "Constructed by Mughal Emperor Shah Jahan between 1638 and 1648 when he moved his capital from Agra to Delhi." }
      ],
      'lotus-temple': [
        { q: "What do the petals represent?", a: "The 27 free-standing marble petals form 9 sides, symbolizing unity and openness to all religions in the Baháʼí Faith." },
        { q: "Can anyone enter to meditate?", a: "Yes, the Lotus Temple is open to all regardless of religion or background, with silence maintained inside for prayer." },
        { q: "Who designed this structure?", a: "Iranian-Canadian architect Fariborz Sahba designed it, opening to the public in December 1986." }
      ]
    };

    if (m.id && specificQuestions[m.id]) {
      return specificQuestions[m.id];
    }

    // Dynamic fallback questions from monument properties
    return [
      { 
        q: `What is the significance of ${m.title}?`, 
        a: `${m.title} is a ${m.category} landmark built around ${m.builtYear || 'ancient times'} under ${m.patron || 'royal patronage'}. ${m.overview ? m.overview.split('.')[0] + '.' : ''}` 
      },
      { 
        q: "What architectural style is this?", 
        a: `Designed by ${m.architect || 'master guilds'}, it reflects signature elements of ${m.category} design with intricate stonework and spatial proportions.` 
      },
      { 
        q: "What are the must-see highlights?", 
        a: m.keyHighlights && m.keyHighlights.length > 0 ? m.keyHighlights.join('. ') : 'Explore the central plinth, entry gateways, and perimeter courtyards.' 
      }
    ];
  };

  const questions = getDynamicQuestions(monument);

  // Set initial response on mount
  useEffect(() => {
    if (monument) {
      setAiSpeechResponse(`Scanning ${monument.title}... Built in ${monument.builtYear || 'historic times'}. Ask me anything about what's in your viewfinder!`);
    }
  }, [monument]);

  // Request camera stream
  useEffect(() => {
    let activeStream = null;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          setStream(s);
          activeStream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setCameraBlocked(true);
        });
    } else {
      setCameraBlocked(true);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAskQuestion = (idx) => {
    setActiveQuestionIdx(idx);
    const qObject = questions[idx];
    setAiSpeechResponse(qObject.a);
    
    // Synthesize speech output
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(qObject.a);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveQuestionIdx(null);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleCaptureSnapshot = () => {
    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 300);
    if (onShowToast) onShowToast('AR snapshot saved to gallery', 'photo_camera');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">
      
      {/* Flash effect on snapshot capture */}
      {capturedFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-fade-in pointer-events-none"></div>
      )}

      {/* Top HUD status overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              if (stream) stream.getTracks().forEach(track => track.stop());
              onClose();
            }}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Back"
          >
            <span className="material-symbols-outlined font-bold">arrow_back</span>
          </button>
          <div>
            <h2 className="font-sans font-bold text-sm">Sarthi Live AR Guide</h2>
            <p className="font-sans text-[10px] text-on-primary-container/80 tracking-wide uppercase">
              {monument?.title || "Delhi Heritage"} Mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-bold tracking-wider animate-pulse">
            <span className="material-symbols-outlined text-[12px] font-bold">center_focus_strong</span>
            <span>AR ACTIVE</span>
          </div>

          <button
            onClick={handleCaptureSnapshot}
            className="p-2 bg-white/20 hover:bg-white/35 rounded-full text-white transition-colors"
            title="Take AR Photo"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
          </button>
        </div>
      </div>

      {/* Main Camera Viewport area */}
      <div className="flex-grow w-full h-full relative bg-zinc-950 flex items-center justify-center">
        {stream ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated heritage AR feed with overlay graphics and background imagery */
          <div className="w-full h-full relative overflow-hidden bg-zinc-900 flex items-center justify-center">
            <img 
              src={monument?.heroImage || monument?.image || "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop"} 
              alt="Simulated Heritage site view" 
              className="w-full h-full object-cover blur-[1px] opacity-75"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}

        {/* Spatial Bounding Pointers drawn in AR HUD */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          
          {/* Central reticle viewfinder crosshair */}
          <div className="w-20 h-20 border-2 border-white/40 rounded-full flex items-center justify-center relative">
            <div className="w-2 h-2 bg-secondary rounded-full animate-ping"></div>
            <div className="absolute -top-3 w-0.5 h-2 bg-white/60"></div>
            <div className="absolute -bottom-3 w-0.5 h-2 bg-white/60"></div>
            <div className="absolute -left-3 w-2 h-0.5 bg-white/60"></div>
            <div className="absolute -right-3 w-2 h-0.5 bg-white/60"></div>
          </div>

          {/* Floating Spatial Label 1: Main Structure */}
          <div className="absolute top-[32%] left-[25%] bg-primary/85 backdrop-blur-md text-white border border-primary-container/60 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg transform -translate-x-1/2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <div className="text-[10px]">
              <p className="font-bold">{monument?.title || 'Main Sanctum'}</p>
              <p className="opacity-75 text-[8px]">{monument?.category || 'Heritage'} • {monument?.builtYear || 'Historical'}</p>
            </div>
          </div>

          {/* Floating Spatial Label 2: Architectural detail */}
          {monument?.keyHighlights && monument.keyHighlights[0] && (
            <div className="absolute top-[58%] right-[18%] bg-primary/85 backdrop-blur-md text-white border border-primary-container/60 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg transform translate-x-1/2">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
              <div className="text-[10px]">
                <p className="font-bold">Key Feature</p>
                <p className="opacity-75 text-[8px] line-clamp-1 max-w-[140px]">{monument.keyHighlights[0]}</p>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Bottom overlay: Voice responses & quick queries */}
      <div className="z-30 bg-zinc-950/95 border-t border-zinc-800 p-5 space-y-4 shrink-0 pb-safe">
        
        {/* Active Speech bubble response */}
        <div className="flex gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <button
            onClick={isSpeaking ? handleStopSpeaking : () => handleAskQuestion(0)}
            className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center transition-all ${
              isSpeaking ? 'bg-secondary text-on-secondary animate-bounce' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={isSpeaking ? "Stop Speaking" : "Listen"}
          >
            <span className="material-symbols-outlined text-lg">
              {isSpeaking ? 'volume_off' : 'smart_toy'}
            </span>
          </button>
          <div className="space-y-1 flex-grow">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">AI Concierge Guide</span>
              {isSpeaking && (
                <span className="text-[9px] text-secondary font-bold animate-pulse">Speaking...</span>
              )}
            </div>
            <p className="font-sans text-xs text-zinc-200 leading-relaxed italic">
              "{aiSpeechResponse}"
            </p>
          </div>
        </div>

        {/* Quick Suggestion Questions buttons list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Suggested Questions</h4>
          
          <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
            {questions.map((qObj, idx) => {
              const isAskingThis = activeQuestionIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(idx)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    isAskingThis 
                      ? 'bg-secondary text-on-secondary border-secondary shadow-md' 
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {qObj.q}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
