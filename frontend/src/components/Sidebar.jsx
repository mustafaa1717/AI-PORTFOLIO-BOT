import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  Sparkles,
  Layers,
  Code2,
  GitBranch,
  Award,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  conversations,
  currentConvId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onQuickPrompt,
  loadingConv,
  isOpen,
  onCloseMobile
}) {
  const quickTopics = [
    { label: 'Distributed CI/CD Orchestrator', prompt: 'Tell me about the architecture of your Distributed CI/CD Pipeline Orchestrator and how DAG workflows work.' },
    { label: 'MERN Video & Microblogging', prompt: 'Explain the technical stack and MongoDB aggregation pipelines used in your Video Sharing & Microblogging platform.' },
    { label: 'Docker & Runner Isolation', prompt: 'How did you implement CPU/RAM task scheduling and Docker container isolation in your projects?' },
    { label: 'Core Strengths & Academics', prompt: 'Summarize your core strengths, DSA background, and academic standing at KLE Tech.' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 lg:w-80 flex flex-col bg-slate-950/90 md:bg-slate-950/60 border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / New Chat Button */}
        <div className="p-4 border-b border-slate-800/70">
          <button
            onClick={() => {
              onCreateConversation();
              if (onCloseMobile) onCloseMobile();
            }}
            disabled={loadingConv}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 shadow-md shadow-brand-500/20 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>New Interview Session</span>
          </button>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Sessions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
              {conversations.length}
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-500 stroke-1" />
              No prior conversations found. Start a new session above!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentConvId;
              const dateStr = conv.created_at ? new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium border border-brand-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">
                      {conv.title && conv.title !== 'New conversation' ? conv.title : `Session #${conv.id}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 group-hover:hidden">
                      {dateStr}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="hidden group-hover:flex p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Recruiter Quick Topics Section */}
          <div className="pt-4 pb-2">
            <div className="px-2 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Recommended Topics</span>
            </div>
            <div className="space-y-1">
              {quickTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onQuickPrompt(item.prompt);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 hover:border-brand-500/30 transition-all flex items-center justify-between group"
                >
                  <span className="truncate pr-1">{item.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Candidate Quick Card */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              MS
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                Mustafa Shaikh
                <Award className="w-3 h-3 text-amber-400 flex-shrink-0" title="9.2 CGPA" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                KLE Technological University
              </p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
