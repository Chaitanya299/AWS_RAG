# AWS Assistant - Cloud Services RAG

## Overview
A production-ready RAG assistant specialized in **AWS Cloud Services**. It enforces strict domain boundaries to ensure all answers are derived from official AWS documentation and whitepapers while defending against prompt injection attempts.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```
3. Run AWS data ingestion:
   ```bash
   python scripts/ingest_aws_data.py
   ```
4. Start the API:
   ```bash
   python src/main.py
   ```

## Architecture
- **Domain**: AWS Cloud Services.
- **RAG Source**: `aws-overview.pdf`.
- **LLM**: Powered by OpenAI (GPT-4o).
- **Guardrails**: Integrated safety checks for cloud-specific context and prompt injection.

## Quality
See `QUALITY.md` for coding standards and review checklists.
