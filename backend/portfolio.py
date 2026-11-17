"""
Portfolio Resume Chatbot
------------------------
An interviewer can ask questions about your resume and the bot answers
using ONLY the resume content.

Features
  * Resume is read (PDF / DOCX) and parsed once into a Pydantic model (cached)
  * Conversation history is maintained (user / assistant roles) and sent back
    to the LLM on every turn, so follow-ups like "tell me more about that" work
  * Multiple conversations (each interviewer / session gets its own id)
  * Chat history is stored on disk as JSON (chat_history/<id>.json)
  * Streaming responses (tokens printed live)
  * Pydantic structured outputs (resume parsing + per-answer metadata)

Setup
  pip install groq pypdf python-docx pydantic python-dotenv
  .env  ->  GROQ_API_KEY=your_key
  Put your resume in ./resumes/  (or set RESUME_PATH in .env)

Run
  python portfolio_chatbot.py
"""

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path

from docx import Document
from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field
from pypdf import PdfReader

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise SystemExit("GROQ_API_KEY is missing. Add it to your .env file.")

client = Groq(api_key=API_KEY)
MODEL = "openai/gpt-oss-120b"

BASE_DIR = Path(__file__).resolve().parent
RESUME_FOLDER = BASE_DIR / "resumes"
HISTORY_DIR = BASE_DIR / "chat_history"
PARSED_CACHE = BASE_DIR / "parsed_resume_cache.json"

MAX_HISTORY_MESSAGES = 20      # how many past messages are sent to the LLM
GENERATE_METADATA = True       # extra LLM call per answer (structured output)

# Folders are created inside the relevant functions so filesystem errors
# can be reported cleanly instead of crashing during module import.


def call_llm(**kwargs):
    """Call Groq and translate common SDK/API failures into useful messages."""
    try:
        return client.chat.completions.create(**kwargs)
    except Exception as e:
        status = getattr(e, "status_code", None)
        error_name = type(e).__name__

        if status == 401:
            message = "Groq authentication failed. Check GROQ_API_KEY."
        elif status == 429:
            message = "Groq rate limit or quota reached. Wait and try again."
        elif status is not None and status >= 500:
            message = "Groq is temporarily unavailable. Try again later."
        elif error_name in {"APITimeoutError", "TimeoutError"}:
            message = "The request to Groq timed out. Try again."
        elif error_name in {"APIConnectionError", "ConnectionError"}:
            message = "Could not connect to Groq. Check your internet connection."
        else:
            message = f"Groq request failed ({error_name}): {e}"

        raise RuntimeError(message) from e


def validate_llm_json(model_class, response):
    """Parse JSON returned by the LLM and validate it with a Pydantic model."""
    if not getattr(response, "choices", None):
        raise ValueError("The LLM returned no choices.")

    content = response.choices[0].message.content
    if not content or not content.strip():
        raise ValueError("The LLM returned empty content.")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError("The LLM returned invalid JSON.") from e

    if not isinstance(data, dict):
        raise ValueError("The LLM response must be a JSON object.")

    try:
        return model_class(**data)
    except (ValidationError, TypeError) as e:
        raise ValueError(
            f"The LLM response did not match {model_class.__name__}: {e}"
        ) from e


# --------------------------------------------------------------------------- #
# Pydantic models
# --------------------------------------------------------------------------- #
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = Field(default_factory=list)


class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    total_experience_years: float | None = None
    skills: list[str] = Field(default_factory=list)
    experiences: list[Experience] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class AnswerMetadata(BaseModel):
    """Structured info about an answer (generated after the streamed answer)."""
    answered_from_resume: bool = Field(
        description="True if the answer is fully supported by the resume."
    )
    resume_sections_used: list[str] = Field(
        default_factory=list,
        description="e.g. ['skills', 'projects', 'experience', 'education']",
    )
    confidence: float = Field(ge=0, le=1, description="0 to 1")
    suggested_follow_ups: list[str] = Field(
        default_factory=list,
        description="2-3 follow-up questions the interviewer might ask next.",
    )


class Message(BaseModel):
    role: str                      # "user" | "assistant"
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    metadata: AnswerMetadata | None = None


class JobD(BaseModel):
    """Structured job description."""
    role: str | None = None
    company: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    minimum_experience: float | None = None
    education_requirements: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)


