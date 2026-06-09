"""RAG query engine: embed question → retrieve top-5 chunks → generate answer with Claude."""
import os
from pathlib import Path

import anthropic
import chromadb
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

CHROMA_DIR = str(Path(__file__).parent.parent / "chroma_store")
COLLECTION_NAME = "dementia_research"
EMBED_MODEL = "all-MiniLM-L6-v2"
TOP_K = 5

_model: SentenceTransformer | None = None
_collection = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_collection(COLLECTION_NAME)
    return _collection


def retrieve(question: str, top_k: int = TOP_K) -> list[dict]:
    model = _get_model()
    embedding = model.encode(question).tolist()
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({"text": doc, "metadata": meta, "score": 1 - dist})
    return chunks


def build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        m = c["metadata"]
        citation = f"[{i}] {m.get('title', 'Unknown')} — {m.get('authors', '')} ({m.get('year', 'n.d.')}). {m.get('journal', '')}. PMID: {m.get('pmid', '')}. {m.get('url', '')}"
        parts.append(f"{citation}\n\n{c['text']}")
    return "\n\n---\n\n".join(parts)


def answer(question: str) -> dict:
    chunks = retrieve(question)
    context = build_context(chunks)

    system_prompt = (
        "You are a biomedical research assistant specializing in dementia and neurodegenerative diseases. "
        "Answer questions using ONLY the provided PubMed abstracts. "
        "Be precise, cite sources by their numbered reference, and acknowledge uncertainty when the evidence is limited. "
        "Do not speculate beyond what the literature states."
    )

    user_prompt = f"""Based on the following PubMed abstracts, answer the question below.

QUESTION: {question}

ABSTRACTS:
{context}

Provide a well-structured answer citing the relevant sources (e.g., [1], [2]). End your answer with a 'Sources' section listing the referenced papers."""

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    response_text = ""
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=1500,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        response_text = stream.get_final_message().content[-1].text

    sources = [
        {
            "pmid": c["metadata"].get("pmid", ""),
            "title": c["metadata"].get("title", ""),
            "authors": c["metadata"].get("authors", ""),
            "journal": c["metadata"].get("journal", ""),
            "year": c["metadata"].get("year", ""),
            "url": c["metadata"].get("url", ""),
            "score": round(c["score"], 4),
        }
        for c in chunks
    ]

    return {"answer": response_text, "sources": sources, "question": question}


if __name__ == "__main__":
    q = "What are the main biomarkers used to diagnose Alzheimer's disease?"
    result = answer(q)
    print(result["answer"])
    print("\n--- Sources ---")
    for s in result["sources"]:
        print(f"  [{s['pmid']}] {s['title']} ({s['year']})")
