# CognitiveLens

CognitiveLens is an AI-powered research assistant that answers questions about dementia and Alzheimer's disease using real, peer-reviewed medical literature. Instead of generating generic responses, it retrieves actual PubMed abstracts relevant to your question and uses Claude to synthesize a cited, evidence-grounded answer — so every claim can be traced back to a real study.

**Live:** https://destinyj621.github.io/CognitiveLens/

---

## Why I Built This

Dementia affects over 55 million people worldwide, yet the research landscape is dense and difficult to navigate. Most people searching for answers online encounter either oversimplified summaries or impenetrable journal articles. CognitiveLens sits in the middle — it understands natural language questions and responds with answers that are both readable and scientifically grounded, with direct links back to the source material.

---

## What I Built

### Ingestion Pipeline
Designed and built a full literature ingestion pipeline that fetches PubMed abstracts across 10 core dementia research topics using the Biopython Entrez API. Abstracts are cleaned, normalized, and chunked into overlapping 500-character segments using LangChain's RecursiveCharacterTextSplitter, then embedded with Sentence Transformers (all-MiniLM-L6-v2) and persisted to a ChromaDB vector store — resulting in 2,228 searchable chunks from 466 unique papers.

### RAG Query Engine
Built a retrieval-augmented generation pipeline that embeds each user question at query time, retrieves the top-5 most semantically similar chunks via cosine similarity, and passes them to Claude (claude-opus-4-8) with adaptive thinking enabled. Claude generates a structured, cited answer using only what the retrieved literature states — no hallucination, no speculation beyond the sources.

### Multi-Turn Conversational Memory
Extended the query engine to support multi-turn conversations by passing prior message history to Claude alongside the freshly retrieved context on each turn. Users can ask follow-up questions and Claude maintains conversational context while still grounding every response in the literature.

### RAGAS-Style Evaluation
Built a custom LLM-as-judge evaluation pipeline using Claude Haiku to score every answer on three metrics: faithfulness (are all claims supported by the retrieved sources?), answer relevance (does the answer address what was asked?), and context precision (were the right chunks retrieved?). Scores are displayed as color-coded circular gauges in a slide-in evaluation drawer.

### Streaming API
Built a FastAPI backend with a Server-Sent Events streaming endpoint (`/chat/stream`) using the Anthropic async Python client. Responses stream token-by-token to the frontend in real time. The backend handles all Claude API calls server-side, keeping the API key secure and never exposed to the browser.

### React Frontend
Built a production-grade React frontend using Vite and Tailwind CSS with a dark medical-tech aesthetic. Features include real-time streaming text rendering, a multi-turn chat interface with message history, collapsible source accordions with relevance scores and PubMed links, an evaluation drawer with animated score rings, an auto-resizing input, and a custom SVG neural lens logo. Deployed to GitHub Pages with CI/CD via GitHub Actions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Literature source | PubMed via Biopython Entrez |
| Text chunking | LangChain RecursiveCharacterTextSplitter |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Vector store | ChromaDB |
| Answer generation | Anthropic Claude (claude-opus-4-8) with adaptive thinking |
| Evaluation | Claude Haiku as LLM judge |
| Backend | FastAPI with SSE streaming |
| Frontend | React, Vite, Tailwind CSS |
| Deployment | Railway (API) + GitHub Pages (frontend) + GitHub Actions (CI/CD) |

---

## Limitations

- The knowledge base reflects PubMed literature available at ingestion time. Re-running the ingestion pipeline refreshes it.
- Answers are only as good as the retrieved chunks. Highly specific or niche questions may not find strong matches.
- This is not a medical device and should not be used for clinical decision-making.
