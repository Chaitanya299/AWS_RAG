import asyncio
import time
from src.application.rag_service import RAGService

async def run_eval():
    print("🚀 Initializing AWS RAG Evaluator...")
    service = RAGService()

    test_queries = [
        "What is Amazon EC2 and what are its benefits?",
        "Explain the shared responsibility model in AWS.",
        "What is Amazon S3 and how is it used?",
        "Tell me a joke about cloud computing." # Should be blocked by DomainGuard
    ]

    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        try:
            start_time = time.perf_counter()
            response = await service.answer_query(query)
            duration = (time.perf_counter() - start_time) * 1000

            print(f"✅ Answer: {response.answer}")
            print(f"📊 Latency: {response.latency_ms:.2f}ms (Total: {duration:.2f}ms)")
            print(f"📚 Sources ({len(response.source_chunks)} chunks):")
            for i, chunk in enumerate(response.source_chunks):
                print(f"  [{i+1}] (Score: {chunk.score:.4f}) {chunk.content[:150]}...")

            if service.cache and f"rag_cache:{query.strip().lower()}" in service.cache:
                print("♻️ Result cached in Redis.")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    try:
        asyncio.run(run_eval())
    except KeyboardInterrupt:
        pass