class FitJudgement(BaseModel):
    """What the LLM judge returns (sub-scores only, no overall score)."""
    skills_score: float = Field(ge=0, le=100, description="How well the skills match the job, 0-100")
    experience_score: float = Field(ge=0, le=100, description="How well experience/projects match, 0-100")
    education_score: float = Field(ge=0, le=100, description="How well education matches, 0-100")
    matching_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    experience_requirement_met: bool | None = None
    strengths: list[str] = Field(default_factory=list, description="Top reasons the candidate fits")
    gaps: list[str] = Field(default_factory=list, description="Top reasons the candidate may not fit")
    remark: str = Field(description="2-4 sentence honest remark on the candidate's fit for this role")


class FitReport(FitJudgement):
    """FitJudgement + overall score calculated in Python."""
    overall_score: float = Field(ge=0, le=100)
    verdict: str
    job_role: str | None = None


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    title: str = "New conversation"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    messages: list[Message] = Field(default_factory=list)
    job: JobD | None = None                 # job description uploaded in this conversation
    fit_report: FitReport | None = None     # latest fit score for that job


# --------------------------------------------------------------------------- #
# Resume reading + parsing
# --------------------------------------------------------------------------- #
def read_pdf(path: Path) -> str:
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def read_docx(path: Path) -> str:
    doc = Document(path)
    text = ""
    for p in doc.paragraphs:
        if p.text.strip():
            text += p.text + "\n"
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    text += cell.text + "\n"
    return text


def read_resume(path: Path) -> str:
    """Read a PDF or DOCX resume and report common file problems clearly."""
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found: {path}")
    if not path.is_file():
        raise ValueError(f"Resume path is not a file: {path}")

    suffix = path.suffix.lower()
    try:
        if suffix == ".pdf":
            text = read_pdf(path)
        elif suffix == ".docx":
            text = read_docx(path)
        else:
            raise ValueError(f"Unsupported resume format: {suffix}")
    except (FileNotFoundError, ValueError):
        raise
    except Exception as e:
        raise RuntimeError(f"Could not read resume file {path.name}: {e}") from e

    if not text or not text.strip():
        raise ValueError(
            "No readable text was extracted from the resume. "
            "If this is a scanned PDF, OCR is required."
        )
    return text


def find_resume_file() -> Path:
    """Find the resume configured in .env or the first PDF/DOCX in resumes/."""
    env_path = os.getenv("RESUME_PATH")
    if env_path:
        path = Path(env_path).expanduser()
        if not path.exists():
            raise FileNotFoundError(f"RESUME_PATH not found: {env_path}")
        if not path.is_file():
            raise ValueError(f"RESUME_PATH is not a file: {env_path}")
        return path

    try:
        RESUME_FOLDER.mkdir(parents=True, exist_ok=True)
        for file_path in sorted(RESUME_FOLDER.iterdir()):
            if file_path.is_file() and file_path.suffix.lower() in (".pdf", ".docx"):
                return file_path
    except OSError as e:
        raise RuntimeError(f"Could not access resume folder: {e}") from e

    raise FileNotFoundError(
        f"No PDF/DOCX resume found in {RESUME_FOLDER}. Add one or set RESUME_PATH."
    )


def parse_resume(resume_text: str) -> Resume:
    system_prompt = f"""
You are an expert resume parser. Extract information based on meaning, not
just exact headings (Experience / Work History / Internships, etc.).

Return ONLY valid JSON matching this schema:
{Resume.model_json_schema()}

Rules:
1. Do not invent information.
2. If a value is not available, return null.
3. If a list has no information, return an empty list.
4. Include internships inside experiences.
5. Extract skills mentioned across the entire resume.
6. Do NOT return the schema itself, only the filled data.
"""
    response = call_llm(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Parse the following resume:\n\n{resume_text}"},
        ],
        response_format={"type": "json_object"},
    )
    return validate_llm_json(Resume, response)


