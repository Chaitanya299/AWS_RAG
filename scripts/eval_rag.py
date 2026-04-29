import asyncio
import time
from src.application.rag_service import RAGService

async def run_eval():
    print("🚀 Initializing AWS RAG Evaluator (G-Eval Mode)...")
    service = RAGService()

    test_queries = [
        "What is Amazon EC2 and what are its benefits?",
        "Explain the shared responsibility model in AWS.",
        "What is Amazon S3 and how is it used?",
        "What is the current stock price of Amazon?" # Outside domain check
    ]

    total_faithfulness = 0
    valid_responses = 0

    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        try:
            start_time = time.perf_counter()
            response = await service.answer_query(query)
            duration = (time.perf_counter() - start_time) * 1000

            print(f"✅ Answer: {response.answer}")

            # G-Eval: Faithfulness Check
            context = "\n\n".join([c.content for c in response.source_chunks])
            faith_score = await service.response_guard.check_hallucination(query, response.answer, context)

            print(f"📊 Faithfulness Score: {faith_score * 100:.1f}%")
            print(f"📈 Latency: {response.latency_ms:.2f}ms")

            total_faithfulness += faith_score
            valid_responses += 1

            if service.cache and f"rag_cache:{query.strip().lower()}" in service.cache:
                print("♻️ Result cached in Redis.")

        except Exception as e:
            print(f"❌ Blocked/Error: {str(e)}")

    if valid_responses > 0:
        avg_hallucination_rate = (1 - (total_faithfulness / valid_responses)) * 100
        print(f"\n🏆 FINAL METRICS")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Hallucination Rate: {avg_hallucination_rate:.2f}%")
        print(f"Avg Faithfulness: {(total_faithfulness / valid_responses) * 100:.2f}%")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

if __name__ == "__main__":
    try:
        asyncio.run(run_eval())
    except KeyboardInterrupt:
        pass
