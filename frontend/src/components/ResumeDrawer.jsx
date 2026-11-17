import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Mail,
  Phone,
  GraduationCap,
  Code2,
  FolderGit2,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Download,
  Layers,
  Cpu
} from 'lucide-react';
import { api } from '../api';

export default function ResumeDrawer({
  isOpen,
  onClose,
  onAskAboutProject,
  initialResumeData = null
}) {
  const [resume, setResume] = useState(initialResumeData);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !resume) {
      setLoading(true);
      api.getResume()
        .then((data) => setResume(data))
        .catch((err) => {
          console.error('Failed to load resume:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, resume]);

  if (!isOpen) return null;

  const categorizeSkills = (skills = []) => {
    const categories = {
      languages: ['C', 'C++', 'Java', 'JavaScript'],
      frontend: ['React', 'Vite', 'MERN Stack', 'React Query', 'Zustand'],
      backend: ['Node.js', 'Express.js', 'REST APIs', 'WebSockets (Socket.io)', 'Socket.io', 'MongoDB', 'SQL', 'Event-Driven Architecture', 'API Design'],
      devops: ['Docker', 'Render', 'GitHub Webhooks', 'OAuth', 'Git', 'Postman', 'Cloudinary'],
      core: ['Data Structures & Algorithms', 'Object-Oriented Programming', 'Operating Systems', 'DBMS']
    };

    if (activeTab === 'languages') return skills.filter(s => categories.languages.includes(s));
    if (activeTab === 'frontend') return skills.filter(s => categories.frontend.includes(s));
    if (activeTab === 'backend') return skills.filter(s => categories.backend.includes(s));
    if (activeTab === 'devops') return skills.filter(s => categories.devops.includes(s));
    if (activeTab === 'core') return skills.filter(s => categories.core.includes(s));
    return skills;
  };

  const filteredSkills = categorizeSkills(resume?.skills || []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Interactive Resume Explorer
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Verified Pydantic Model
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {resume?.name || 'Mustafa Shaikh'} • KLE Technological University
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

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-7">
            
            {/* Candidate Header Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{resume?.name || 'Mustafa Shaikh'}</h3>
                  <p className="text-xs text-brand-400 font-medium">
                    Full-Stack Developer & Distributed Systems Enthusiast
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    CGPA: 9.2 / 10
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {resume?.email && (
                  <a href={`mailto:${resume.email}`} className="flex items-center gap-1.5 hover:text-brand-300 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{resume.email}</span>
                  </a>
                )}
                {resume?.phone && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{resume.phone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Education Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                <span>Education</span>
              </div>
              <div className="space-y-2">
                {(resume?.education || ['KLE Technological University | B.E. Computer Science & Engineering | CGPA: 9.2/10 (2024 – 2028 Expected)']).map((edu, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200">
                    <div className="font-semibold text-white">KLE Technological University</div>
                    <div className="text-xs text-slate-300 mt-0.5">Bachelor of Engineering in Computer Science & Engineering</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                      <span>2024 – 2028 (Expected)</span>
                      <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        CGPA: 9.2 / 10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Matrix Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-brand-400" />
                  <span>Skills Matrix ({resume?.skills?.length || 27})</span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'languages', label: 'Languages' },
                    { id: 'frontend', label: 'Frontend' },
                    { id: 'backend', label: 'Backend' },
                    { id: 'devops', label: 'DevOps/Tools' },
                    { id: 'core', label: 'Core CS' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-brand-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {filteredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 text-xs font-mono border border-slate-700/60 hover:border-brand-500/40 hover:text-brand-300 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Projects Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-brand-400" />
                <span>Featured Engineering Projects</span>
              </div>

              <div className="space-y-4">
                {(resume?.projects || []).map((projStr, idx) => {
                  const parts = projStr.split(' – ');
                  const title = parts[0] || `Project ${idx + 1}`;
                  const details = parts.slice(1).join(' – ') || projStr;

                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-brand-500/30 transition-all space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                            {title}
                          </h4>
                          <span className="inline-block text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {idx === 0 ? 'MERN Stack & Cloudinary' : 'Distributed Systems & Docker'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onAskAboutProject(`Can you walk me through the architecture and key challenges of the "${title}" project?`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all flex-shrink-0"
                          title="Ask AI about this project"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ask Bot</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Source: <code className="text-slate-300 font-mono text-[11px]">Mustafa_Shaikh_Resume.pdf</code>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
