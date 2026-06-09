"""Clean and normalize PubMed abstracts before embedding."""
import json
import re
from pathlib import Path

RAW_FILE = Path(__file__).parent.parent / "data" / "raw" / "pubmed_abstracts.json"
CLEAN_FILE = Path(__file__).parent.parent / "data" / "raw" / "pubmed_clean.json"


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x20-\x7E\n]", " ", text)
    text = text.strip()
    return text


def run():
    with open(RAW_FILE, encoding="utf-8") as f:
        articles = json.load(f)

    cleaned = []
    for a in articles:
        abstract = clean_text(a.get("abstract", ""))
        title = clean_text(a.get("title", ""))
        if len(abstract) < 50:
            continue
        cleaned.append(
            {
                "pmid": a["pmid"],
                "title": title,
                "abstract": abstract,
                "authors": a.get("authors", []),
                "journal": clean_text(a.get("journal", "")),
                "year": a.get("year", ""),
                "url": a.get("url", ""),
            }
        )

    with open(CLEAN_FILE, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=2, ensure_ascii=False)

    print(f"Cleaned {len(cleaned)} articles -> {CLEAN_FILE}")


if __name__ == "__main__":
    run()
