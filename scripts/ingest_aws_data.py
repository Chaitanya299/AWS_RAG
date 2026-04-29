import argparse
import os
from langchain_community.document_loaders import PyPDFLoader
from src.infrastructure.vector_store import VectorStoreRepository
from src.domain.models import Document

def ingest_aws_pdf(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return

    print(f"Loading PDF: {file_path}")
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    print(f"Loaded {len(pages)} pages. Preparing for ingestion...")

    # Use repository directly to avoid requiring LLM API keys for ingestion
    vector_store = VectorStoreRepository()

    documents = []
    for i, page in enumerate(pages):
        # Extract page number and other metadata if available
        metadata = page.metadata if page.metadata else {}
        metadata["page_label"] = str(i + 1)

        documents.append(Document(
            id=f"aws_doc_p{i}",
            title=f"AWS Overview Whitepaper",
            content=page.page_content,
            metadata=metadata
        ))

    print(f"Ingesting {len(documents)} pages into high-precision vector store...")
    vector_store.add_documents(documents)
    print("Ingestion complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest AWS Overview PDF.")
    parser.add_argument("--file", type=str, default="aws-overview.pdf", help="Path to the PDF file.")
    args = parser.parse_args()

    ingest_aws_pdf(args.file)
