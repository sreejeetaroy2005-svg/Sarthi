import React, { useState, useEffect, useRef } from 'react';

export default function LiveGuideView({ monument, onClose }) {
  const [stream, setStream] = useState(null);
  const [aiSpeechResponse, setAiSpeechResponse] = useState("Looking at the main dome... Built in 1572 under Haji Begum's patronage. Ask me anything about this view!");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(null);

  const videoRef = useRef(null);

  // Quick questions prompts
  const questions = [
    { q: "Why is it built of red sandstone?", a: "The red sandstone was sourced from Rajasthan, symbolizing imperial grandeur and power, contrasted with white marble representing spiritual purity." },
    { q: "Where is the main entrance?", a: "The main entrance is the West Gate where you entered. There is also a South Gate, which was traditionally reserved for the royal family." },
    { q: "Who is buried in the main chamber?", a: "The central chamber houses the cenotaph of Emperor Humayun. The surrounding chambers contain graves of his wives and later Mughal princes." },
    { q: "How does it connect to the Taj Mahal?", a: "It is the direct architectural prototype of the Taj Mahal. The double-dome and Charbagh gardens were scaled up 60 years later by Shah Jahan." }
  ];

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
        .catch((err) => {
          console.log("Camera access blocked / environment not available. Falling back to camera simulation.");
        });
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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">
      
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

        <div className="flex items-center gap-1.5 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-bold tracking-wider animate-pulse">
          <span className="material-symbols-outlined text-[12px] font-bold">center_focus_strong</span>
          <span>AR SCANNING ACTIVE</span>
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
          /* Custom simulated heritage AR feed with overlay graphics and background imagery */
          <div className="w-full h-full relative overflow-hidden bg-zinc-900 flex items-center justify-center">
            <img 
              src={monument?.heroImage || "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop"} 
              alt="Simulated Heritage site view" 
              className="w-full h-full object-cover blur-[1px] opacity-75"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        )}

        {/* Spatial Bounding Pointers drawn in AR HUD */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          
          {/* Central reticle viewfinder crosshair */}
          <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
            <div className="absolute -top-3 w-0.5 h-2 bg-white/40"></div>
            <div className="absolute -bottom-3 w-0.5 h-2 bg-white/40"></div>
            <div className="absolute -left-3 w-2 h-0.5 bg-white/40"></div>
            <div className="absolute -right-3 w-2 h-0.5 bg-white/40"></div>
          </div>

          {/* Floating Spatial Label 1: Main Dome */}
          <div className="absolute top-[35%] left-[25%] bg-primary/80 backdrop-blur-md text-white border border-primary-container px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg transform -translate-x-1/2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <div className="text-[10px]">
              <p className="font-bold">Main Mausoleum Dome</p>
              <p className="opacity-70 text-[8px]">Distance: 85m • Double Dome structure</p>
            </div>
          </div>

          {/* Floating Spatial Label 2: Barber's Tomb */}
          <div className="absolute top-[55%] right-[20%] bg-primary/80 backdrop-blur-md text-white border border-primary-container px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg transform translate-x-1/2">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
            <div className="text-[10px]">
              <p className="font-bold">Barber's Tomb (Nila Gumbad)</p>
              <p className="opacity-70 text-[8px]">Distance: 320m • Blue glazed tiles</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom overlay: Voice responses & quick queries */}
      <div className="z-30 bg-zinc-950/95 border-t border-zinc-800 p-5 space-y-4 shrink-0 pb-safe">
        
        {/* Active Speech bubble response */}
        <div className="flex gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
            isSpeaking ? 'bg-secondary text-on-secondary animate-bounce' : 'bg-zinc-800 text-zinc-400'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isSpeaking ? 'settings_voice' : 'smart_toy'}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">AI Concierge Response</span>
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
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
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
