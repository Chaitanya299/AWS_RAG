import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from dotenv import load_dotenv

# Get project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Explicitly load dotenv
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH, override=True)

# Suppress HuggingFace tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class Settings(BaseSettings):
    """Application settings and environment variables."""

    # These will be picked up from .env
    OPENAI_API_KEY: str
    API_KEY: str = "dev-secret-key"  # Default for development
    REDIS_URL: str = "redis://localhost:6379/0"
    CHROMA_DB_PATH: str = "./data/chromadb"

    # Model configuration
    PRIMARY_MODEL: str = "gpt-4o"
    FALLBACK_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def DOMAIN_NAME(self) -> str:
        return "AWS Cloud Services"

    @property
    def ALLOWED_DOMAIN_DESCRIPTION(self) -> str:
        return "Answers related to AWS cloud infrastructure, services, and whitepapers."

settings = Settings()
