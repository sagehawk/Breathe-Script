
import React, { useState, useMemo, useEffect } from 'react';
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

  const [blackedOutCount, setBlackedOutCount] = useState(0);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);
  
  const totalWords = wordIndices.length;

  useEffect(() => {
    if (peekIndex !== null) {
      const timer = setTimeout(() => {
        setPeekIndex(null);
      }, 600); // 0.6s peek duration
      return () => clearTimeout(timer);
    }
  }, [peekIndex]);

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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-900 p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onExit}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            Exit
          </Button>
          <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-400">
            {script.title}
          </h1>
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
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="lg" onClick={prevStep} disabled={blackedOutCount === 0}>
                Step Back
            </Button>
            <Button variant="ghost" size="lg" onClick={reset}>
                Reset
            </Button>
          </div>
          
          <div className="text-center sm:text-left">
            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Current Round</p>
            <p className="text-2xl font-black text-white">{blackedOutCount} / {totalWords}</p>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full sm:w-auto px-16 py-6 text-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105"
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
