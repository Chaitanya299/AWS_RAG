import asyncio
import time
from src.application.rag_service import RAGService

async def test_streaming():
    print("🚀 Testing High-Performance Streaming...")
    service = RAGService()
    query = "What are the core benefits of AWS?"

    print(f"🔍 Query: {query}")
    print("📡 Streaming response: ", end="", flush=True)

    start_time = time.perf_counter()
    first_token_time = None

    async for chunk in service.stream_query(query):
        if first_token_time is None:
            first_token_time = (time.perf_counter() - start_time) * 1000
        print(chunk, end="", flush=True)

    total_time = (time.perf_counter() - start_time) * 1000
    print(f"\n\n⏱️ Time to First Token (TTFT): {first_token_time:.2f}ms")
    print(f"⏱️ Total Generation Time: {total_time:.2f}ms")

if __name__ == "__main__":
    asyncio.run(test_streaming())
