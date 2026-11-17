import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Loader2,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function FitEvaluatorModal({
  isOpen,
  onClose,
  conversationId,
  currentFitReport,
  onFitEvaluated,
  onAskAboutFit
}) {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(currentFitReport || null);

  const sampleJDs = [
    {
      title: 'Distributed Systems & Backend Engineer',
      text: `Role: Backend / Distributed Systems Engineer
Company: CloudScale Tech
Requirements:
- Strong knowledge of distributed systems, concurrency, and event-driven architecture.
- Hands-on experience with Node.js, Express, Docker, and containerization.
- Experience building CI/CD pipelines, GitOps workflows, and WebSockets for real-time telemetry.
- Solid understanding of Data Structures & Algorithms, OS, and Database Management (MongoDB, SQL).
- Strong academic foundation in Computer Science or related degree.`
    },
    {
      title: 'Full Stack MERN Developer',
      text: `Role: Full Stack MERN Developer
Company: StreamVibe Media
Requirements:
- Proficiency in React, Vite, Node.js, Express, and MongoDB.
- Experience with REST API design, state management (Zustand/Redux/React Query), and media storage (Cloudinary/S3).
- Knowledge of WebSockets, user authentication (OAuth/JWT), and modern UI component design.
- Containerization with Docker and deployment on modern cloud platforms (Render/AWS).`
    },
    {
      title: 'DevOps & Infrastructure Intern',
      text: `Role: DevOps & Infrastructure Engineer Intern
Company: AutoDeploy Labs
Requirements:
- Experience configuring Docker containers, isolated environments, and resource quotas.
- Knowledge of CI/CD pipeline automation, DAG dependency scheduling, and GitHub Webhooks.
- Passion for automation, monitoring, health-check heartbeats, and fault tolerance.`
    }
  ];

  const handleEvaluate = async (textToUse) => {
    const text = textToUse || jobDescription;
    if (!text || text.trim().length < 20) {
      setError('Please provide a job description of at least 20 characters.');
      return;
    }

    if (!conversationId) {
      setError('Active conversation is missing. Please restart or select a conversation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.evaluateJob(conversationId, text);
      setReport(result);
      if (onFitEvaluated) onFitEvaluated(result);

      if (result.overall_score >= 75) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to evaluate job fit. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-accent-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Job Description Fit Evaluator
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20">
                  AI Recruiter Judge
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Calculates weighted candidate fit score (50% Skills, 30% Experience, 20% Education)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Or Choose a Sample Role:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleJDs.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setJobDescription(sample.text);
                    handleEvaluate(sample.text);
                  }}
                  disabled={loading}
                  className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-accent-500/40 text-xs text-slate-300 hover:text-white transition-all group disabled:opacity-50"
                >
                  <div className="font-medium text-slate-200 group-hover:text-accent-300 truncate">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <span>Evaluate role</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Job Description Content</span>
              <span className="text-[10px] text-slate-400 lowercase font-mono">
                {jobDescription.length} chars
              </span>
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste your job description requirements here (role, required tech stack, responsibilities, etc.)..."
              disabled={loading}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all font-mono"
            />

            <div className="flex justify-end">
              <button
                onClick={() => handleEvaluate()}
                disabled={loading || !jobDescription.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating with Groq LLM...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Compute Fit Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Report Display */}
          {report && (
            <div className="space-y-4 pt-4 border-t border-slate-800 animate-slide-up">
              
              {/* Top Score Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Target Role: <span className="text-white normal-case font-bold">{report.job_role || 'Evaluated Job'}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                    <span>Candidate Fit:</span>
                    <span className={report.overall_score >= 70 ? 'text-emerald-400' : report.overall_score >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                      {report.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Weighted evaluation based strictly on Mustafa Shaikh&apos;s verified resume.
                  </p>
                </div>

                {/* Score Circular Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-slate-800 border-4 border-slate-700 shadow-inner">
                    <span className="text-2xl font-black text-white font-mono">
                      {Math.round(report.overall_score)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 absolute bottom-3">/100</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    Overall Score
                  </span>
                </div>

              </div>

              {/* Sub-Score Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">Skills Match (50%)</span>
                    <span className="font-mono font-semibold text-brand-400">{Math.round(report.skills_score)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${report.skills_score}%` }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">Experience & Projects (30%)</span>
                    <span className="font-mono font-semibold text-indigo-400">{Math.round(report.experience_score)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${report.experience_score}%` }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-medium">Education (20%)</span>
                    <span className="font-mono font-semibold text-emerald-400">{Math.round(report.education_score)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${report.education_score}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Matching Skills */}
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matching Skills ({report.matching_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.matching_skills && report.matching_skills.length > 0 ? (
                      report.matching_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 font-mono">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None identified</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Missing / Unmentioned Skills ({report.missing_skills?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.missing_skills && report.missing_skills.length > 0 ? (
                      report.missing_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs border border-amber-500/20 font-mono">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No missing skills detected</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {report.strengths && report.strengths.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Key Candidate Strengths:</span>
                    </div>
                    <ul className="space-y-1 text-slate-400">
                      {report.strengths.map((st, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.gaps && report.gaps.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Considerations / Gaps:</span>
                    </div>
                    <ul className="space-y-1 text-slate-400">
                      {report.gaps.map((gp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{gp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recruiter Remark */}
              {report.remark && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recruiter Assessment Remark:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    &ldquo;{report.remark}&rdquo;
                  </p>
                </div>
              )}

              {/* Chat action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    if (onAskAboutFit) {
                      onAskAboutFit(`Based on the evaluated job description for ${report.job_role || 'this position'}, how would you summarize Mustafa's top qualifications and how he would address any gaps?`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 transition-all"
                >
                  <span>Discuss this fit report in chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
