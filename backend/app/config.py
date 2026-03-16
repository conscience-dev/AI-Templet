from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    ENV_NAME: str = "production"
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"

    # CORS
    CORS_ALLOWED_ORIGINS: str = ""
    FRONTEND_URL: str = "http://127.0.0.1:3000"

    # JWT
    ACCESS_TOKEN_EXPIRATION_MINUTES: int = 365 * 60 * 24  # 1 year in minutes
    REFRESH_TOKEN_EXPIRATION_MINUTES: int = 2 * 365 * 60 * 24  # 2 years in minutes

    # Pagination
    PAGINATION_PER_PAGE: int = 10

    # Cookie
    SESSION_COOKIE_DOMAIN: Optional[str] = None
    SESSION_COOKIE_SECURE: bool = True
    SESSION_COOKIE_SAMESITE: str = "none"

    # Deep Agent (Anthropic) — SPEC.md 섹션 9 기반 자동 설정
    ANTHROPIC_API_KEY: str = ""
    AGENT_MODEL: str = "claude-sonnet-4-20250514"
    AGENT_TEMPERATURE: float = 0.7
    AGENT_MAX_TOKENS: int = 4096
    AGENT_SYSTEM_PROMPT: str = "당신은 도움이 되는 AI 어시스턴트입니다. 한국어로 응답합니다."

    # Qdrant (RAG) — SPEC.md 섹션 9에 RAG 소스가 있을 때 사용
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "knowledge_base"

    # 임베딩 — RAG 소스가 있을 때 사용
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_API_KEY: str = ""

    @property
    def cors_origins(self) -> List[str]:
        if not self.CORS_ALLOWED_ORIGINS:
            return []
        return [origin.strip().lower() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
