import time
from fastapi import FastAPI, HTTPException, Request, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional
from src.application.rag_service import RAGService
from src.domain.exceptions import SafetyException, DomainBoundaryException
from config.settings import settings

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AWS Assistant RAG API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Import Request from starlette explicitly to ensure type match for slowapi
from fastapi.responses import StreamingResponse
from starlette.requests import Request as StarletteRequest

API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == settings.API_KEY:
        return api_key
    raise HTTPException(
        status_code=403, detail="Could not validate API Key"
    )

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
@limiter.limit("5/minute")
async def query_endpoint(
    request: Request,
    query_data: QueryRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Main entry point for domain-specific queries.
    Requires X-API-KEY header and enforces rate limiting.
    """
    try:
        result = await rag_service.answer_query(query_data.question)

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

@app.post("/stream-query")
@limiter.limit("5/minute")
async def stream_query_endpoint(
    request: Request,
    query_data: QueryRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Streaming endpoint for domain-specific queries.
    Provides immediate feedback for long answers.
    """
    return StreamingResponse(
        rag_service.stream_query(query_data.question),
        media_type="text/event-stream"
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "domain": settings.DOMAIN_NAME}
