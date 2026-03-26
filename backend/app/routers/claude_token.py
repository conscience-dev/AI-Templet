"""Claude OAuth 토큰 관리 라우터."""
from datetime import datetime, timezone

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.services import claude_token_service

router = APIRouter()


# --- Schemas (라우터 내 정의) ---


class ClaudeTokenSaveIn(PydanticBaseModel):
    access_token: str
    refresh_token: str
    expires_at: str  # ISO format datetime string


class ClaudeTokenStatusOut(PydanticBaseModel):
    has_token: bool
    status: str | None = None
    is_expired: bool | None = None
    is_expiring_soon: bool | None = None
    expires_at: str | None = None
    last_refreshed_at: str | None = None


class ClaudeTokenTestOut(PydanticBaseModel):
    success: bool
    message: str
    model: str | None = None
    response: str | None = None


# --- Helpers ---


def _check_admin(user: User):
    """관리자 권한 확인."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")


# --- Endpoints ---


@router.post("/claude-token")
async def save_claude_token(
    data: ClaudeTokenSaveIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Claude OAuth 토큰을 등록합니다. (관리자 전용)"""
    _check_admin(user)

    try:
        expires_at = datetime.fromisoformat(data.expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="유효하지 않은 날짜 형식입니다. ISO 형식을 사용하세요.")

    token = await claude_token_service.save_token(
        db=db,
        access_token=data.access_token,
        refresh_token=data.refresh_token,
        expires_at=expires_at,
    )

    return {
        "status": "success",
        "message": "Claude OAuth 토큰이 등록되었습니다.",
        "token_id": str(token.id),
    }


@router.get("/claude-token/status", response_model=ClaudeTokenStatusOut)
async def get_claude_token_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Claude OAuth 토큰 상태를 확인합니다."""
    token = await claude_token_service.get_token(db)

    if not token:
        return ClaudeTokenStatusOut(has_token=False)

    return ClaudeTokenStatusOut(
        has_token=True,
        status=token.status,
        is_expired=token.is_expired(),
        is_expiring_soon=token.is_expiring_soon(),
        expires_at=token.expires_at.isoformat() if token.expires_at else None,
        last_refreshed_at=token.last_refreshed_at.isoformat() if token.last_refreshed_at else None,
    )


@router.post("/claude-token/refresh")
async def refresh_claude_token(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Claude OAuth 토큰을 수동으로 갱신합니다. (관리자 전용)"""
    _check_admin(user)

    token = await claude_token_service.get_token(db)
    if not token:
        raise HTTPException(status_code=404, detail="등록된 Claude 토큰이 없습니다.")

    refreshed = await claude_token_service.refresh_access_token(db, token)
    if not refreshed:
        raise HTTPException(status_code=502, detail="토큰 갱신에 실패했습니다. 토큰을 다시 등록해주세요.")

    return {
        "status": "success",
        "message": "Claude OAuth 토큰이 갱신되었습니다.",
        "expires_at": refreshed.expires_at.isoformat(),
    }


@router.post("/claude-token/test", response_model=ClaudeTokenTestOut)
async def test_claude_token(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Claude OAuth 토큰으로 API 테스트 호출을 수행합니다. (관리자 전용)"""
    _check_admin(user)

    access_token = await claude_token_service.get_valid_access_token(db)
    if not access_token:
        raise HTTPException(
            status_code=404,
            detail="유효한 Claude 토큰이 없습니다. 토큰을 등록하거나 갱신해주세요.",
        )

    try:
        # OAuth 토큰(sk-ant-oat*)은 auth_token + beta 헤더로 전달
        if access_token.startswith("sk-ant-oat"):
            client = anthropic.Anthropic(
                auth_token=access_token,
                default_headers={"anthropic-beta": "oauth-2025-04-20"},
            )
        else:
            client = anthropic.Anthropic(api_key=access_token)

        model = "claude-sonnet-4-20250514"
        message = client.messages.create(
            model=model,
            max_tokens=100,
            messages=[{"role": "user", "content": "안녕하세요. 간단히 인사해주세요."}],
        )

        return ClaudeTokenTestOut(
            success=True,
            message="API 호출 성공",
            model=model,
            response=message.content[0].text,
        )

    except anthropic.AuthenticationError:
        return ClaudeTokenTestOut(
            success=False,
            message="인증 실패 — 토큰이 만료되었거나 유효하지 않습니다.",
        )
    except anthropic.RateLimitError:
        return ClaudeTokenTestOut(
            success=False,
            message="API 요청 한도 초과 — 잠시 후 다시 시도해주세요.",
        )
    except anthropic.APIError as e:
        return ClaudeTokenTestOut(
            success=False,
            message=f"API 에러: {str(e)}",
        )
    except Exception as e:
        return ClaudeTokenTestOut(
            success=False,
            message=f"예상치 못한 에러: {str(e)}",
        )
