from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token


class OptionalHTTPBearer(HTTPBearer):
    """HTTPBearer that doesn't raise on missing token — allows cookie fallback."""

    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        try:
            return await super().__call__(request)
        except HTTPException:
            return None


optional_bearer = OptionalHTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    token: str | None = None

    # 1. Try Authorization header
    if credentials:
        token = credentials.credentials

    # 2. Fallback to cookie
    if not token:
        token = request.cookies.get("access")

    if not token:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    decoded = decode_access_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="토큰이 만료되었거나 유효하지 않습니다.")

    user_id = decoded.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    return user
