"""Streamlit frontend for CognitiveLens — dementia research RAG assistant."""
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))

from retrieval.query_engine import answer

st.set_page_config(
    page_title="CognitiveLens",
    page_icon="🧠",
    layout="wide",
)

st.title("🧠 CognitiveLens")
st.subheader("Dementia Research Assistant — Grounded in PubMed Literature")
st.markdown(
    "Ask any question about dementia, Alzheimer's disease, or related neurodegenerative conditions. "
    "Answers are generated using real PubMed abstracts retrieved from the knowledge base."
)

st.divider()

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
        "What biomarkers are used to diagnose Alzheimer's disease?",
        "How does the APOE4 gene increase dementia risk?",
        "What lifestyle factors can reduce the risk of dementia?",
        "What are the differences between Lewy body and vascular dementia?",
        "How do cholinesterase inhibitors work in Alzheimer's treatment?",
    ]
    for ex in examples:
        if st.button(ex, use_container_width=True):
            st.session_state["prefill"] = ex

question_value = st.session_state.pop("prefill", "")

with st.form("query_form", clear_on_submit=False):
    question = st.text_area(
        "Your question:",
        value=question_value,
        height=100,
        placeholder="e.g. What are the main risk factors for Alzheimer's disease?",
    )
    submitted = st.form_submit_button("Search Literature", type="primary")

if submitted and question.strip():
    with st.spinner("Retrieving relevant abstracts and generating answer..."):
        try:
            result = answer(question.strip())
        except FileNotFoundError:
            st.error(
                "Vector store not found. Please run the ingestion pipeline first:\n\n"
                "```\npython ingestion/fetch_pubmed.py\n"
                "python ingestion/clean.py\n"
                "python ingestion/embed_and_store.py\n```"
            )
            st.stop()
        except Exception as e:
            st.error(f"Error: {e}")
            st.stop()

    st.markdown("## Answer")
    st.markdown(result["answer"])

    st.divider()
    st.markdown("## Retrieved Sources")
    for i, src in enumerate(result["sources"], 1):
        with st.expander(f"[{i}] {src['title']} ({src['year']}) — Score: {src['score']:.3f}"):
            cols = st.columns([3, 1])
            with cols[0]:
                st.markdown(f"**Authors:** {src['authors']}")
                st.markdown(f"**Journal:** {src['journal']}")
                st.markdown(f"**PMID:** {src['pmid']}")
            with cols[1]:
                if src["url"]:
                    st.link_button("View on PubMed", src["url"])

elif submitted and not question.strip():
    st.warning("Please enter a question before searching.")
