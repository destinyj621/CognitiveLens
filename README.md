# CognitiveLens

A Retrieval-Augmented Generation (RAG) system that answers questions about dementia research grounded in real PubMed medical literature.

## Overview

CognitiveLens combines biomedical literature retrieval with large language model generation to produce cited, evidence-based answers about dementia, Alzheimer's disease, and related neurodegenerative conditions. Every answer traces back to real PubMed abstracts, so you can verify the source.

**Stack:**
- **PubMed / Biopython Entrez** — fetches abstracts from NCBI
- **LangChain** — text chunking with `RecursiveCharacterTextSplitter`
- **Sentence Transformers** (`all-MiniLM-L6-v2`) — semantic embeddings
- **ChromaDB** — persistent local vector store
- **Anthropic Claude** (`claude-opus-4-8`) — answer generation with adaptive thinking
- **FastAPI** — REST backend
- **Streamlit** — interactive web frontend

## Project Structure

```
CognitiveLens/
├── data/raw/                    # PubMed JSON (generated, not tracked)
├── ingestion/
│   ├── fetch_pubmed.py          # Search PubMed and download abstracts
│   ├── clean.py                 # Normalize and filter abstracts
│   └── embed_and_store.py       # Chunk, embed, and persist to ChromaDB
├── retrieval/
│   └── query_engine.py          # Embed query → retrieve → generate answer
├── api/
│   └── main.py                  # FastAPI endpoints
├── frontend/
│   └── app.py                   # Streamlit UI
├── chroma_store/                # ChromaDB data (generated, not tracked)
├── .env                         # API keys (not tracked)
├── requirements.txt
└── README.md
```

## Setup

### 1. Clone and create a virtual environment

```bash
git clone https://github.com/your-username/CognitiveLens.git
cd CognitiveLens
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env` and fill in your credentials:

```bash
cp .env .env.local   # optional — or edit .env directly
```

`.env` contents:

```
ANTHROPIC_API_KEY=sk-ant-...
PUBMED_EMAIL=your_email@example.com
```

- **`ANTHROPIC_API_KEY`** — obtain from [console.anthropic.com](https://console.anthropic.com)
- **`PUBMED_EMAIL`** — required by NCBI for API usage (any valid email works)

## Running the Ingestion Pipeline

Run these three steps once (or whenever you want to refresh the literature):

```bash
# Step 1: Fetch abstracts from PubMed (~500 abstracts across 10 dementia topics)
python ingestion/fetch_pubmed.py

# Step 2: Clean and normalize the text
python ingestion/clean.py

# Step 3: Chunk, embed, and store in ChromaDB
python ingestion/embed_and_store.py
```

This creates `data/raw/pubmed_abstracts.json`, `data/raw/pubmed_clean.json`, and the `chroma_store/` directory.

## Running the Application

### Option A: Streamlit frontend (recommended)

```bash
streamlit run frontend/app.py
```

Open [http://localhost:8501](http://localhost:8501) in your browser.

### Option B: FastAPI backend

```bash
uvicorn api.main:app --reload
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

**Query endpoint:**

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What biomarkers diagnose Alzheimer disease?"}'
```

## How It Works

1. **Ingestion** — `fetch_pubmed.py` queries PubMed using 10 dementia-related search terms, downloading up to 50 abstracts per term. `clean.py` normalizes whitespace and removes non-ASCII. `embed_and_store.py` splits each abstract into ~500-character overlapping chunks, encodes them with `all-MiniLM-L6-v2`, and stores them in ChromaDB with metadata (PMID, title, authors, journal, year, URL).

2. **Retrieval** — At query time, the question is embedded with the same model. ChromaDB retrieves the top-5 most similar chunks by cosine similarity.

3. **Generation** — The 5 chunks are formatted as a numbered reference list and passed to Claude (`claude-opus-4-8`) with a system prompt instructing it to answer using only the provided evidence and cite sources.

4. **Frontend** — The Streamlit UI displays the generated answer followed by expandable source cards for each retrieved abstract, including a direct PubMed link.

## Search Topics Covered

The ingestion pipeline covers these areas of dementia research:

- Alzheimer's disease pathophysiology
- Dementia biomarkers and diagnosis
- Tau protein and neurodegeneration
- Amyloid beta and treatment approaches
- Vascular dementia risk factors
- Lewy body dementia symptoms
- Frontotemporal dementia genetics
- Dementia prevention and lifestyle
- Cholinesterase inhibitors
- APOE4 and genetic risk

## License

MIT
