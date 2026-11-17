import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, CornerDownLeft } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  onQuickPrompt
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const sampleChips = [
    'How does your Distributed CI/CD DAG orchestrator work?',
    'What is your experience with Docker & Render?',
    'Explain the MERN video platform architecture',
    'What are your top 5 technical skills?'
  ];

  return (
    <div className="w-full glass-panel border-t border-slate-800/80 p-3 sm:p-4 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>Try:</span>
          </span>
          {sampleChips.map((chip, index) => (
            <button
              key={index}
              onClick={() => onQuickPrompt(chip)}
              disabled={isLoading}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-brand-500/40 text-[11px] transition-all disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="relative flex items-end gap-2 bg-slate-900/90 rounded-2xl border border-slate-700/80 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 p-2 shadow-inner transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Mustafa's experience, architecture, projects, or academics..."
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none max-h-40 overflow-y-auto"
          />

          <button
            onClick={() => {
              if (input.trim() && !isLoading) onSend();
            }}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-brand-500/20 transition-all transform active:scale-95"
            title="Send question (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Responses strictly grounded in verified resume data via GPT-OSS & Pydantic.</span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400 flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> Enter to send
          </span>
        </div>

      </div>
    </div>
  );
}