def load_resume() -> tuple[str, Resume]:
    """Return raw resume text and parsed data, using a cache when valid."""
    path = find_resume_file()
    raw_text = read_resume(path)
    stamp = f"{path.name}:{path.stat().st_mtime}"

    if PARSED_CACHE.exists():
        try:
            cached = json.loads(PARSED_CACHE.read_text(encoding="utf-8"))
            if cached.get("stamp") == stamp:
                return raw_text, Resume(**cached["resume"])
        except (OSError, json.JSONDecodeError, ValidationError, TypeError, KeyError) as e:
            print(f"Warning: Resume cache is unusable; reparsing resume. ({e})")

    print(f"Parsing resume: {path.name} ...")
    parsed = parse_resume(raw_text)

    try:
        PARSED_CACHE.write_text(
            json.dumps({"stamp": stamp, "resume": parsed.model_dump()}, indent=2),
            encoding="utf-8",
        )
    except OSError as e:
        # The cache is an optimization; the parsed resume can still be used.
        print(f"Warning: Could not write resume cache: {e}")

    return raw_text, parsed


# --------------------------------------------------------------------------- #
# Job description: read, parse, score
# --------------------------------------------------------------------------- #
SCORE_WEIGHTS = {"skills": 0.5, "experience": 0.3, "education": 0.2}


def read_job_file(path: Path) -> str:
    """Read a job description from PDF, DOCX, TXT or Markdown."""
    if not path.exists():
        raise FileNotFoundError(f"Job description file not found: {path}")
    if not path.is_file():
        raise ValueError("Job description path must point to a file.")

    suffix = path.suffix.lower()
    if suffix in (".pdf", ".docx"):
        return read_resume(path)
    if suffix in (".txt", ".md"):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as e:
            raise RuntimeError(f"Could not read job description: {e}") from e
        if not text.strip():
            raise ValueError("The job description file is empty.")
        return text
    raise ValueError(f"Unsupported job description format: {suffix}")


def parse_job_description(jd_text: str) -> JobD:
    system_prompt = f"""
You are an expert HR assistant. Extract structured information from the
job description.

Return ONLY valid JSON matching this schema:
{JobD.model_json_schema()}

Rules:
1. Do NOT return the schema itself (no "properties" / "type" keys).
2. If minimum experience is not mentioned, return null.
3. If a list has no information, return an empty list.
4. Do not invent information.
"""
    response = call_llm(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze this job description:\n\n{jd_text}"},
        ],
        response_format={"type": "json_object"},
    )
    return validate_llm_json(JobD, response)


def verdict_for(score: float) -> str:
    if score >= 80:
        return "Strong fit"
    if score >= 60:
        return "Good fit"
    if score >= 40:
        return "Partial fit"
    return "Weak fit"


