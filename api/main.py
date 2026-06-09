"""FastAPI backend for CognitiveLens RAG system."""
import asyncio
import json
import os

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from retrieval.evaluator import evaluate_answer
from retrieval.query_engine import answer, build_context, retrieve

load_dotenv()

app = FastAPI(
    title="CognitiveLens API",
    description="RAG system for dementia research literature",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "https://destinyj621.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = (
    "You are a biomedical research assistant specializing in dementia and neurodegenerative diseases. "
    "Answer questions using ONLY the provided PubMed abstracts. "
    "Be precise, cite sources by their numbered reference, and acknowledge uncertainty when evidence is limited. "
    "When answering follow-up questions, consider the conversation history but always ground answers in the provided abstracts."
)


class MessageItem(BaseModel):
    role: str
    content: str


class QueryRequest(BaseModel):
    question: str


class ChatRequest(BaseModel):
    question: str
    history: list[MessageItem] = []


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    contexts: list[str]


class SourceItem(BaseModel):
    pmid: str
    title: str
    authors: str
    journal: str
    year: str
    url: str
    score: float


class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: list[SourceItem]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")
    try:
        result = answer(request.question)
        return QueryResponse(
            question=result["question"],
            answer=result["answer"],
            sources=[SourceItem(**{k: v for k, v in s.items() if k != "text"}) for s in result["sources"]],
        )
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Vector store not found. Run the ingestion pipeline first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    async def generate():
        try:
            chunks = await asyncio.to_thread(retrieve, request.question)
            context = build_context(chunks)

            messages = [{"role": m.role, "content": m.content} for m in request.history]
            messages.append({
                "role": "user",
                "content": (
                    f"Based on the following PubMed abstracts, answer the question.\n\n"
                    f"QUESTION: {request.question}\n\n"
                    f"ABSTRACTS:\n{context}\n\n"
                    f"Provide a well-structured answer citing relevant sources (e.g., [1], [2]). "
                    f"End with a 'Sources' section."
                ),
            })

            aclient = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

            async with aclient.messages.stream(
                model="claude-opus-4-8",
                max_tokens=1500,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"

            sources = [
                {
                    "pmid": c["metadata"].get("pmid", ""),
                    "title": c["metadata"].get("title", ""),
                    "authors": c["metadata"].get("authors", ""),
                    "journal": c["metadata"].get("journal", ""),
                    "year": c["metadata"].get("year", ""),
                    "url": c["metadata"].get("url", ""),
                    "score": round(c["score"], 4),
                    "text": c["text"],
                }
                for c in chunks
            ]
            yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@app.post("/evaluate")
async def evaluate(request: EvaluateRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")
    try:
        scores = await asyncio.to_thread(
            evaluate_answer, request.question, request.answer, request.contexts
        )
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
