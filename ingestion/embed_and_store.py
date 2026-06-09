"""Chunk abstracts, embed with sentence-transformers, and store in ChromaDB."""
import json
from pathlib import Path

import chromadb
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

CLEAN_FILE = Path(__file__).parent.parent / "data" / "raw" / "pubmed_clean.json"
CHROMA_DIR = str(Path(__file__).parent.parent / "chroma_store")
COLLECTION_NAME = "dementia_research"
EMBED_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def run():
    with open(CLEAN_FILE, encoding="utf-8") as f:
        articles = json.load(f)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    print(f"Loading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)

    client = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    all_docs, all_embeddings, all_ids, all_meta = [], [], [], []
    chunk_idx = 0

    for article in articles:
        full_text = f"{article['title']}\n\n{article['abstract']}"
        chunks = splitter.split_text(full_text)

        for chunk in chunks:
            chunk_id = f"{article['pmid']}_{chunk_idx}"
            all_ids.append(chunk_id)
            all_docs.append(chunk)
            all_meta.append(
                {
                    "pmid": article["pmid"],
                    "title": article["title"],
                    "authors": ", ".join(article.get("authors", [])[:3]),
                    "journal": article.get("journal", ""),
                    "year": article.get("year", ""),
                    "url": article.get("url", ""),
                }
            )
            chunk_idx += 1

    print(f"Embedding {len(all_docs)} chunks...")
    all_embeddings = model.encode(all_docs, show_progress_bar=True).tolist()

    batch_size = 500
    for i in range(0, len(all_docs), batch_size):
        collection.add(
            ids=all_ids[i : i + batch_size],
            documents=all_docs[i : i + batch_size],
            embeddings=all_embeddings[i : i + batch_size],
            metadatas=all_meta[i : i + batch_size],
        )

    print(f"Stored {len(all_docs)} chunks in ChromaDB at {CHROMA_DIR}")


if __name__ == "__main__":
    run()
