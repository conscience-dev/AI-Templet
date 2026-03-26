"""Claude OAuth 토큰 저장 모델. 싱글톤 — row 1개만 유지."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class ClaudeToken(BaseModel):
    __tablename__ = "claude_tokens"

    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_refreshed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, expired, error

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) >= self.expires_at.replace(tzinfo=timezone.utc)

    def is_expiring_soon(self, minutes: int = 30) -> bool:
        return datetime.now(timezone.utc) >= (
            self.expires_at.replace(tzinfo=timezone.utc) - timedelta(minutes=minutes)
        )
