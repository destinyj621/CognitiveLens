"""RAGAS-style RAG evaluation using Claude Haiku as the judge."""
import json
import os
import re

import anthropic
from dotenv import load_dotenv

load_dotenv()


def evaluate_answer(question: str, answer: str, contexts: list[str]) -> dict:
    """Score a RAG answer on faithfulness, answer relevance, and context precision."""
    context_text = "\n\n---\n\n".join(
        f"[Context {i + 1}]: {c}" for i, c in enumerate(contexts)
    )

    prompt = f"""You are an expert evaluator of biomedical RAG (Retrieval-Augmented Generation) systems.

Score the following RAG output on three metrics. Each score must be between 0.0 and 1.0.

QUESTION:
{question}

GENERATED ANSWER:
{answer}

RETRIEVED CONTEXTS:
{context_text}

METRICS:

1. FAITHFULNESS (0.0-1.0)
   Does the answer ONLY make claims directly supported by the retrieved contexts?
   1.0 = every claim is grounded in the contexts; 0.0 = many unsupported claims.

2. ANSWER_RELEVANCE (0.0-1.0)
   Does the answer directly and completely address what was asked?
   1.0 = fully addresses the question; 0.0 = off-topic or evasive.

3. CONTEXT_PRECISION (0.0-1.0)
   What fraction of the retrieved contexts contain information useful for answering this question?
   1.0 = all retrieved chunks are relevant; 0.0 = none are relevant.

Return ONLY valid JSON with no extra text:
{{"faithfulness": <float>, "answer_relevance": <float>, "context_precision": <float>, "reasoning": "<one concise sentence explaining the scores>"}}"""

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"Could not parse evaluation response: {raw}")
    return json.loads(match.group())
