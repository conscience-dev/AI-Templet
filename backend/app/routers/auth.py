from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.user import User, UserStatus, Jwt
from app.schemas.user import (
    UserSignupIn,
    UserLoginIn,
    UserUpdateIn,
    RefreshTokenIn,
    UserMeOut,
    UserRefreshTokenOut,
)
from app.schemas.common import SuccessOut
from app.utils.security import (
    hash_password,
    verify_password,
    get_access_token,
    get_refresh_token,
    validate_refresh_token,
)
from app.dependencies import get_current_user
from app.config import settings
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()


def _serialize_user(user: User) -> UserMeOut:
    return UserMeOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        status=user.status.value,
        phone=user.phone,
        terms_of_service=user.terms_of_service,
        privacy_policy_agreement=user.privacy_policy_agreement,
        created_at=user.created_at.isoformat(),
    )


def _set_cookie_jwt(response: JSONResponse, access: str, refresh: str, access_exp, refresh_exp) -> JSONResponse:
    domain = settings.SESSION_COOKIE_DOMAIN
    secure = settings.SESSION_COOKIE_SECURE
    samesite = settings.SESSION_COOKIE_SAMESITE

    response.set_cookie(
        key="access",
        value=access,
        expires=access_exp.isoformat(),
        secure=secure,
        samesite=samesite,
        httponly=False,
        domain=domain,
    )
    response.set_cookie(
        key="refresh",
        value=refresh,
        expires=refresh_exp.isoformat(),
        secure=secure,
        samesite=samesite,
        httponly=True,
        domain=domain,
    )
    return response


@router.post("/signup", response_model=UserMeOut)
async def signup(data: UserSignupIn, db: AsyncSession = Depends(get_db)):
    # Check duplicate username
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=420, detail="이미 등록된 아이디에요.")

    if data.email:
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=420, detail="이미 등록된 이메일이에요.")

    if data.password != data.password_confirm:
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않아요.")

    if not data.terms_of_service:
        raise HTTPException(status_code=400, detail="이용약관에 동의해주세요.")

    if not data.privacy_policy_agreement:
        raise HTTPException(status_code=400, detail="개인정보 수집 및 이용 동의에 동의해주세요.")

    try:
        user = User(
            username=data.username,
            email=data.email,
            password=hash_password(data.password),
            phone=data.phone,
            status=UserStatus.PENDING,
            terms_of_service=data.terms_of_service,
            privacy_policy_agreement=data.privacy_policy_agreement,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return _serialize_user(user)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="회원가입 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.")


@router.post("/login")
async def login(data: UserLoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="해당 아이디로 등록된 사용자가 없어요.")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않아요.")

    # Check user status
    if user.status == UserStatus.PENDING:
        raise HTTPException(status_code=403, detail="관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.")

    if user.status == UserStatus.INACTIVE:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다. 관리자에게 문의해주세요.")

    # Delete existing JWT
    await db.execute(delete(Jwt).where(Jwt.user_id == user.id))

    access, access_exp = get_access_token({"user_id": user.id})
    refresh, refresh_exp = get_refresh_token()

    jwt_entry = Jwt(user_id=user.id, access=access, refresh=refresh)
    db.add(jwt_entry)
    await db.commit()

    response_data = {"status": user.status.value}
    if settings.ENV_NAME == "local":
        response_data["access_token"] = access
        response_data["refresh_token"] = refresh

    response = JSONResponse(content=response_data)
    return _set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)


@router.post("/logout", response_model=SuccessOut)
async def logout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(Jwt).where(Jwt.user_id == user.id))
    await db.commit()
    return {"detail": "로그아웃 되었어요."}


@router.post("/refresh-token")
async def refresh_token(data: RefreshTokenIn, db: AsyncSession = Depends(get_db)):
    try:
        validate_refresh_token(data.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = await db.execute(
        select(Jwt).where(Jwt.refresh == data.refresh_token)
    )
    jwt_entry = result.scalar_one_or_none()

    if not jwt_entry:
        raise HTTPException(status_code=400, detail="유효하지 않은 토큰입니다.")

    user_result = await db.execute(select(User).where(User.id == jwt_entry.user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="사용자를 찾을 수 없습니다.")

    access, access_exp = get_access_token({"user_id": user.id})
    refresh, refresh_exp = get_refresh_token()

    jwt_entry.access = access
    jwt_entry.refresh = refresh
    await db.commit()

    response_data = {"status": user.status.value}
    if settings.ENV_NAME == "local":
        response_data["access_token"] = access
        response_data["refresh_token"] = refresh

    response = JSONResponse(content=response_data)
    return _set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)


@router.get("/me", response_model=UserMeOut)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    user = result.scalar_one()
    return _serialize_user(user)


@router.get("/users", response_model=PaginatedResponse[UserMeOut])
async def list_users(
    page: int = Query(1, ge=1),
    status: str = Query("", description="상태 필터"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.status != UserStatus.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    query = select(User).order_by(User.created_at.desc())

    if status:
        query = query.where(User.status == status)

    result = await db.execute(query)
    users = list(result.scalars().all())
    serialized = [_serialize_user(u) for u in users]
    return paginate(serialized, page)


@router.patch("/{user_id}", response_model=UserMeOut)
async def update_user(
    user_id: str,
    data: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.status != UserStatus.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    if data.status is not None:
        for s in UserStatus:
            if s.value == data.status:
                user.status = s
                break

    if data.phone is not None:
        user.phone = data.phone

    await db.commit()
    await db.refresh(user)

    return _serialize_user(user)
