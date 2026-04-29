# RAG Pipeline Architecture — AWS Assistant

This document describes the data flow and component interactions in the established AWS Assistant RAG system.

## High-Level Flow (Production)

```
User Query 
    │
    ▼
[ PromptInjectionGuard ] ───▶ (Blocks if malicious instructions detected)
    │
    ▼
[ DomainGuard ] ────────────▶ (Graceful helpful boundary if out-of-scope)
    │
    ▼
[ Hybrid Retriever ] ───────▶ (Parallel Execution)
    ├── ChromaDB (Dense Vector Search: all-MiniLM-L6-v2)
    └── BM25 (Sparse Keyword Search)
    │
    ▼
[ RRF Fusion ] ─────────────▶ (Reciprocal Rank Fusion + Min-Max Normalization)
    │
    ▼
[ Context Assembler ] ──────▶ (Structured XML-tagged Context)
    │
    ▼
[ Response Generator ] ─────▶ (GPT-4o with GPT-4o-mini Fallback)
    │
    ▼
[ G-Eval Validator ] ───────▶ (LLM-as-a-judge: Faithfulness scoring)
    │
    ▼
[ Bento Dashboard ] ────────▶ (Streaming tokens + Thinking Stepper)
```

## Component Responsibilities

### Domain Layer
- **Models**: Defines `Chunk`, `Document`, `Query`, and `RAGResponse`.
- **Exceptions**: Specialized error types (DomainBoundary, Safety, Hallucination).
- **Normalized Scoring**: Logic for 0-100% match confidence calculation.

### Application Layer
- **RAGService**: Orchestrates parallel retrieval, domain verification, and multi-model generation logic.
- **Thinking Streams**: Yields real-time status events (`type: step`) for UI feedback.
- **Ingestion**: Recursive character splitting with context overlap for PDF processing.

### Infrastructure Layer
- **VectorStore**: Manages local ChromaDB persistence and BM25 hybrid search logic.
- **API**: FastAPI asynchronous endpoints with X-API-KEY security and Rate Limiting.
- **Vite Proxy**: Production-aligned local development routing.

### Shared Layer
- **Guardrails**: Implementation of Prompt Injection filters and helpful Domain-aware responses.
- **Evaluator**: G-Eval framework for measuring faithfulness and accuracy metrics.

## UI/UX Architecture
- **Layout**: 12-column Bento Grid for analytical workspace balancing.
- **Citations**: Interactive HoverCards with source peeking and scroll-to-source synchronization.
- **Telemetry**: Real-time Latency (needle gauge) and System Health pulse monitoring.
