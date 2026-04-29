# QUALITY.md

## Coding Standards
- **Python**: Follow PEP 8. Use type hints for all function signatures.
- **Async**: Use `async`/`await` for all I/O bound operations (API, Database, LLM).
- **Architecture**: Strict Domain-Driven Design (DDD) with bounded contexts.
- **Documentation**: All public methods must have docstrings (Google format).
- **Complexity**: Keep files under 500 lines.

## Testing Requirements
- **Unit Tests**: Minimum 80% coverage for domain and application layers.
- **Integration Tests**: Required for API endpoints and vector store interactions.
- **Safety Testing**: Adversarial prompt suite must pass for all releases.
- **Evaluation**: Accuracy and Hallucination rate must be measured using G-Eval.

## Review Checklist
- [ ] No secrets or API keys in source.
- [ ] Pydantic validation at all entry points.
- [ ] Context-aware error handling (no generic 500s).
- [ ] Latency and token usage metrics recorded for all LLM interactions.
- [ ] Multi-model fallback tested (Sonnet -> Haiku).
- [ ] Prompt injection filters verified with top 10 known patterns.
