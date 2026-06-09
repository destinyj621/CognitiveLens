"""
RAG query engine — 4-stage retrieval pipeline:
  1. Semantic vector search   (top-20 via ChromaDB)
  2. BM25 keyword search      (top-20 via rank_bm25)
  3. Reciprocal Rank Fusion   (merge → top-20 candidates)
  4. Cross-encoder re-ranking (ms-marco → top-5 final)
"""
import json
import os
from pathlib import Path

import anthropic
import chromadb
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
CHROMA_DIR        = str(Path(__file__).parent.parent / "chroma_store")
COLLECTION_NAME   = "dementia_research"
EMBED_MODEL       = "all-MiniLM-L6-v2"
CROSS_ENCODER     = "cross-encoder/ms-marco-MiniLM-L-6-v2"
BM25_CORPUS_FILE  = Path(__file__).parent.parent / "chroma_store" / "bm25_corpus.json"
CANDIDATE_K       = 20   # candidates pulled from each retriever
TOP_K             = 5    # final results returned after reranking
RRF_K             = 60   # RRF constant (higher = smoother rank fusion)

# ── Lazy singletons ───────────────────────────────────────────────────────────
_embed_model: SentenceTransformer | None = None
_collection                              = None
_bm25: BM25Okapi | None                 = None
_bm25_corpus: list[dict] | None         = None
_reranker: CrossEncoder | None          = None


def _get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL)
    return _embed_model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_collection(COLLECTION_NAME)
    return _collection


def _get_bm25() -> tuple[BM25Okapi, list[dict]]:
    global _bm25, _bm25_corpus
    if _bm25 is None:
        with open(BM25_CORPUS_FILE, encoding="utf-8") as f:
            _bm25_corpus = json.load(f)
        tokenized = [doc["text"].lower().split() for doc in _bm25_corpus]
        _bm25 = BM25Okapi(tokenized)
    return _bm25, _bm25_corpus


def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(CROSS_ENCODER)
    return _reranker


# ── Retrieval helpers ─────────────────────────────────────────────────────────

def _rrf(rankings: list[list[str]], k: int = RRF_K) -> list[tuple[str, float]]:
    """Reciprocal Rank Fusion — merge ranked lists into a single score."""
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def retrieve(question: str, top_k: int = TOP_K) -> list[dict]:
    """
    Full 4-stage retrieval pipeline.
    Returns top_k chunks ranked by cross-encoder relevance.
    """
    embed_model = _get_embed_model()
    collection  = _get_collection()
    bm25, corpus = _get_bm25()
    reranker    = _get_reranker()

    id_to_chunk = {doc["id"]: doc for doc in corpus}

    # Stage 1 — Semantic vector search
    embedding = embed_model.encode(question).tolist()
    vec_results = collection.query(
        query_embeddings=[embedding],
        n_results=CANDIDATE_K,
        include=["documents", "metadatas", "distances"],
    )
    vec_ids    = vec_results["ids"][0]
    vec_scores = {
        cid: 1 - dist
        for cid, dist in zip(vec_ids, vec_results["distances"][0])
    }

    # Stage 2 — BM25 keyword search
    tokens = question.lower().split()
    bm25_raw = bm25.get_scores(tokens)
    bm25_ids = [
        corpus[i]["id"]
        for i in sorted(range(len(corpus)), key=lambda i: bm25_raw[i], reverse=True)[:CANDIDATE_K]
    ]

    # Stage 3 — Reciprocal Rank Fusion
    fused         = _rrf([vec_ids, bm25_ids])
    candidate_ids = [doc_id for doc_id, _ in fused[:CANDIDATE_K]]

    candidates = []
    for doc_id in candidate_ids:
        if doc_id in id_to_chunk:
            entry = id_to_chunk[doc_id]
            candidates.append({
                "text":     entry["text"],
                "metadata": entry["metadata"],
                "score":    vec_scores.get(doc_id, 0.0),
            })

    # Stage 4 — Cross-encoder re-ranking
    if not candidates:
        return candidates

    pairs         = [(question, c["text"]) for c in candidates]
    rerank_scores = reranker.predict(pairs)

    ranked = sorted(zip(candidates, rerank_scores), key=lambda x: x[1], reverse=True)
    return [
        {**chunk, "rerank_score": float(score)}
        for chunk, score in ranked[:top_k]
    ]


def build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        m = c["metadata"]
        citation = (
            f"[{i}] {m.get('title', 'Unknown')} — {m.get('authors', '')} "
            f"({m.get('year', 'n.d.')}). {m.get('journal', '')}. "
            f"PMID: {m.get('pmid', '')}. {m.get('url', '')}"
        )
        parts.append(f"{citation}\n\n{c['text']}")
    return "\n\n---\n\n".join(parts)


# ── Generation ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a biomedical research assistant specializing in dementia and neurodegenerative diseases. "
    "Answer questions using ONLY the provided PubMed abstracts. "
    "Be precise, cite sources by their numbered reference, and acknowledge uncertainty when evidence is limited. "
    "Do not speculate beyond what the literature states."
)


def _make_sources(chunks: list[dict]) -> list[dict]:
    return [
        {
            "pmid":    c["metadata"].get("pmid", ""),
            "title":   c["metadata"].get("title", ""),
            "authors": c["metadata"].get("authors", ""),
            "journal": c["metadata"].get("journal", ""),
            "year":    c["metadata"].get("year", ""),
            "url":     c["metadata"].get("url", ""),
            "score":   round(c["score"], 4),
            "text":    c["text"],
        }
        for c in chunks
    ]


def answer(question: str) -> dict:
    chunks  = retrieve(question)
    context = build_context(chunks)

    user_prompt = (
        f"Based on the following PubMed abstracts, answer the question below.\n\n"
        f"QUESTION: {question}\n\n"
        f"ABSTRACTS:\n{context}\n\n"
        f"Provide a well-structured answer citing relevant sources (e.g., [1], [2]). "
        f"End with a 'Sources' section."
    )

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=1500,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        response_text = stream.get_final_message().content[-1].text

    return {"answer": response_text, "sources": _make_sources(chunks), "question": question}


def chat(question: str, history: list[dict]) -> dict:
    chunks  = retrieve(question)
    context = build_context(chunks)

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({
        "role": "user",
        "content": (
            f"Based on the following PubMed abstracts, answer the question.\n\n"
            f"QUESTION: {question}\n\n"
            f"ABSTRACTS:\n{context}\n\n"
            f"Provide a well-structured answer citing relevant sources (e.g., [1], [2]). "
            f"End with a 'Sources' section."
        ),
    })

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=1500,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        response_text = stream.get_final_message().content[-1].text

    return {"answer": response_text, "sources": _make_sources(chunks), "question": question}


if __name__ == "__main__":
    q = "What are the main biomarkers used to diagnose Alzheimer's disease?"
    result = answer(q)
    print(result["answer"])
    print("\n--- Sources ---")
    for s in result["sources"]:
        print(f"  [{s['pmid']}] {s['title']} ({s['year']}) — rerank: {s.get('rerank_score', 'n/a')}")
