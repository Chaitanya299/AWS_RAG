# RAG Pipeline Architecture

This document describes the data flow and component interactions in the AWS Assistant RAG API.

## High-Level Flow

```
User Query
    │
    ▼
[ PromptInjectionGuard ] ───▶ (Blocks if malicious)
    │
    ▼
[ DomainGuard ] ────────────▶ (Blocks if out-of-scope)
    │
    ▼
[ Redis Cache ] ────────────▶ (Returns cached RAGResponse if hit)
    │
    ▼
[ Hybrid Retriever ]
    ├── ChromaDB (Dense Vector Search)
    └── BM25 (Keyword Search)
    │
    ▼
[ Context Assembler ] ──────▶ (Wraps context in XML tags)
    │
    ▼
[ Response Generator ] ─────▶ (Claude 3.5 Sonnet)
    │
    ▼
[ ResponseGuard ] ──────────▶ (Hallucination check)
    │
    ▼
[ Final Answer ] ───────────▶ (Return to User)
```

## Component Responsibilities

### Domain Layer
- **Models**: Defines `Chunk`, `Document`, `Query`, and `RAGResponse`.
- **Exceptions**: Specialized error types for security and domain violations.

### Application Layer
- **RAGService**: Orchestrates the pipeline stages.
- **Ingestion**: Handles PDF loading, chunking, and vector store population.

### Infrastructure Layer
- **VectorStore**: Manages ChromaDB persistence and hybrid search logic.
- **API**: FastAPI routes and request/response validation.

### Shared Layer
- **Guardrails**: Implementation of safety logic and boundary enforcement.
