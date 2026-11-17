import React from 'react';
import {
  Sparkles,
  FileText,
  Target,
  Github,
  Linkedin,
  Mail,
  Menu,
  X,
  GraduationCap,
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function Navbar({
  onOpenResume,
  onOpenFitEvaluator,
  backendOnline,
  candidateName = 'Mustafa Shaikh',
  candidateRole = 'Full-Stack & Distributed Systems',
  onToggleSidebar,
  sidebarOpen
}) {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Sidebar Toggle + Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            aria-label="Toggle sessions menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-teal-500 to-indigo-500 shadow-lg shadow-teal-500/20">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  {candidateName}
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    AI Twin
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {candidateRole} • <span className="text-brand-400">9.2 CGPA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>FastAPI + Groq LLM Connected</span>
          </div>

          {/* Job Matcher Modal Trigger */}
          <button
            onClick={onOpenFitEvaluator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
            title="Evaluate Job Description Match"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Job Fit Matcher</span>
            <span className="sm:hidden">Match JD</span>
          </button>

          {/* Resume Explorer Trigger */}
          <button
            onClick={onOpenResume}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 hover:border-brand-500/40 transition-all transform hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Interactive Resume</span>
            <span className="sm:hidden">Resume</span>
          </button>

          {/* Direct Social Links */}
          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <a
              href="mailto:mustafaraza1717@gmail.com"
              className="p-2 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800/70 transition-colors"
              title="Email Mustafa"
            >
              <Mail className="w-4 h-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
              title="GitHub Profile"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-accent-400 hover:bg-slate-800/70 transition-colors"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </header>
  );
}
