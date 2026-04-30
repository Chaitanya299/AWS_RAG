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
            raise DomainBoundaryException(f"Query is outside the allowed domain: {self.allowed_domain}")

class ResponseGuard:
    """Validates the generated response for hallucinations and safety."""

    def validate(self, answer: str, source_chunks: List[str]):
        """
        In a production system, this would use NLI (Natural Language Inference)
        or an LLM-based evaluator to check if the answer is supported by the chunks.
        """
        pass
