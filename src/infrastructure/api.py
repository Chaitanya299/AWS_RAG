import time
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, Depends, Security, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request as StarletteRequest

from src.application.rag_service import RAGService
from src.domain.exceptions import SafetyException, DomainBoundaryException
from config.settings import settings

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AWS Assistant RAG API")
api_router = APIRouter(prefix="/api")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In production, replace with your specific frontend domain or use ALLOWED_ORIGINS env var
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@api_router.post("/query", response_model=QueryResponse)
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
    except Exception as e:
        # Production would log the full stack trace
        raise HTTPException(status_code=500, detail="Internal processing error.")

@api_router.post("/stream-query")
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

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "domain": settings.DOMAIN_NAME}

@app.get("/")
async def root():
    return {
        "message": "AWS Assistant RAG API is running.",
        "api_docs": "/docs",
        "health": "/api/health"
    }

app.include_router(api_router)
