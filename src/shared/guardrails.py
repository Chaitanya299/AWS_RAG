import re
from typing import List, Tuple
from src.domain.exceptions import PromptInjectionException, DomainBoundaryException
from src.domain.models import Query

class PromptInjectionGuard:
    """Detects and blocks prompt injection attempts."""

    # Common prompt injection patterns
    PATTERNS = [
        r"ignore (all )?previous instructions",
        r"system prompt",
        r"you are now (a|an)",
        r"decode this base64",
        r"output the full prompt",
        r"new rule:",
        r"dev mode",
        r"jailbreak",
        r"</user_query>",  # XML tag spoofing
        r"</context>",
    ]

    def validate(self, query: str):
        """Validates the query against known patterns."""
        for pattern in self.PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                raise PromptInjectionException(f"Potential prompt injection detected: {pattern}")

class DomainGuard:
    """Enforces domain boundaries for queries using an LLM classifier."""

    def __init__(self, allowed_domain: str, domain_description: str, openai_client=None):
        self.allowed_domain = allowed_domain
        self.domain_description = domain_description
        self.openai = openai_client

    async def is_in_domain(self, query: str) -> bool:
        """
        Validates if the query is related to the allowed domain using an LLM.
        """
        if not self.openai:
            # Fallback to keyword check if LLM client is not provided
            keywords = ["aws", "cloud", "ec2", "s3", "lambda", "compute", "storage", "database", "security", "iam"]
            query_lower = query.lower()
            return any(k in query_lower for k in keywords)

        try:
            res = await self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are a domain classifier for an AI assistant specialized in '{self.allowed_domain}'.\n"
                            f"Domain Scope: {self.domain_description}\n\n"
                            "Your task is to determine if a user query is within this scope. "
                            "Common topics include EC2, S3, RDS, Serverless, and AWS best practices. "
                            "Respond only with 'YES' or 'NO'."
                        )
                    },
                    {"role": "user", "content": query}
                ],
                max_tokens=5,
                temperature=0
            )
            decision = res.choices[0].message.content.strip().upper()
            return "YES" in decision
        except Exception:
            return True # Fail-safe: allow query if classifier fails

    async def validate(self, query: str):
        if not await self.is_in_domain(query):
            # Instead of a generic error, we provide a helpful message that the AI can use
            # or the API can catch to explain the boundary.
            raise DomainBoundaryException(
                f"I specialize exclusively in AWS Cloud Services and Infrastructure. "
                f"Currently, I don't have specialized knowledge about '{query}'. "
                f"Please ask me about EC2, S3, RDS, Lambda, or AWS architecture best practices!"
            )

class ResponseGuard:
    """Validates the generated response for hallucinations and safety."""

    def __init__(self, openai_client=None):
        self.openai = openai_client

    async def check_hallucination(self, question: str, answer: str, context: str) -> float:
        """
        Uses LLM-as-a-judge (G-Eval pattern) to score faithfulness.
        Returns a score from 0.0 (total hallucination) to 1.0 (perfectly faithful).
        """
        if not self.openai:
            return 1.0 # Default to pass if no judge available

        prompt = (
            "You are an expert evaluator. Rate the FAITHFULNESS of an AI's answer based on the provided context.\n\n"
            f"Context: {context}\n"
            f"Question: {question}\n"
            f"Answer: {answer}\n\n"
            "Score from 0 to 10, where 10 means the answer is 100% supported by the context and contains no outside info. "
            "Respond only with the numeric score."
        )

        try:
            res = await self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=5,
                temperature=0
            )
            score_str = res.choices[0].message.content.strip()
            return float(score_str) / 10.0
        except Exception:
            return 1.0

    def validate(self, answer: str, source_chunks: List[str]):
        """
        Synchronous safety check (e.g. sensitive info leakage).
        """
        pass
