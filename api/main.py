"""FastAPI backend for CognitiveLens RAG system."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from retrieval.query_engine import answer, retrieve

app = FastAPI(
    title="CognitiveLens API",
    description="RAG system for dementia research literature",
    version="1.0.0",
)


class QueryRequest(BaseModel):
    question: str


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
            sources=[SourceItem(**s) for s in result["sources"]],
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Vector store not found. Run the ingestion pipeline first.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrieve")
def retrieve_chunks(request: QueryRequest):
    """Return raw retrieved chunks without generating an answer."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")
    try:
        chunks = retrieve(request.question)
        return {"question": request.question, "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
