"""Streamlit frontend for CognitiveLens — dementia research RAG assistant."""
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))

from retrieval.evaluator import evaluate_answer
from retrieval.query_engine import chat

st.set_page_config(
    page_title="CognitiveLens",
    page_icon="🧠",
    layout="wide",
)

st.title("🧠 CognitiveLens")
st.subheader("Dementia Research Assistant — Grounded in PubMed Literature")

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "last_result" not in st.session_state:
    st.session_state.last_result = None
if "eval_scores" not in st.session_state:
    st.session_state.eval_scores = None

with st.sidebar:
    st.header("About")
    st.markdown(
        """
**CognitiveLens** is a Retrieval-Augmented Generation (RAG) system that:

1. Fetches abstracts from **PubMed**
2. Chunks and embeds them with **Sentence Transformers**
3. Stores vectors in **ChromaDB**
4. Retrieves the top-5 relevant chunks per query
5. Generates answers with **Claude (claude-opus-4-8)**

All answers are grounded in cited literature.
        """
    )
    st.divider()
    st.markdown("**Example questions:**")
    examples = [
        "What is dementia and how does it affect the brain?",
        "What are the early warning signs of dementia?",
        "Is dementia hereditary? Can it run in families?",
        "Can dementia be prevented? What helps reduce the risk?",
        "What is the difference between dementia and Alzheimer's disease?",
    ]
    for ex in examples:
        if st.button(ex, use_container_width=True):
            st.session_state["inject_question"] = ex

    st.divider()
    if st.button("Clear conversation", use_container_width=True):
        st.session_state.messages = []
        st.session_state.last_result = None
        st.session_state.eval_scores = None
        st.rerun()

tab_chat, tab_eval = st.tabs(["Chat", "Evaluate Last Answer"])

# ── Chat Tab ──────────────────────────────────────────────────────────────────
with tab_chat:
    # Render conversation history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg["role"] == "assistant" and msg.get("sources"):
                with st.expander(f"View {len(msg['sources'])} retrieved sources"):
                    for i, src in enumerate(msg["sources"], 1):
                        cols = st.columns([3, 1])
                        with cols[0]:
                            st.markdown(f"**[{i}] {src['title']}** ({src['year']})")
                            st.caption(
                                f"{src['authors']} — {src['journal']} — "
                                f"Relevance: {src['score']:.3f}"
                            )
                        with cols[1]:
                            if src.get("url"):
                                st.link_button("PubMed", src["url"])

    st.divider()

    # Pre-fill from sidebar example click
    prefill = st.session_state.pop("inject_question", "")

    with st.form("chat_form", clear_on_submit=True):
        user_input = st.text_area(
            "Your question:",
            value=prefill,
            height=80,
            placeholder="Ask anything about dementia, or ask a follow-up...",
        )
        submitted = st.form_submit_button("Send", type="primary")

    if submitted and user_input.strip():
        question = user_input.strip()

        # Build Claude history from previous turns (role + plain content only)
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in st.session_state.messages
        ]

        # Show user message immediately
        st.session_state.messages.append({"role": "user", "content": question})

        with st.spinner("Searching literature and generating answer..."):
            try:
                result = chat(question, history)
            except FileNotFoundError:
                st.error(
                    "Vector store not found. Run the ingestion pipeline first:\n\n"
                    "```\npython ingestion/fetch_pubmed.py\n"
                    "python ingestion/clean.py\n"
                    "python ingestion/embed_and_store.py\n```"
                )
                st.session_state.messages.pop()
                st.stop()
            except Exception as e:
                st.error(f"Error: {e}")
                st.session_state.messages.pop()
                st.stop()

        st.session_state.messages.append({
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
        })
        st.session_state.last_result = result
        st.session_state.eval_scores = None  # clear stale scores on new question
        st.rerun()

    elif submitted and not user_input.strip():
        st.warning("Please enter a question before sending.")

# ── Evaluation Tab ────────────────────────────────────────────────────────────
with tab_eval:
    if not st.session_state.last_result:
        st.info("Ask a question in the Chat tab first, then run evaluation here.")
    else:
        result = st.session_state.last_result

        st.markdown("### Answer to Evaluate")
        st.markdown(f"**Question:** {result['question']}")
        with st.expander("View full answer"):
            st.markdown(result["answer"])

        st.divider()

        if st.button("Run Evaluation", type="primary"):
            with st.spinner("Evaluating with Claude Haiku (faithfulness, relevance, precision)..."):
                contexts = [s["text"] for s in result["sources"]]
                try:
                    scores = evaluate_answer(result["question"], result["answer"], contexts)
                    st.session_state.eval_scores = scores
                except Exception as e:
                    st.error(f"Evaluation failed: {e}")

        if st.session_state.eval_scores:
            scores = st.session_state.eval_scores

            st.markdown("### Scores")
            c1, c2, c3 = st.columns(3)

            with c1:
                val = float(scores.get("faithfulness", 0))
                st.metric("Faithfulness", f"{val:.2f} / 1.00")
                st.progress(val)
                st.caption("Is every claim in the answer supported by the retrieved abstracts?")

            with c2:
                val = float(scores.get("answer_relevance", 0))
                st.metric("Answer Relevance", f"{val:.2f} / 1.00")
                st.progress(val)
                st.caption("Does the answer directly address what was asked?")

            with c3:
                val = float(scores.get("context_precision", 0))
                st.metric("Context Precision", f"{val:.2f} / 1.00")
                st.progress(val)
                st.caption("What fraction of retrieved chunks were actually useful?")

            if scores.get("reasoning"):
                st.info(scores["reasoning"])
