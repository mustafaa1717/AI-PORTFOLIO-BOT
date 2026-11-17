
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from portfolio import (
    load_resume,
    ConversationStore,
    ResumeChatbot,
    HISTORY_DIR,
    Resume,
    AnswerMetadata,
    FitReport,
)


# --------------------------------------------------
# APPLICATION STARTUP
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):

    try:
        # Load and parse the resume only once
        resume_text, resume = load_resume()

        # Initialize conversation storage
        store = ConversationStore(HISTORY_DIR)

        # Initialize chatbot
        chatbot = ResumeChatbot(
            resume_text,
            resume,
            store
        )

        # Make these objects available to API endpoints
        app.state.resume = resume
        app.state.store = store
        app.state.chatbot = chatbot

        print("Resume chatbot initialized successfully!")

    except Exception as e:
        print(f"Application startup failed: {e}")
        raise

    yield

    print("Resume chatbot shutting down...")


app = FastAPI(
    title="Resume Portfolio Chatbot API",
    description="API for an AI-powered resume assistant",
    version="1.0.0",
    lifespan=lifespan
)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env.strip() == "*":
    origins = ["*"]
    allow_credentials = False
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# PYDANTIC MODELS
# --------------------------------------------------

class ChatRequest(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    metadata: AnswerMetadata | None = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    message_count: int


class JobDescriptionRequest(BaseModel):
    description: str = Field(min_length=20, max_length=30000)


# --------------------------------------------------
# HELPER FUNCTION
# --------------------------------------------------

def get_conversation(conversation_id: str):

    try:
        conversation = app.state.store.load(conversation_id)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return conversation


# --------------------------------------------------
# HOME AND HEALTH ENDPOINTS
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Resume Portfolio Chatbot API is running"
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# --------------------------------------------------
# RESUME ENDPOINT
# --------------------------------------------------

@app.get("/resume", response_model=Resume)
def get_resume():

    return app.state.resume


# --------------------------------------------------
# CREATE A NEW CONVERSATION
# --------------------------------------------------

@app.post(
    "/conversations",
    response_model=ConversationResponse
)
def create_conversation():

    try:
        conversation = app.state.store.create()

        return ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            message_count=len(conversation.messages)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# GET ALL CONVERSATIONS
# --------------------------------------------------

@app.get("/conversations")
def get_all_conversations():

    try:
        conversations = app.state.store.list_all()

        return [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at,
                message_count=len(conv.messages)
            )
            for conv in conversations
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# CHAT ENDPOINT
# --------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    # Get the requested conversation
    conversation = get_conversation(
        request.conversation_id
    )

    try:
        # Generate answer and save conversation history
        assistant_message = app.state.chatbot.ask(
            conversation,
            request.question
        )

        return ChatResponse(
            conversation_id=conversation.id,
            answer=assistant_message.content,
            metadata=assistant_message.metadata
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e)
        )


# --------------------------------------------------
# GET CONVERSATION HISTORY
# --------------------------------------------------

@app.get("/conversations/{conversation_id}")
def get_conversation_history(conversation_id: str):

    conversation = get_conversation(conversation_id)

    return conversation


# --------------------------------------------------
# DELETE A CONVERSATION
# --------------------------------------------------

@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):

    try:
        deleted = app.state.store.delete(
            conversation_id
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        return {
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# JOB DESCRIPTION / RESUME FIT ENDPOINT
# --------------------------------------------------

@app.post("/conversations/{conversation_id}/job-description")
def evaluate_job_description(
    conversation_id: str,
    request: JobDescriptionRequest
):

    conversation = get_conversation(conversation_id)

    try:
        report = app.state.chatbot.set_job(
            conversation,
            request.description
        )

        return report

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=502,
            detail=str(e)
        )


# --------------------------------------------------
# GET LATEST FIT REPORT
# --------------------------------------------------

@app.get(
    "/conversations/{conversation_id}/fit",
    response_model=FitReport
)
def get_fit_report(conversation_id: str):

    conversation = get_conversation(conversation_id)

    if conversation.fit_report is None:
        raise HTTPException(
            status_code=404,
            detail="No job description has been evaluated yet"
        )

    return conversation.fit_report
