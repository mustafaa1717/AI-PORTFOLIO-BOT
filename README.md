# 🤖 Mustafa Shaikh — AI Portfolio Chatbot & Recruiter Twin

An intelligent, production-grade AI portfolio chatbot designed for recruiters and engineering managers to interview **Mustafa Shaikh** (Computer Science & Engineering student at KLE Technological University, 9.2/10 CGPA).

The assistant is powered by a **FastAPI** backend with **Groq LLM (GPT-OSS)**, **Pydantic structured output evaluation**, prompt engineering with strict ground-truth guardrails, and a modern, high-performance **React + Tailwind CSS** frontend.

---

## ✨ Features

### 🎨 Modern Frontend (React 18 + Vite + Tailwind CSS + Lucide Icons)
- **AI Twin Identity**: Visual candidate branding with live connection status indicators, academic highlights, and social links.
- **Session Management**: Full conversation history support with "+ New Interview Session", conversation list, switching, and deletion.
- **Structured Answer Metadata Display**:
  - Displays **Confidence Score Gauge** (e.g., 95% Confidence).
  - Displays **Resume Sections Used** (e.g., `skills`, `projects`, `education`).
  - Displays **Verified from Resume** shield badge ensuring zero hallucination.
  - **Clickable Suggested Follow-Ups**: Dynamically rendered chips below answers that let recruiters dive deeper with 1 click.
- **🎯 Recruiter Job Description Fit Matcher (Modal)**:
  - Recruiter can paste any open Job Description or pick 1-click sample roles (*Distributed Systems Backend Engineer*, *Full Stack MERN Developer*, *DevOps Intern*).
  - Calculates real-time candidate fit scores:
    - **Overall Weighted Fit Score** (0–100) with verdict (*Strong fit*, *Good fit*, *Partial fit*).
    - **Skills Match** (50% weight).
    - **Experience & Projects Match** (30% weight).
    - **Education Match** (20% weight).
    - **Matching Skills vs Missing Skills** badges.
    - **Candidate Strengths & Considerations/Gaps** breakdown.
    - **Recruiter Assessment Remark**.
    - Confetti celebration on high fit score!
- **📄 Interactive Resume Explorer (Side Drawer)**:
  - Categorized Skills Matrix with quick filter tabs (*Languages*, *Frontend*, *Backend*, *DevOps/Tools*, *Core CS*).
  - Featured Projects cards with architecture highlights and direct "Ask Bot" shortcuts.
  - Academic credentials and contact details.

### ⚡ Robust Backend (FastAPI + Groq LLM + Pydantic)
- **Prompt Engineering**: Strict persona and ground-truth constraint prompting to eliminate hallucination.
- **Pydantic Validation**:
  - Resume Parsing (`Resume`, `Experience`).
  - Answer Metadata Structured Output (`AnswerMetadata`).
  - Job Description Analysis (`JobD`).
  - Recruiter Fit Judgement & Weighted Scoring (`FitJudgement`, `FitReport`).
- **Disk-Backed Conversation Store**: Persists chat sessions as atomic JSON files under `backend/chat_history/`.
- **CORS Configured**: Fully wired for Vite (`http://localhost:5173`) and Next/React (`http://localhost:3000`).

---

## 🚀 Quick Start

### 1. One-Click Launch (Backend + Frontend)
Run the root startup script:
```bash
python run_dev.py
```
Or on Windows, double-click `start_dev.bat`.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Manual Launch

#### Backend:
```bash
# Activate your virtual environment
.venv\Scripts\activate

# Navigate to backend and run FastAPI with uvicorn
cd backend
uvicorn main:app --reload --port 8000
```

#### Frontend:
```bash
# Navigate to frontend and start Vite dev server
cd frontend
npm run dev
```

---

## 🛠️ Project Structure

```
ai portfolio chat bot/
├── backend/
│   ├── main.py                     # FastAPI application routes & lifespan
│   ├── portfolio.py                # Chatbot engine, prompt engineering, Pydantic schemas, Groq API
│   ├── parsed_resume_cache.json    # Cached Pydantic resume model
│   ├── resumes/                    # Source resume documents (PDF/DOCX)
│   └── chat_history/               # Saved session JSON files
├── frontend/
│   ├── index.html                  # HTML entrypoint with Plus Jakarta Sans & JetBrains Mono
│   ├── package.json                # React 18, Vite, Tailwind CSS, Lucide icons, Canvas Confetti
│   ├── vite.config.js              # Vite config with backend API proxy
│   ├── tailwind.config.js          # Custom theme, brand palette & keyframe animations
│   └── src/
│       ├── api.js                  # Centralized API service for all FastAPI endpoints
│       ├── App.jsx                 # App state orchestrator
│       ├── components/
│       │   ├── Navbar.jsx          # Header with candidate avatar, status & tool triggers
│       │   ├── Sidebar.jsx         # Conversation sessions & recruiter quick topics
│       │   ├── ChatArea.jsx        # Hero welcome cards & chat message stream
│       │   ├── MessageItem.jsx     # Markdown renderer, confidence gauge & follow-up chips
│       │   ├── ChatInput.jsx       # Auto-resizing textarea with suggestion chips
│       │   ├── FitEvaluatorModal.jsx # Recruiter Job Description fit evaluator & score gauge
│       │   └── ResumeDrawer.jsx    # Filterable skills matrix & interactive project cards
├── run_dev.py                      # Concurrent startup script
├── start_dev.bat                   # Windows batch launcher
└── requirements.txt                # Python backend dependencies
```
