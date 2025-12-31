
import React, { useState } from 'react';
import { Script } from '../types';
import Button from './Button';

interface ScriptEditorProps {
  script?: Script;
  onSave: (script: Partial<Script>) => void;
  onCancel: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, onSave, onCancel }) => {
  const [title, setTitle] = useState(script?.title || '');
  const [content, setContent] = useState(script?.content || '');

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black tracking-tighter uppercase">
          {script ? 'Edit Script' : 'New Script'}
        </h2>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Title / Interview Question
          </label>
          <input
            type="text"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., Tell me about yourself"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-zinc-500 uppercase tracking-widest">
              The Script
            </label>
          </div>
          <textarea
            className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Write your script here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button size="lg" className="px-10" onClick={() => onSave({ title, content })}>
            Save Script
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
