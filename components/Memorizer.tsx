import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Script } from '../types';
import Button from './Button';

interface MemorizerProps {
  script: Script;
  onExit: () => void;
}

const Memorizer: React.FC<MemorizerProps> = ({ script, onExit }) => {
  // Split content into words while preserving spacing and punctuation
  const words = useMemo(() => {
    // This regex splits by spaces but keeps the spaces in the result
    return script.content.split(/(\s+)/);
  }, [script.content]);

  // Actual word indices (ignoring whitespace for blacking out)
  const wordIndices = useMemo(() => {
    return words
      .map((w, idx) => (/\S/.test(w) ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [words]);

  const totalWords = wordIndices.length;

  const [blackedOutCount, setBlackedOutCount] = useState(0);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);
  
  // Timer State
  const [isTiming, setIsTiming] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number>(0);

  useEffect(() => {
    if (peekIndex !== null) {
      const timer = setTimeout(() => {
        setPeekIndex(null);
      }, 600); // 0.6s peek duration
      return () => clearTimeout(timer);
    }
  }, [peekIndex]);

  // Timer Cleanup
  useEffect(() => {
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  const toggleTimer = () => {
    if (isTiming) {
      // Stop
      clearInterval(timerIntervalRef.current);
      setIsTiming(false);
      setShowStats(true);
    } else {
      // Start
      setShowStats(false);
      setElapsed(0);
      setIsTiming(true);
      startTimeRef.current = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }
  };

  const nextStep = () => {
    if (blackedOutCount < totalWords) {
      setBlackedOutCount((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (blackedOutCount > 0) {
      setBlackedOutCount((prev) => prev - 1);
    }
  };

  const reset = () => {
    if (window.confirm("Restart from the beginning?")) {
      setBlackedOutCount(0);
    }
  };

  const isWordBlackedOut = (indexInWords: number) => {
    const actualWordIndex = wordIndices.indexOf(indexInWords);
    return actualWordIndex !== -1 && actualWordIndex < blackedOutCount;
  };

  const progressPercentage = Math.round((blackedOutCount / totalWords) * 100);

  // WPM Calculation
  const wpm = useMemo(() => {
    if (elapsed < 1) return 0;
    return Math.round(totalWords / (elapsed / 60));
  }, [elapsed, totalWords]);

  const getSpeedFeedback = (wpm: number) => {
    if (wpm < 135) return { 
        label: "TOO SLOW", 
        desc: "If you talk too slow, they think you're an idiot.", 
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    };
    if (wpm > 185) return { 
        label: "TOO FAST", 
        desc: "Trust goes down when you speak too fast.", 
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20"
    };
    return { 
        label: "SWEET SPOT", 
        desc: "High authority. Results-oriented tone.", 
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20"
    };
  };

  const feedback = getSpeedFeedback(wpm);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Stats Overlay */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`max-w-md w-full bg-zinc-900 border ${feedback.border} rounded-2xl p-8 shadow-2xl transform scale-100 transition-all`}>
                <div className="text-center">
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${feedback.color}`}>{feedback.label}</h3>
                    <div className="text-7xl font-mono font-bold text-white mb-2">
                        {wpm} <span className="text-xl text-zinc-500">WPM</span>
                    </div>
                    <p className="text-zinc-400 mb-6">{feedback.desc}</p>
                    
                    <div className="bg-zinc-950 rounded-lg p-4 mb-6 border border-zinc-800 text-left">
                         <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider mb-2">
                            <span>Time</span>
                            <span>Word Count</span>
                         </div>
                         <div className="flex justify-between font-mono text-lg">
                            <span>{formatTime(elapsed)}</span>
                            <span>{totalWords}</span>
                         </div>
                    </div>

                    <p className="text-xs text-zinc-600 italic mb-6">
                        "If you talk too fast, trust goes down. If you talk too slow, they think you're an idiot. Target 135-185 WPM." — Alex Hormozi
                    </p>

                    <Button className="w-full" size="lg" onClick={() => setShowStats(false)}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-zinc-900 p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onExit}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            Exit
          </Button>
          <div className="hidden md:block h-6 w-px bg-zinc-800"></div>
           <h1 className="hidden md:block text-sm font-bold tracking-widest uppercase text-zinc-400 max-w-[200px] truncate">
            {script.title}
          </h1>
        </div>

        {/* Timer Control */}
        <div className="flex items-center justify-center">
            <button 
                onClick={toggleTimer}
                className={`flex items-center space-x-3 px-4 py-2 rounded-full font-mono transition-all border ${
                    isTiming 
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
            >
                {isTiming ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-bold">{formatTime(elapsed)}</span>
                        <span className="text-xs font-sans font-bold uppercase tracking-wider ml-2">Stop</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-sans font-bold uppercase tracking-wider">Start Timer</span>
                    </>
                )}
            </button>
        </div>

        <div className="flex items-center space-x-6">
           <div className="hidden sm:block text-right">
             <div className="text-[10px] font-black uppercase text-zinc-600">Progress</div>
             <div className="text-sm font-mono text-zinc-300">{progressPercentage}%</div>
           </div>
           <div className="w-24 sm:w-48 bg-zinc-900 h-2 rounded-full overflow-hidden">
             <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercentage}%` }}
             />
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-8 md:p-16 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="text-2xl md:text-4xl font-semibold leading-relaxed font-mono tracking-tight text-zinc-200">
            {words.map((word, idx) => {
              const blacked = isWordBlackedOut(idx);
              const isPeeking = peekIndex === idx;

              if (/\S/.test(word)) {
                return (
                  <span 
                    key={idx} 
                    onClick={() => {
                        if (blacked) setPeekIndex(idx);
                    }}
                    className={`inline-block relative transition-all duration-300 rounded px-1 mb-1 ${
                      blacked ? 'cursor-pointer select-none' : ''
                    } ${
                      blacked && !isPeeking ? 'bg-zinc-800 text-transparent' : 
                      isPeeking ? 'bg-zinc-800 text-zinc-400' : 'text-zinc-100'
                    }`}
                  >
                    {word}
                    {blacked && !isPeeking && (
                        <span className="absolute inset-0 bg-zinc-900 rounded border border-zinc-700/50 hover:bg-zinc-800 transition-colors" />
                    )}
                  </span>
                );
              }
              return <span key={idx}>{word}</span>;
            })}
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="border-t border-zinc-900 p-8 sticky bottom-0 bg-black/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            <Button variant="secondary" size="lg" onClick={prevStep} disabled={blackedOutCount === 0}>
                Step Back
            </Button>
            <Button variant="ghost" size="lg" onClick={reset}>
                Reset
            </Button>
          </div>
          
          <div className="text-center sm:text-left order-1 sm:order-2">
            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Current Round</p>
            <p className="text-2xl font-black text-white">{blackedOutCount} / {totalWords}</p>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full sm:w-auto px-16 py-6 text-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 order-3"
            onClick={nextStep}
            disabled={blackedOutCount >= totalWords}
          >
            {blackedOutCount === totalWords ? "Script Mastered" : "Blackout Next Word"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Memorizer;