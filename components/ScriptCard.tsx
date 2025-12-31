
import React from 'react';
import { Script } from '../types';
import Button from './Button';

interface ScriptCardProps {
  script: Script;
  onMemorize: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onMemorize, onEdit, onDelete }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {script.title || "Untitled Script"}
          </h3>
          <p className="text-zinc-500 text-xs mt-1">
            Created {new Date(script.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onEdit(script.id)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(script.id)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
      <p className="text-zinc-400 text-sm line-clamp-3 mb-6 font-mono leading-relaxed">
        {script.content}
      </p>
      <Button className="w-full" onClick={() => onMemorize(script.id)}>
        Breathe this Script
      </Button>
    </div>
  );
};

export default ScriptCard;
