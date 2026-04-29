from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb
from typing import List, Optional, Dict
from src.domain.models import Chunk, Document
from config.settings import settings
from rank_bm25 import BM25Okapi
import numpy as np

class VectorStoreRepository:
    """Infrastructure layer for managing document embeddings and RRF hybrid search."""

    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)

        # Use OpenAI Embeddings for superior semantic understanding
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY
        )

        self.collection = self.client.get_or_create_collection(
            name="aws_knowledge_v2",  # Updated for AWS context
            metadata={"hnsw:space": "cosine"}
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,  # Slightly larger for legal context
            chunk_overlap=300,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        self._bm25: Optional[BM25Okapi] = None
        self._all_chunks: List[str] = []
        self._all_metadatas: List[dict] = []

    def add_documents(self, documents: List[Document]):
        """Adds documents to the vector store after advanced chunking and embedding."""
        ids = []
        metadatas = []
        documents_text = []

        for doc in documents:
            chunks = self.text_splitter.split_text(doc.content)
            for i, chunk_text in enumerate(chunks):
                if not chunk_text.strip():
                    continue
                chunk_id = f"{doc.id}_{i}"
                ids.append(chunk_id)
                meta = {**doc.metadata, "doc_id": doc.id, "title": doc.title, "chunk_index": i}
                metadatas.append(meta)
                documents_text.append(chunk_text)

        if ids:
            print(f"Generating OpenAI embeddings for {len(ids)} chunks...")
            # We use ChromaDB's built-in support for embeddings or manually provide them
            embeddings_list = self.embeddings.embed_documents(documents_text)

            print(f"Adding chunks to ChromaDB...")
            batch_size = 100
            for i in range(0, len(ids), batch_size):
                self.collection.add(
                    ids=ids[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size],
                    documents=documents_text[i:i+batch_size],
                    embeddings=embeddings_list[i:i+batch_size]
                )

            # Update BM25 index for keyword search
            self._all_chunks.extend(documents_text)
            self._all_metadatas.extend(metadatas)
            tokenized_corpus = [doc.lower().split() for doc in self._all_chunks]
            self._bm25 = BM25Okapi(tokenized_corpus)

    def search(self, query: str, top_k: int = 10) -> List[Chunk]:
        """
        Performs a hybrid search using Reciprocal Rank Fusion (RRF).
        RRF combines the strengths of dense (semantic) and sparse (keyword) search.
        """
        # 1. Vector Search (Dense)
        query_embedding = self.embeddings.embed_query(query)
        vector_results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2
        )

        # 2. BM25 Search (Keyword)
        bm25_results = []
        if self._bm25:
            tokenized_query = query.lower().split()
            scores = self._bm25.get_scores(tokenized_query)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k * 2]
            for idx in top_indices:
                bm25_results.append({
                    "content": self._all_chunks[idx],
                    "metadata": self._all_metadatas[idx]
                })

        # 3. Reciprocal Rank Fusion (RRF)
        # RRF Score = sum(1 / (k + rank))
        k_rrf = 60
        rrf_scores: Dict[str, float] = {}
        content_to_meta: Dict[str, dict] = {}

        # Process Vector Ranks
        if vector_results["documents"]:
            for rank, content in enumerate(vector_results["documents"][0]):
                rrf_scores[content] = rrf_scores.get(content, 0) + (1 / (k_rrf + rank + 1))
                content_to_meta[content] = vector_results["metadatas"][0][rank]

        # Process BM25 Ranks
        for rank, res in enumerate(bm25_results):
            content = res["content"]
            rrf_scores[content] = rrf_scores.get(content, 0) + (1 / (k_rrf + rank + 1))
            if content not in content_to_meta:
                content_to_meta[content] = res["metadata"]

        # Sort by RRF score
        sorted_results = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)[:top_k]

        return [
            Chunk(
                content=content,
                metadata=content_to_meta[content],
                score=score
            ) for content, score in sorted_results
        ]
