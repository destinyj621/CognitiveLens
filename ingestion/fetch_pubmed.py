"""Fetch dementia-related abstracts from PubMed via Biopython Entrez."""
import json
import os
import time
from pathlib import Path

from Bio import Entrez
from dotenv import load_dotenv

load_dotenv()

Entrez.email = os.getenv("PUBMED_EMAIL", "research@example.com")

SEARCH_TERMS = [
    "Alzheimer's disease pathophysiology",
    "dementia biomarkers diagnosis",
    "tau protein neurodegeneration",
    "amyloid beta dementia treatment",
    "vascular dementia risk factors",
    "Lewy body dementia symptoms",
    "frontotemporal dementia genetics",
    "dementia prevention lifestyle",
    "cholinesterase inhibitors Alzheimer",
    "APOE4 dementia risk",
]

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw"
OUTPUT_FILE = OUTPUT_DIR / "pubmed_abstracts.json"
MAX_RESULTS_PER_TERM = 50


def search_pubmed(query: str, max_results: int = MAX_RESULTS_PER_TERM) -> list[str]:
    handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results, sort="relevance")
    record = Entrez.read(handle)
    handle.close()
    return record["IdList"]


def fetch_abstracts(pmids: list[str]) -> list[dict]:
    if not pmids:
        return []
    ids = ",".join(pmids)
    handle = Entrez.efetch(db="pubmed", id=ids, rettype="abstract", retmode="xml")
    records = Entrez.read(handle)
    handle.close()

    articles = []
    for article in records.get("PubmedArticle", []):
        medline = article["MedlineCitation"]
        art = medline["Article"]

        pmid = str(medline["PMID"])
        title = str(art.get("ArticleTitle", ""))

        abstract_texts = art.get("Abstract", {}).get("AbstractText", [])
        if isinstance(abstract_texts, list):
            abstract = " ".join(str(t) for t in abstract_texts)
        else:
            abstract = str(abstract_texts)

        if not abstract.strip():
            continue

        authors = []
        for a in art.get("AuthorList", []):
            last = a.get("LastName", "")
            fore = a.get("ForeName", "")
            if last:
                authors.append(f"{last} {fore}".strip())

        journal = art.get("Journal", {}).get("Title", "")
        year = (
            art.get("Journal", {})
            .get("JournalIssue", {})
            .get("PubDate", {})
            .get("Year", "")
        )

        articles.append(
            {
                "pmid": pmid,
                "title": title,
                "abstract": abstract,
                "authors": authors,
                "journal": journal,
                "year": str(year),
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return articles


def run():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_articles: dict[str, dict] = {}

    for term in SEARCH_TERMS:
        print(f"Searching: {term}")
        pmids = search_pubmed(term)
        print(f"  Found {len(pmids)} PMIDs")
        articles = fetch_abstracts(pmids)
        for a in articles:
            all_articles[a["pmid"]] = a
        time.sleep(0.4)

    results = list(all_articles.values())
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(results)} unique abstracts to {OUTPUT_FILE}")


if __name__ == "__main__":
    run()
