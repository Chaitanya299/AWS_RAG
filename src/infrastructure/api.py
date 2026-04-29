import time
from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from src.application.rag_service import RAGService
from src.domain.exceptions import SafetyException, DomainBoundaryException
from config.settings import settings

app = FastAPI(title="AWS Assistant RAG API")

# Shared service instance
rag_service = RAGService()

class QueryRequest(BaseModel):
    question: str

class SourceChunkResponse(BaseModel):
    content: str
    metadata: dict
    score: Optional[float]

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunkResponse]
    latency_ms: float

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """
    Main entry point for domain-specific queries.
    Enforces safety and domain restrictions.
    """
    try:
        result = await rag_service.answer_query(request.question)

        return QueryResponse(
            answer=result.answer,
            sources=[
                SourceChunkResponse(
                    content=c.content,
                    metadata=c.metadata,
                    score=c.score
                ) for c in result.source_chunks
            ],
            latency_ms=result.latency_ms
        )

    except SafetyException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DomainBoundaryException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        # Production would log the full stack trace
        raise HTTPException(status_code=500, detail="Internal processing error.")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "domain": settings.DOMAIN_NAME}
