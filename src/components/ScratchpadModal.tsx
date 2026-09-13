import React, { useState } from 'react';
import {
  FileText,
  X,
  Check,
  Plus,
  Sparkles,
  CloudCheck,
  ArrowRight,
  Maximize2,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const { scratchpad, updateScratchpad, addTask, syncStatus } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [taskAddedToast, setTaskAddedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const wordCount = scratchpad.trim() ? scratchpad.trim().split(/\s+/).length : 0;
  const lineCount = scratchpad.split('\n').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(scratchpad);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert selected line or highlighted idea into a workspace task
  const extractChecklistLines = () => {
    const lines = scratchpad.split('\n');
    return lines
      .map((line, idx) => ({ text: line.trim(), lineIdx: idx }))
      .filter((l) => l.text.startsWith('- [ ]') || l.text.startsWith('-') || l.text.startsWith('*'));
  };

  const handleCreateTaskFromLine = (lineText: string) => {
    // Clean bullet or checkbox markdown
    const cleaned = lineText.replace(/^-\s*\[\s*\]\s*/, '').replace(/^[-*]\s*/, '').trim();
    if (!cleaned) return;

    addTask({
      title: cleaned,
      status: 'pending',
      priority: 'high',
      tags: ['Scratchpad', 'Action Item'],
    });

    setTaskAddedToast(`Created task: "${cleaned.slice(0, 30)}..."`);
    setTimeout(() => setTaskAddedToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Instant Scratchpad & Brain Dump</h2>
              <p className="text-[11px] text-stone-500">
                Auto-saved in real time • Synced to your Google Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition cursor-pointer text-xs flex items-center gap-1 font-medium"
              title="Copy all notes"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col min-h-[300px]">
          {taskAddedToast && (
            <div className="mb-3 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{taskAddedToast}</span>
            </div>
          )}

          <textarea
            value={scratchpad}
            onChange={(e) => updateScratchpad(e.target.value)}
            placeholder="Type notes, meeting bullets, quick thoughts, or items to remember...
- [ ] Task item to convert
- Idea for client workflow..."
            className="w-full flex-1 p-3 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-800 text-xs sm:text-sm font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-stone-400 resize-none"
          />

          {/* Actionable Bullets Converter */}
          {extractChecklistLines().length > 0 && (
            <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Detected Action Items
                </span>
                <span className="text-[10px] text-amber-700">1-click convert into active task</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {extractChecklistLines().slice(0, 4).map((item) => (
                  <button
                    key={item.lineIdx}
                    type="button"
                    onClick={() => handleCreateTaskFromLine(item.text)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-lg text-xs font-medium text-amber-950 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-amber-600" />
                    <span className="truncate max-w-[200px]">{item.text.replace(/^-\s*(\[\s*\])?\s*/, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{lineCount} lines</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
