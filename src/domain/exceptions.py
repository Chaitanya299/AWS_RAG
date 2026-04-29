class RAGException(Exception):
    """Base exception for RAG system."""
    pass

class SafetyException(RAGException):
    """Raised when a safety violation is detected."""
    pass

class PromptInjectionException(SafetyException):
    """Raised when prompt injection is detected."""
    pass

class DomainBoundaryException(RAGException):
    """Raised when a query is outside the allowed domain."""
    pass

class HallucinationException(RAGException):
    """Raised when a potential hallucination is detected in the response."""
    pass
