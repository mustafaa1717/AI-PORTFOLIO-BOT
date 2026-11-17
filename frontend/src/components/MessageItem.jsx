import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';

export default function MessageItem({
  message,
  onSelectFollowUp,
  candidateName = 'Mustafa Shaikh'
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const metadata = message.metadata;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`py-4 px-4 sm:px-6 transition-colors ${isAssistant ? 'bg-slate-900/40 border-y border-slate-800/40' : ''}`}>
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-start">
        
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
              <Bot className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700/60 shadow-sm">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          
          {/* Header Line */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {isAssistant ? `${candidateName}'s AI Assistant` : 'Interviewer'}
              </span>
              {isAssistant && metadata?.answered_from_resume && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified from Resume
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              {formattedTime && (
                <span className="flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3" />
                  {formattedTime}
                </span>
              )}
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Markdown Body */}
          <div className="text-sm text-slate-200 leading-relaxed chat-markdown">
            {isAssistant ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Structured Output Metadata (Pydantic AnswerMetadata) */}
          {isAssistant && metadata && (
            <div className="pt-2">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3 space-y-2.5">
                
                {/* Confidence & Sections */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {typeof metadata.confidence === 'number' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700/60">
                      <span>Confidence:</span>
                      <span className={`font-semibold ${metadata.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {Math.round(metadata.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  {metadata.resume_sections_used && metadata.resume_sections_used.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Sections:</span>
                      <div className="flex flex-wrap gap-1">
                        {metadata.resume_sections_used.map((sec, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-300 font-mono text-[10px] border border-brand-500/20 capitalize"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Follow-Ups (Clickable) */}
                {metadata.suggested_follow_ups && metadata.suggested_follow_ups.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      <span>Suggested Follow-Ups:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {metadata.suggested_follow_ups.map((followUp, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectFollowUp && onSelectFollowUp(followUp)}
                          className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-brand-500/15 text-slate-300 hover:text-brand-300 border border-slate-700/60 hover:border-brand-500/40 transition-all flex items-center gap-1.5 group"
                        >
                          <span className="truncate max-w-md">{followUp}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
