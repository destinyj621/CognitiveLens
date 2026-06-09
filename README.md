# CognitiveLens

CognitiveLens is an AI-powered research assistant that answers questions about dementia and Alzheimer's disease using real, peer-reviewed medical literature. Instead of generating generic responses, it retrieves actual PubMed abstracts relevant to your question and uses Claude to synthesize a cited, evidence-grounded answer — so every claim can be traced back to a real study.

The goal is to make dementia research more accessible. Whether you're a caregiver trying to understand a diagnosis, a student exploring the field, or a clinician looking for a quick literature reference, CognitiveLens gives you answers that are rooted in science, not guesswork.

---

## Why This Exists

Dementia affects over 55 million people worldwide, yet the research landscape is dense and difficult to navigate. Most people searching for answers online encounter either oversimplified summaries or impenetrable journal articles. CognitiveLens sits in the middle — it understands natural language questions and responds with answers that are both readable and scientifically grounded, with direct links back to the source material.

---

## How It Works

CognitiveLens is built on a Retrieval-Augmented Generation (RAG) architecture:

1. **Literature ingestion** — PubMed abstracts are fetched across 10 core dementia research topics (Alzheimer's pathophysiology, biomarkers, tau proteins, amyloid beta, vascular dementia, Lewy body dementia, frontotemporal dementia, genetics, prevention, and treatment). Each abstract is cleaned, chunked into ~500-character overlapping segments, and embedded using a sentence transformer model.

2. **Semantic search** — When you ask a question, it is embedded using the same model and compared against all stored chunks using cosine similarity. The 5 most relevant chunks are retrieved from ChromaDB.

3. **Answer generation** — The retrieved chunks are passed to Claude (Opus 4) along with your question. Claude generates a structured, cited answer using only what the literature says — it does not speculate or draw from general knowledge.

4. **Evaluation** — Each answer can be scored on three metrics: faithfulness (are all claims supported by the sources?), answer relevance (does it address what was asked?), and context precision (were the right chunks retrieved?). Scoring is done by Claude Haiku acting as an LLM judge.

---

## Features

- **Conversational interface** — Ask follow-up questions and maintain context across a multi-turn conversation
- **Streaming responses** — Answers appear token by token as Claude generates them, just like a real conversation
- **Cited sources** — Every answer includes the retrieved abstracts with authors, journal, year, relevance score, and a direct PubMed link
- **Answer evaluation** — Run a RAGAS-style quality check on any answer to see faithfulness, relevance, and precision scores with color-coded gauges
- **Production React UI** — Dark-themed, responsive interface built with React, Vite, and Tailwind CSS
- **REST API** — FastAPI backend with a streaming `/chat/stream` endpoint and a `/evaluate` endpoint, usable independently of the frontend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Literature source | PubMed via Biopython Entrez |
| Text chunking | LangChain RecursiveCharacterTextSplitter |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Vector store | ChromaDB (persistent, local) |
| Answer generation | Anthropic Claude (claude-opus-4-8) with adaptive thinking |
| Evaluation | Claude Haiku as LLM judge |
| Backend | FastAPI with SSE streaming |
| Frontend | React + Vite + Tailwind CSS |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ (for the React frontend)
- An Anthropic API key

### Setup

```bash
git clone https://github.com/destinyj621/CognitiveLens.git
cd CognitiveLens

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Add your credentials to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
PUBMED_EMAIL=your@email.com
```

### Run the ingestion pipeline (one time)

```bash
python ingestion/fetch_pubmed.py    # fetch abstracts from PubMed
python ingestion/clean.py           # clean and normalize text
python ingestion/embed_and_store.py # embed and store in ChromaDB
```

### Launch

Double-click `start.bat` (Windows) — it opens the API and React frontend in separate terminal windows.

Or manually:

```bash
# Terminal 1 — API
uvicorn api.main:app --reload

# Terminal 2 — Frontend
cd frontend-react
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Project Structure

```
CognitiveLens/
├── ingestion/
│   ├── fetch_pubmed.py       # PubMed abstract fetcher
│   ├── clean.py              # Text normalization
│   └── embed_and_store.py    # Chunking, embedding, ChromaDB storage
├── retrieval/
│   ├── query_engine.py       # Semantic search + Claude generation
│   └── evaluator.py          # LLM-as-judge evaluation
├── api/
│   └── main.py               # FastAPI backend
├── frontend-react/           # React + Vite + Tailwind frontend
├── frontend/                 # Original Streamlit frontend (legacy)
├── data/raw/                 # Fetched abstracts (not tracked)
├── chroma_store/             # Vector database (not tracked)
├── start.bat                 # One-click launcher
└── requirements.txt
```

---

## Limitations

- The knowledge base reflects PubMed literature available at ingestion time. Re-run the ingestion pipeline to refresh it.
- Answers are only as good as the retrieved chunks. Highly specific or niche questions may not find strong matches.
- This is not a medical device and should not be used for clinical decision-making.

---

## License

MIT
