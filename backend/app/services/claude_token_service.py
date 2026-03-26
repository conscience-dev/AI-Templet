"""Claude OAuth 토큰 관리 서비스."""
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claude_token import ClaudeToken

logger = logging.getLogger(__name__)

ANTHROPIC_OAUTH_TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
ANTHROPIC_OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"


async def get_token(db: AsyncSession) -> ClaudeToken | None:
    """싱글톤 토큰 조회."""
    result = await db.execute(
        select(ClaudeToken).order_by(ClaudeToken.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def get_valid_access_token(db: AsyncSession) -> str | None:
    """유효한 access token을 반환합니다. 만료 임박 시 자동 갱신합니다."""
    token = await get_token(db)
    if not token:
        return None

    if token.status == "error":
        return None

    # 만료 임박 또는 만료된 경우 갱신 시도
    if token.is_expired() or token.is_expiring_soon(minutes=30):
        refreshed = await refresh_access_token(db, token)
        if refreshed:
            return refreshed.access_token
        return None

    return token.access_token


async def save_token(
    db: AsyncSession,
    access_token: str,
    refresh_token: str,
    expires_at: datetime,
) -> ClaudeToken:
    """토큰을 저장합니다. 기존 토큰이 있으면 업데이트(upsert)합니다."""
    existing = await get_token(db)

    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token
        existing.expires_at = expires_at
        existing.status = "active"
        existing.last_refreshed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing

    token = ClaudeToken(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
        status="active",
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token


async def refresh_access_token(
    db: AsyncSession,
    token: ClaudeToken,
) -> ClaudeToken | None:
    """Anthropic OAuth 갱신 엔드포인트를 호출하여 토큰을 갱신합니다."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_OAUTH_TOKEN_URL,
                json={
                    "grant_type": "refresh_token",
                    "refresh_token": token.refresh_token,
                    "client_id": ANTHROPIC_OAUTH_CLIENT_ID,
                },
                headers={
                    "Content-Type": "application/json",
                    "anthropic-beta": "oauth-2025-04-20",
                },
            )

        if response.status_code != 200:
            logger.error(f"Claude OAuth 갱신 실패: {response.status_code} {response.text}")
            token.status = "error"
            await db.commit()
            return None

        data = response.json()
        token.access_token = data["access_token"]
        token.expires_at = datetime.fromtimestamp(data["expires_at"], tz=timezone.utc)
        token.status = "active"
        token.last_refreshed_at = datetime.now(timezone.utc)

        # refresh_token이 갱신 응답에 포함된 경우 업데이트
        if "refresh_token" in data:
            token.refresh_token = data["refresh_token"]

        await db.commit()
        await db.refresh(token)
        logger.info("Claude OAuth 토큰 갱신 성공")
        return token

    except httpx.RequestError as e:
        logger.error(f"Claude OAuth 갱신 요청 실패: {e}")
        token.status = "error"
        await db.commit()
        return None
    except Exception as e:
        logger.error(f"Claude OAuth 갱신 중 예상치 못한 에러: {e}")
        token.status = "error"
        await db.commit()
        return None
