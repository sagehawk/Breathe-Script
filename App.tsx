
import React, { useState, useEffect } from 'react';
import { Script, ViewState } from './types';
import ScriptEditor from './components/ScriptEditor';
import Memorizer from './components/Memorizer';
import ScriptCard from './components/ScriptCard';
import Button from './components/Button';

const STORAGE_KEY = 'breathe_scripts';

const App: React.FC = () => {
  // Lazy initialization: Read from storage synchronously on first render
  const [scripts, setScripts] = useState<Script[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse stored scripts", e);
      return [];
    }
  });

  const [view, setView] = useState<ViewState>('list');
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);

  // Save scripts whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }, [scripts]);

  const handleCreateNew = () => {
    setActiveScriptId(null);
    setView('edit');
  };

  const handleEdit = (id: string) => {
    setActiveScriptId(id);
    setView('edit');
  };

  const handleMemorize = (id: string) => {
    setActiveScriptId(id);
    setView('memorize');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      setScripts(scripts.filter(s => s.id !== id));
    }
  };

  const handleSave = (scriptData: Partial<Script>) => {
    if (activeScriptId) {
      setScripts(scripts.map(s => s.id === activeScriptId ? { ...s, ...scriptData } : s));
    } else {
      const newScript: Script = {
        id: Math.random().toString(36).substr(2, 9),
        title: scriptData.title || 'Untitled Script',
        content: scriptData.content || '',
        bullets: scriptData.bullets || '',
        createdAt: Date.now(),
      };
      setScripts([newScript, ...scripts]);
    }
    // Only switch view if we are not just auto-saving from Memorizer
    if (view === 'edit') {
        setView('list');
    }
  };

  const activeScript = scripts.find(s => s.id === activeScriptId);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600/30 selection:text-blue-200">
      {view === 'list' && (
        <div className="max-w-6xl mx-auto py-16 px-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h1 className="text-6xl font-black tracking-tighter uppercase mb-2 italic">Breathe</h1>
              <p className="text-zinc-500 font-medium tracking-wide">THE HORMΟZI SCRIPT MEMORIZER</p>
            </div>
            <Button size="lg" className="px-10" onClick={handleCreateNew}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Script
            </Button>
          </header>

          {scripts.length === 0 ? (
            <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-3xl p-20 text-center">
              <div className="mb-6 inline-block bg-zinc-900 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">No scripts yet</h2>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                Ready to crush your next interview? Create your first script and start blacking out words.
              </p>
              <Button size="lg" onClick={handleCreateNew}>Create Your First Script</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scripts.map(s => (
                <ScriptCard 
                  key={s.id} 
                  script={s} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete}
                  onMemorize={handleMemorize}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'edit' && (
        <ScriptEditor 
          script={activeScript} 
          onSave={handleSave} 
          onCancel={() => setView('list')} 
        />
      )}

      {view === 'memorize' && activeScript && (
        <Memorizer 
          script={activeScript} 
          onExit={() => setView('list')}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default App;