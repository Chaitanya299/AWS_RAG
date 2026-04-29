from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Chunk(BaseModel):
    """Represents a chunk of a document."""
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    score: Optional[float] = None

class Document(BaseModel):
    """Represents a full document."""
    id: str
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Query(BaseModel):
    """Represents a user query."""
    text: str
    domain_context: Optional[str] = None

class RAGResponse(BaseModel):
    """Represents the response from the RAG system."""
    answer: str
    source_chunks: List[Chunk] = Field(default_factory=list)
    latency_ms: float
    is_safe: bool = True
    is_in_domain: bool = True
