from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.user import User, UserRole, DepartmentType, Jwt
from app.schemas.user import (
    UserCreateIn,
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
        email=user.email,
        name=user.name,
        role=user.role.value if user.role else None,
        department=user.department.value if user.department else None,
        is_active=user.is_active,
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
async def signup(data: UserCreateIn, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=420, detail="이미 등록된 이메일이에요.")

    try:
        role = None
        if data.role:
            for r in UserRole:
                if r.value == data.role:
                    role = r
                    break

        department = None
        if data.department:
            for d in DepartmentType:
                if d.value == data.department:
                    department = d
                    break

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            name=data.name,
            role=role or UserRole.STAFF,
            department=department,
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
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="해당 이메일로 등록된 사용자가 없어요.")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않아요.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다. 관리자에게 문의해주세요.")

    # Delete existing JWT
    await db.execute(delete(Jwt).where(Jwt.user_id == user.id))

    access, access_exp = get_access_token({"user_id": user.id})
    refresh, refresh_exp = get_refresh_token()

    jwt_entry = Jwt(user_id=user.id, access=access, refresh=refresh)
    db.add(jwt_entry)
    await db.commit()

    response_data = {"status": "success"}
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

    response_data = {"status": "success"}
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
    role: str = Query("", description="역할 필터"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    query = select(User).order_by(User.created_at.desc())

    if role:
        query = query.where(User.role == role)

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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    if data.name is not None:
        user.name = data.name

    if data.role is not None:
        for r in UserRole:
            if r.value == data.role:
                user.role = r
                break

    if data.department is not None:
        for d in DepartmentType:
            if d.value == data.department:
                user.department = d
                break

    if data.is_active is not None:
        user.is_active = data.is_active

    await db.commit()
    await db.refresh(user)

    return _serialize_user(user)
