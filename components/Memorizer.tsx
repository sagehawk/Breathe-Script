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
    } else {
      // Start
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
        desc: "Trust goes down.", 
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    };
    if (wpm > 185) return { 
        label: "TOO FAST", 
        desc: "Trust goes down.", 
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20"
    };
    return { 
        label: "SWEET SPOT", 
        desc: "High authority.", 
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

        {/* Timer Control & Stats */}
        <div className="flex flex-col md:flex-row items-center gap-3 justify-center order-last md:order-none w-full md:w-auto mt-2 md:mt-0">
            {!isTiming && elapsed > 0 && (
                <div className={`flex items-center gap-3 px-4 py-1.5 rounded-lg border ${feedback.bg} ${feedback.border} animate-in fade-in slide-in-from-top-2`}>
                    <div className="text-right">
                        <div className={`text-xl font-black leading-none ${feedback.color}`}>{wpm}</div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">WPM</div>
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-tight ${feedback.color}`}>{feedback.label}</span>
                        <span className="text-[9px] text-zinc-400 leading-tight">Target: 135-185</span>
                    </div>
                </div>
            )}
            
            <button 
                onClick={toggleTimer}
                className={`flex items-center space-x-3 px-5 py-2 rounded-full font-mono transition-all border ${
                    isTiming 
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
            >
                {isTiming ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-bold">{formatTime(elapsed)}</span>
                        <span className="text-xs font-sans font-bold uppercase tracking-wider ml-1">Stop</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-sans font-bold uppercase tracking-wider">
                            {elapsed > 0 ? "Start Again" : "Start Timer"}
                        </span>
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