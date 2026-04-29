import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from src.application.rag_service import RAGService
from src.domain.models import Chunk
from src.domain.exceptions import RAGException

@pytest.mark.asyncio
async def test_generate_answer_fallback():
    """Tests that _generate_answer falls back to the secondary model on failure."""

    # Mock settings
    with patch("src.application.rag_service.settings") as mock_settings:
        mock_settings.PRIMARY_MODEL = "gpt-4o"
        mock_settings.FALLBACK_MODEL = "gpt-4o-mini"
        mock_settings.DOMAIN_NAME = "AWS"
        mock_settings.REDIS_URL = "redis://localhost"

        # Mock VectorStoreRepository to avoid DB connections
        with patch("src.application.rag_service.VectorStoreRepository"), \
             patch("src.application.rag_service.redis.from_url"):

            service = RAGService()
            service.openai = AsyncMock()

            # First call fails, second call succeeds
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "Fallback answer"

            service.openai.chat.completions.create.side_effect = [
                Exception("Primary model failed"),
                mock_response
            ]

            answer = await service._generate_answer("Test prompt")

            assert answer == "Fallback answer"
            assert service.openai.chat.completions.create.call_count == 2

            # Verify calls used correct models
            calls = service.openai.chat.completions.create.call_args_list
            assert calls[0].kwargs["model"] == "gpt-4o"
            assert calls[1].kwargs["model"] == "gpt-4o-mini"

@pytest.mark.asyncio
async def test_generate_answer_total_failure():
    """Tests that _generate_answer raises RAGException if both models fail."""
    with patch("src.application.rag_service.settings") as mock_settings:
        mock_settings.PRIMARY_MODEL = "gpt-4o"
        mock_settings.FALLBACK_MODEL = "gpt-4o-mini"

        with patch("src.application.rag_service.VectorStoreRepository"), \
             patch("src.application.rag_service.redis.from_url"):

            service = RAGService()
            service.openai = AsyncMock()

            service.openai.chat.completions.create.side_effect = Exception("Both failed")

            with pytest.raises(RAGException, match="Generation failed on both primary and fallback models"):
                await service._generate_answer("Test prompt")

@pytest.mark.asyncio
async def test_stream_query_fallback():
    """Tests that stream_query falls back to the secondary model on failure."""
    with patch("src.application.rag_service.settings") as mock_settings:
        mock_settings.PRIMARY_MODEL = "gpt-4o"
        mock_settings.FALLBACK_MODEL = "gpt-4o-mini"
        mock_settings.DOMAIN_NAME = "AWS"

        with patch("src.application.rag_service.VectorStoreRepository") as mock_vs, \
             patch("src.application.rag_service.redis.from_url"):

            service = RAGService()
            service.openai = AsyncMock()

            # Mock retrieval results
            mock_vs_instance = mock_vs.return_value
            mock_vs_instance.search.return_value = [
                Chunk(content="Context 1", metadata={})
            ]

            # Mock streaming response
            async def mock_stream_gen(model_name):
                yield MagicMock(choices=[MagicMock(delta=MagicMock(content=f"Stream from {model_name}"))])

            # First call (primary) fails, second call (fallback) succeeds
            service.openai.chat.completions.create.side_effect = [
                Exception("Primary stream failed"),
                mock_stream_gen("gpt-4o-mini")
            ]

            events = []
            async for event in service.stream_query("Test query"):
                events.append(json.loads(event))

            # Verify events
            event_types = [e["type"] for e in events]
            assert "token" in event_types
            assert any("Primary model failed" in e.get("step", "") for e in events if e["type"] == "step")

            token_event = next(e for e in events if e["type"] == "token")
            assert token_event["content"] == "Stream from gpt-4o-mini"

            assert service.openai.chat.completions.create.call_count == 2

