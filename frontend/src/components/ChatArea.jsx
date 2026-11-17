import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import {
  Bot,
  Sparkles,
  GitBranch,
  Video,
  Cpu,
  Target,
  ArrowRight,
  GraduationCap,
  Layers,
  Terminal,
  Zap
} from 'lucide-react';

export default function ChatArea({
  messages,
  isLoading,
  onQuickPrompt,
  onOpenFitEvaluator,
  onOpenResume,
  candidateName = 'Mustafa Shaikh'
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const featureCards = [
    {
      icon: GitBranch,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
      title: 'Distributed CI/CD Orchestrator',
      description: 'DAG-based build/test/deploy engine with isolated Docker runners and 10s heartbeat fault tolerance.',
      prompt: 'Explain how your Distributed CI/CD Pipeline Orchestrator works, including DAG resolution and runner failure recovery.'
    },
    {
      icon: Video,
      color: 'from-brand-500/20 to-emerald-500/20 text-brand-400 border-brand-500/30',
      title: 'Full-Stack MERN Platform',
      description: 'Video streaming and microblogging platform with MongoDB aggregation pipelines and Cloudinary.',
      prompt: 'Tell me about the Video Sharing & Microblogging Network: tech stack, architecture, and deployment.'
    },
    {
      icon: Cpu,
      color: 'from-purple-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
      title: 'Docker & Resource Scheduling',
      description: 'Resource-aware task scheduler matching CPU/RAM to live capacity with container CPU/memory quotas.',
      prompt: 'How did you handle resource-aware scheduling and Docker container quotas in your orchestrator?'
    },
    {
      icon: Target,
      color: 'from-amber-500/20 to-rose-500/20 text-amber-400 border-amber-500/30',
      title: 'Recruiter Job Fit Matcher',
      description: 'Evaluate Mustafa against your open Job Description with weighted sub-scores and gap analysis.',
      action: onOpenFitEvaluator
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        // Empty State / Hero Banner
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
          
          {/* Hero Welcome Card */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 ring-4 ring-white/10 flex-shrink-0">
                <Bot className="w-9 h-9" />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Welcome! I am {candidateName}&apos;s AI Twin.
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
                    <Sparkles className="w-3 h-3" />
                    Pydantic + Groq Powered
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Ask me anything about Mustafa&apos;s engineering projects, architecture decisions, technical skills, or academic record at <strong className="text-white">KLE Technological University (CGPA 9.2/10)</strong>. Every answer is strictly grounded in his verified resume.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    🚀 Distributed Systems
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    ⚡ MERN Full Stack
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    🐳 Docker & WebSockets
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-emerald-300 border border-emerald-500/30">
                    🎯 CGPA: 9.2 / 10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Exploration Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Explore Key Engineering Highlights</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {featureCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (card.action) card.action();
                      else if (card.prompt) onQuickPrompt(card.prompt);
                    }}
                    className="glass-card glass-card-hover p-4 rounded-xl cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg border bg-gradient-to-br ${card.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        {card.description}
                      </p>
                    </div>

                    <div className="pt-3 text-[11px] font-medium text-brand-400/90 group-hover:text-brand-300 flex items-center gap-1">
                      <span>{card.action ? 'Launch tool' : 'Ask about this'}</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recruiter Quick Tips */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Have a specific Job Description? Paste it into our <strong>Job Fit Matcher</strong> to calculate real-time weighted fit scores.</span>
            </div>
            <button
              onClick={onOpenFitEvaluator}
              className="flex-shrink-0 ml-3 text-brand-400 hover:text-brand-300 font-semibold underline text-xs"
            >
              Open Matcher
            </button>
          </div>

        </div>
      ) : (
        // Message Stream
        <div className="divide-y divide-slate-800/40">
          {messages.map((msg, index) => (
            <MessageItem
              key={index}
              message={msg}
              onSelectFollowUp={onQuickPrompt}
              candidateName={candidateName}
            />
          ))}

          {/* Typing / Analyzing Indicator */}
          {isLoading && (
            <div className="py-4 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-800/40">
              <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>Analyzing verified resume & generating structured response...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