def evaluate_fit(job: JobD, resume: Resume, resume_text: str) -> FitReport:
    """LLM gives sub-scores + remark; Python computes the final weighted score."""
    prompt = f"""
You are a strict but fair technical recruiter. Compare the candidate with the job.

JOB (structured):
{job.model_dump_json(indent=2)}

CANDIDATE (structured):
{resume.model_dump_json(indent=2)}

CANDIDATE (full resume text):
{resume_text}

Scoring guide (0-100 each):
- skills_score: share of required skills present, with some credit for preferred skills
- experience_score: relevance of internships, projects and work experience to the
  responsibilities; if minimum experience is stated, also consider it
- education_score: match with the education requirements (100 if none are stated and
  the candidate has relevant education)

Rules:
1. Base everything ONLY on the resume. Do not assume skills that are not there.
2. List matching_skills and missing_skills using the job's own skill names.
3. The remark must be honest: mention the main strengths and the main gaps.

Return ONLY valid JSON (filled data, not the schema) matching:
{FitJudgement.model_json_schema()}
"""
    response = call_llm(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    judgement = validate_llm_json(FitJudgement, response)

    overall = round(
        judgement.skills_score * SCORE_WEIGHTS["skills"]
        + judgement.experience_score * SCORE_WEIGHTS["experience"]
        + judgement.education_score * SCORE_WEIGHTS["education"],
        1,
    )
    return FitReport(
        **judgement.model_dump(),
        overall_score=overall,
        verdict=verdict_for(overall),
        job_role=job.role,
    )


# --------------------------------------------------------------------------- #
# Chat history storage (one JSON file per conversation)
# --------------------------------------------------------------------------- #
class ConversationStore:
    def __init__(self, folder: Path):
        self.folder = folder
        try:
            self.folder.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            raise RuntimeError(f"Could not create chat history folder: {e}") from e

    def _path(self, conv_id: str) -> Path:
        # Prevent a conversation ID from escaping the history directory.
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", conv_id or ""):
            raise ValueError("Invalid conversation ID.")
        return self.folder / f"{conv_id}.json"

    def save(self, conv: Conversation) -> None:
        path = self._path(conv.id)
        temp_path = path.with_suffix(".json.tmp")
        try:
            temp_path.write_text(conv.model_dump_json(indent=2), encoding="utf-8")
            os.replace(temp_path, path)
        except OSError as e:
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except OSError:
                pass
            raise RuntimeError(f"Could not save conversation: {e}") from e

    def load(self, conv_id: str) -> Conversation | None:
        path = self._path(conv_id)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return Conversation(**data)
        except (json.JSONDecodeError, ValidationError, TypeError) as e:
            raise ValueError(
                f"Conversation {conv_id} contains invalid or corrupted data."
            ) from e
        except OSError as e:
            raise RuntimeError(f"Could not read conversation: {e}") from e

    def delete(self, conv_id: str) -> bool:
        path = self._path(conv_id)
        if not path.exists():
            return False
        try:
            path.unlink()
            return True
        except OSError as e:
            raise RuntimeError(f"Could not delete conversation: {e}") from e

    def list_all(self) -> list[Conversation]:
        conversations = []
        try:
            files = self.folder.glob("*.json")
            for file_path in files:
                try:
                    data = json.loads(file_path.read_text(encoding="utf-8"))
                    conversations.append(Conversation(**data))
                except (OSError, json.JSONDecodeError, ValidationError, TypeError) as e:
                    print(f"Warning: Skipping damaged history file {file_path.name}: {e}")
        except OSError as e:
            raise RuntimeError(f"Could not list conversations: {e}") from e

        conversations.sort(key=lambda item: item.created_at, reverse=True)
        return conversations

    def create(self) -> Conversation:
        conversation = Conversation()
        self.save(conversation)
        return conversation


# --------------------------------------------------------------------------- #
# The chatbot
# --------------------------------------------------------------------------- #
class ResumeChatbot:
    def __init__(self, resume_text: str, resume: Resume, store: ConversationStore):
        self.resume_text = resume_text
        self.resume = resume
        self.store = store
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        name = self.resume.name or "the candidate"
        return f"""
You are an AI portfolio assistant representing {name}. An interviewer or
recruiter will ask you questions about {name}'s background.

RULES
1.provide the response in minimal and most effiecient way instead of lengthy response
it should be efficient and accurate response
2. Answer ONLY using the resume information below.
3. If something is not in the resume, say clearly that it is not mentioned
   in the resume. Do NOT guess or invent skills, companies, dates or numbers.
4. Be professional, concise and specific. Mention real project names,
   technologies and roles from the resume when relevant.
5. Use the earlier conversation to understand follow-up questions
   (e.g. "tell me more about that project").
6. Refer to the candidate in third person (e.g. "{name} worked on ...").
7. Politely steer back to the resume if asked unrelated questions.
STRUCTURED RESUME (JSON):
{self.resume.model_dump_json(indent=2)}

FULL RESUME TEXT:
{self.resume_text}
"""

    def _build_messages(self, conv: Conversation, user_input: str) -> list[dict]:
        """system prompt + recent history (user/assistant roles) + new question"""
        history = conv.messages[-MAX_HISTORY_MESSAGES:]
        messages = [{"role": "system", "content": self.system_prompt}]

        # if the interviewer uploaded a job description, the bot can discuss the fit
        if conv.job:
            job_context = (
                "The interviewer has shared this job description:\n"
                f"{conv.job.model_dump_json(indent=2)}\n"
            )
            if conv.fit_report:
                job_context += (
                    "\nThe fit evaluation for this job is:\n"
                    f"{conv.fit_report.model_dump_json(indent=2)}\n"
                )
            job_context += (
                "\nWhen asked about fit for this role, use this information and the "
                "resume only. Be honest about gaps."
            )
            messages.append({"role": "system", "content": job_context})

        for m in history:
            messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": user_input})
        return messages

    def _stream_answer(self, messages: list[dict]) -> str:
        """Stream the answer; report failures even if they occur mid-stream."""
        full_answer = ""
        try:
            stream = call_llm(
                model=MODEL,
                messages=messages,
                stream=True,
            )

            for chunk in stream:
                if not chunk.choices:
                    continue
                token = chunk.choices[0].delta.content
                if token:
                    print(token, end="", flush=True)
                    full_answer += token

            print()
            if not full_answer.strip():
                raise ValueError("The LLM returned an empty answer.")
            return full_answer

        except Exception as e:
            print("\nUnable to complete the chatbot response.")
            if full_answer:
                print("A partial response was received and was not saved.")
            raise RuntimeError(f"Chat generation failed: {e}") from e

    def _generate_metadata(self, question: str, answer: str) -> AnswerMetadata | None:
        """Structured output (Pydantic) describing the answer."""
        prompt = f"""
Analyze this Q&A about a candidate's resume.

RESUME:
{self.resume.model_dump_json()}

QUESTION: {question}
ANSWER: {answer}

Return ONLY valid JSON (filled data, not the schema) matching:
{AnswerMetadata.model_json_schema()}
"""
        try:
            response = call_llm(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            return validate_llm_json(AnswerMetadata, response)
        except Exception as e:
            print(f"(metadata skipped: {e})")
            return None

    def set_job(self, conv: Conversation, jd_text: str) -> FitReport:
        """Parse the JD, score the candidate against it and save it in the conversation."""
        print("Parsing job description ...")
        conv.job = parse_job_description(jd_text)
        print("Evaluating fit ...")
        conv.fit_report = evaluate_fit(conv.job, self.resume, self.resume_text)
        self.store.save(conv)
        return conv.fit_report

    def ask(self, conv: Conversation, user_input: str) -> Message:
        if not user_input.strip():
            raise ValueError("Please enter a question before sending.")

        messages = self._build_messages(conv, user_input)

        print("\nAssistant: ", end="", flush=True)
        answer = self._stream_answer(messages)

        # Metadata is optional. If it fails, the main answer is still retained.
        metadata = (
            self._generate_metadata(user_input, answer)
            if GENERATE_METADATA else None
        )

        conv.messages.append(Message(role="user", content=user_input))
        assistant_msg = Message(role="assistant", content=answer, metadata=metadata)
        conv.messages.append(assistant_msg)

        if conv.title == "New conversation":
            conv.title = user_input[:50]

        self.store.save(conv)
        return assistant_msg


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
HELP = """
Commands:
  /new            start a new conversation
  /list           list all saved conversations
  /switch <id>    switch to a saved conversation
  /history        show the current conversation
  /delete <id>    delete a conversation
  /jd <file>      upload a job description (.pdf / .docx / .txt) and get the fit score
  /jd paste       paste a job description (finish with a line containing only END)
  /fit            show the latest fit report for this conversation
  /help           show this help
  /exit           quit
"""


def print_fit_report(report: FitReport) -> None:
    print("\n" + "=" * 60)
    print(f" FIT REPORT  -  {report.job_role or 'Job role'}")
    print("=" * 60)
    print(f" Overall score : {report.overall_score}/100  ({report.verdict})")
    print(f"   Skills      : {report.skills_score}  (weight 50%)")
    print(f"   Experience  : {report.experience_score}  (weight 30%)")
    print(f"   Education   : {report.education_score}  (weight 20%)")
    print(f" Experience requirement met: {report.experience_requirement_met}")
    print(f"\n Matching skills : {', '.join(report.matching_skills) or '-'}")
    print(f" Missing skills  : {', '.join(report.missing_skills) or '-'}")
    if report.strengths:
        print("\n Strengths:")
        for s in report.strengths:
            print(f"   + {s}")
    if report.gaps:
        print(" Gaps:")
        for g in report.gaps:
            print(f"   - {g}")
    print(f"\n Remark: {report.remark}")
    print("=" * 60)


def read_pasted_text() -> str:
    print("Paste the job description. Type END on its own line when done:")
    lines = []
    while True:
        line = input()
        if line.strip() == "END":
            break
        lines.append(line)
    return "\n".join(lines)


def print_conversations(store: ConversationStore, current_id: str) -> None:
    convs = store.list_all()
    if not convs:
        print("No conversations yet.")
        return
    for c in convs:
        marker = "*" if c.id == current_id else " "
        print(f" {marker} {c.id}  {c.created_at}  ({len(c.messages)} msgs)  {c.title}")


def print_history(conv: Conversation) -> None:
    if not conv.messages:
        print("(empty conversation)")
        return
    for m in conv.messages:
        who = "Interviewer" if m.role == "user" else "Assistant"
        print(f"\n[{m.timestamp}] {who}: {m.content}")


def print_metadata(meta: AnswerMetadata | None) -> None:
    if not meta:
        return
    print(
        f"\n  [from resume: {meta.answered_from_resume} | "
        f"sections: {', '.join(meta.resume_sections_used) or '-'} | "
        f"confidence: {meta.confidence:.2f}]"
    )
    if meta.suggested_follow_ups:
        print("  You could also ask:")
        for q in meta.suggested_follow_ups:
            print(f"   - {q}")


def main() -> None:
    try:
        resume_text, resume = load_resume()
        store = ConversationStore(HISTORY_DIR)
        bot = ResumeChatbot(resume_text, resume, store)

        # Resume the latest conversation if one exists, else create a new one.
        existing = store.list_all()
        conv = existing[0] if existing else store.create()

    except (FileNotFoundError, ValueError, ValidationError) as e:
        print(f"Startup error: {e}")
        return
    except (RuntimeError, OSError) as e:
        print(f"Could not start the chatbot: {e}")
        return
    except Exception as e:
        print(f"Unexpected startup error ({type(e).__name__}): {e}")
        return

    print(f"\nPortfolio chatbot for: {resume.name or 'Candidate'}")
    print(f"Current conversation: {conv.id} ({len(conv.messages)} messages)")
    print(HELP)

    while True:
        try:
            user_input = input("\nInterviewer: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not user_input:
            continue

        if user_input.startswith("/"):
            cmd, *rest = user_input.split(maxsplit=1)
            arg = rest[0].strip() if rest else ""

            if cmd == "/exit":
                print("Bye!")
                break
            elif cmd == "/help":
                print(HELP)
            elif cmd == "/new":
                try:
                    conv = store.create()
                    print(f"Started new conversation: {conv.id}")
                except RuntimeError as e:
                    print(f"Could not create conversation: {e}")
            elif cmd == "/list":
                try:
                    print_conversations(store, conv.id)
                except RuntimeError as e:
                    print(f"Could not list conversations: {e}")
            elif cmd == "/switch":
                try:
                    loaded = store.load(arg)
                    if loaded:
                        conv = loaded
                        print(f"Switched to {conv.id}: {conv.title}")
                    else:
                        print("Conversation not found. Use /list.")
                except (ValueError, RuntimeError) as e:
                    print(f"Could not switch conversation: {e}")
            elif cmd == "/history":
                print_history(conv)
            elif cmd == "/jd":
                try:
                    if not arg:
                        print("Usage: /jd <file path>  or  /jd paste")
                        continue
                    if arg.lower() == "paste":
                        jd_text = read_pasted_text()
                    else:
                        jd_path = Path(arg.strip('"').strip("'"))
                        jd_text = read_job_file(jd_path)
                    if not jd_text.strip():
                        print("The job description is empty.")
                        continue
                    report = bot.set_job(conv, jd_text)
                    print_fit_report(report)
                    print("You can now ask follow-up questions about the fit.")
                except (EOFError, KeyboardInterrupt):
                    print("\nJob description input cancelled.")
                except (ValueError, FileNotFoundError) as e:
                    print(f"Invalid job description: {e}")
                except RuntimeError as e:
                    print(f"Service or file error while evaluating the job description: {e}")
                except Exception as e:
                    print(f"Unexpected job evaluation error ({type(e).__name__}): {e}")
            elif cmd == "/fit":
                if conv.fit_report:
                    print_fit_report(conv.fit_report)
                else:
                    print("No job description yet. Use /jd <file> or /jd paste.")
            elif cmd == "/delete":
                if arg == conv.id:
                    print("Can't delete the active conversation. /switch or /new first.")
                else:
                    try:
                        if store.delete(arg):
                            print(f"Deleted {arg}")
                        else:
                            print("Conversation not found.")
                    except (ValueError, RuntimeError) as e:
                        print(f"Could not delete conversation: {e}")
            else:
                print("Unknown command. Type /help")
            continue

        try:
            reply = bot.ask(conv, user_input)
            print_metadata(reply.metadata)
        except (ValueError, FileNotFoundError) as e:
            print(f"\nInput/data error: {e}")
        except RuntimeError as e:
            print(f"\nService error: {e}")
        except Exception as e:
            print(f"\nUnexpected error ({type(e).__name__}): {e}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nChatbot stopped by user.")