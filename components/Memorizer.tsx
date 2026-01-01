import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Script } from '../types';
import Button from './Button';

interface MemorizerProps {
  script: Script;
  onExit: () => void;
  onSave: (script: Partial<Script>) => void;
}

// Helper to format initial content into HTML list if it's plain text
const formatInitialContent = (content?: string) => {
  if (!content || !content.trim()) return '<ul><li><br></li></ul>';
  // If it already looks like HTML (has list tags), return as is
  if (content.includes('<ul>') || content.includes('<ol>') || content.includes('<li>')) {
    return content;
  }
  // Convert plain text newlines to list items
  const listItems = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<li>${line}</li>`)
    .join('');
  return `<ul>${listItems || '<li><br></li>'}</ul>`;
};

const ToolbarButton: React.FC<{ 
  cmd: string; 
  label: React.ReactNode; 
  title: string;
}> = ({ cmd, label, title }) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault(); // Prevent focus loss
      document.execCommand(cmd, false);
    }}
    className="px-3 py-1.5 min-w-[32px] rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
    title={title}
  >
    {label}
  </button>
);

const Memorizer: React.FC<MemorizerProps> = ({ script, onExit, onSave }) => {
  // Modes: 'script' (Blackout) or 'bullets' (Cues)
  const [mode, setMode] = useState<'script' | 'bullets'>('script');
  
  // Initialize bullets with formatting
  const [bulletsHtml, setBulletsHtml] = useState(() => formatInitialContent(script.bullets));

  // --- Script Mode Logic ---
  const words = useMemo(() => {
    return script.content.split(/(\s+)/);
  }, [script.content]);

  const wordIndices = useMemo(() => {
    return words
      .map((w, idx) => (/\S/.test(w) ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [words]);

  const totalWords = wordIndices.length;
  const [blackedOutCount, setBlackedOutCount] = useState(0);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);

  // --- Timer State ---
  const [isTiming, setIsTiming] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number>(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // Auto-save bullets
  useEffect(() => {
    if (bulletsHtml !== script.bullets) {
       const timer = setTimeout(() => {
         // If html is empty or just empty list, save empty string? 
         // Keeping it as HTML is safer for persistence.
         onSave({ ...script, bullets: bulletsHtml });
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [bulletsHtml, script, onSave]);

  useEffect(() => {
    if (peekIndex !== null) {
      const timer = setTimeout(() => {
        setPeekIndex(null);
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [peekIndex]);

  useEffect(() => {
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // Sync contentEditable on mode switch
  useEffect(() => {
    if (mode === 'bullets' && editorRef.current) {
        if (editorRef.current.innerHTML !== bulletsHtml) {
            editorRef.current.innerHTML = bulletsHtml;
        }
    }
  }, [mode]);

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

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
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
          
          {/* Mode Switcher */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
             <button 
                onClick={() => setMode('script')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${mode === 'script' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                Script
             </button>
             <button 
                onClick={() => setMode('bullets')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${mode === 'bullets' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
                Bullets
             </button>
          </div>
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

        <div className={`flex items-center space-x-6 transition-opacity duration-300 ${mode === 'bullets' ? 'opacity-30' : 'opacity-100'}`}>
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
      <main className="flex-grow flex flex-col items-center justify-start overflow-y-auto">
        
        {mode === 'script' ? (
             // --- Script Mode Content ---
            <div className="max-w-4xl w-full p-8 md:p-16">
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
        ) : (
             // --- Bullet Mode Content ---
            <div className="max-w-4xl w-full h-full p-8 md:p-16 flex flex-col items-center">
                
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-6 bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    <ToolbarButton cmd="bold" label="B" title="Bold" />
                    <ToolbarButton cmd="italic" label="I" title="Italic" />
                    <ToolbarButton cmd="underline" label="U" title="Underline" />
                    <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2">
                        Type to bullet • Tab to indent
                    </span>
                </div>

                <div className="relative w-full flex-grow flex flex-col">
                    <div 
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => setBulletsHtml(e.currentTarget.innerHTML)}
                        onKeyDown={handleEditorKeyDown}
                        className="w-full flex-grow bg-zinc-900/30 text-zinc-200 text-xl font-mono p-8 rounded-2xl border border-zinc-800/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:bg-zinc-900/50 transition-all overflow-y-auto 
                        [&_ul]:list-disc [&_ul]:pl-6 
                        [&_ol]:list-decimal [&_ol]:pl-6 
                        [&_ul_ul]:list-[circle] [&_ul_ul]:mt-1
                        [&_ul_ul_ul]:list-[square]
                        [&_li]:mb-2 [&_li]:pl-1
                        [&_b]:text-blue-400 [&_b]:font-bold
                        [&_i]:text-purple-300 [&_i]:italic
                        [&_u]:underline [&_u]:decoration-zinc-500 [&_u]:underline-offset-4"
                    />
                    
                    {/* Placeholder hint if empty */}
                    {!bulletsHtml.replace(/<[^>]*>/g, '').trim() && (
                        <div className="absolute top-8 left-14 text-zinc-700 pointer-events-none text-xl font-mono italic">
                            Start typing your cues...
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>

      {/* Bottom Controls (Only show for script mode) */}
      <footer className={`border-t border-zinc-900 p-8 sticky bottom-0 bg-black/80 backdrop-blur-md transition-transform duration-300 ${mode === 'bullets' ? 'translate-y-full absolute' : ''}`}>
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