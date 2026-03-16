---
name: backend
description: FastAPI 백엔드 작업 전문 에이전트. 모델, 스키마, 라우터, 테스트 생성 및 수정.
---

# 백엔드 구조 (FastAPI)

## 디렉토리

```
backend/app/
├── main.py             # FastAPI 앱, CORS, 라우터 등록
├── config.py           # Settings (pydantic-settings, .env)
├── database.py         # AsyncEngine, AsyncSession, get_db()
├── dependencies.py     # get_current_user (JWT 인증 의존성)
├── models/
│   ├── base.py         # BaseModel (id, created_at, updated_at), GUID 타입
│   ├── user.py         # User, Jwt, UserStatus
│   └── {name}.py       # SPEC.md 섹션 3 모델별 생성
├── routers/
│   ├── auth.py         # 회원가입, 로그인, 로그아웃, 토큰 갱신, 내 정보
│   └── {name}.py       # SPEC.md 섹션 4 리소스별 생성
├── schemas/
│   ├── common.py       # SuccessOut
│   ├── user.py         # UserSignupIn, UserLoginIn, UserMeOut, ...
│   └── {name}.py       # SPEC.md 섹션 4 리소스별 생성
├── agent/              # SPEC.md 섹션 9가 있을 때 (→ agent.md 참조)
│   ├── core.py         # create_agent + get_model
│   ├── rag.py          # 벡터스토어 + 임베딩
│   ├── streaming.py    # SSE 스트리밍 변환
│   └── tools/          # 커스텀 도구
└── utils/
    ├── security.py     # hash_password, verify_password, JWT 생성/검증
    └── pagination.py   # PaginatedResponse[T], paginate()
```

## API 엔드포인트 (기본 제공)

```
GET  /                                    → Health check {"ping":"pong"}

# Auth (/v1/auth) — 기본 제공, 수정 불필요
POST /v1/auth/signup                      → 회원가입
POST /v1/auth/login                       → 로그인 (access_token, refresh_token 반환)
POST /v1/auth/logout                      → 로그아웃 (🔒)
POST /v1/auth/refresh-token               → 토큰 갱신
GET  /v1/auth/me                          → 내 정보 (🔒)
GET  /v1/auth/users                       → 전체 사용자 목록 (🔒 관리자)
PATCH /v1/auth/{user_id}                  → 유저 수정 (🔒 관리자)

# SPEC.md 섹션 4 기반 자동 생성 엔드포인트
# crud 키워드 → 5개 엔드포인트 자동 생성:
# POST   /v1/{name}s/           → 생성
# GET    /v1/{name}s/           → 목록 (PaginatedResponse)
# GET    /v1/{name}s/{id}       → 상세
# PATCH  /v1/{name}s/{id}       → 수정
# DELETE /v1/{name}s/{id}       → 삭제
```

## 데이터 모델

모든 모델은 `BaseModel`을 상속: `id(UUID)`, `created_at`, `updated_at` 자동 관리.

### 기본 제공 모델

```
User
  ├── username (unique)
  ├── email (nullable)
  ├── password (bcrypt 해시)
  ├── status: UserStatus enum (SPEC.md 섹션 2 역할 기반)
  ├── terms_of_service, privacy_policy_agreement
  └─→ Jwt (1:1) — access_token, refresh_token

# SPEC.md 섹션 3의 모델은 Phase 2에서 자동 생성됩니다.
```

### 모델 생성 패턴

```python
# backend/app/models/{name}.py
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel, GUID

class {Name}(BaseModel):
    __tablename__ = "{name}s"
    # SPEC 섹션 3 필드 → SQLAlchemy 타입 매핑
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("todo", "in_progress", "done", name="{name}_status"),
        nullable=False, default="todo"
    )
    # FK 관계
    user_id = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", backref="{name}s")
```

## 핵심 패턴

```python
# 인증이 필요한 엔드포인트
@router.post("/")
async def create_something(
    data: SomeCreateIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ...

# 역할 기반 접근제어 (인라인)
member = await db.execute(
    select(OrganizationMember).where(
        OrganizationMember.user_id == user.id,
        OrganizationMember.organization_id == org_id,
        OrganizationMember.role.in_([OrganizationRole.OWNER, OrganizationRole.DEVELOPER]),
        OrganizationMember.is_active == True,
    )
)
if not member.scalar_one_or_none():
    raise HTTPException(status_code=403, detail="권한이 없습니다.")

# Eager loading
result = await db.execute(
    select(Organization)
    .where(Organization.id == org_id)
    .options(selectinload(Organization.members).selectinload(OrganizationMember.user))
)

# Soft delete
project.is_active = False
await db.commit()

# 응답 직렬화 (UUID → str, datetime → isoformat)
OrganizationOut(id=str(org.id), created_at=org.created_at.isoformat())
```

## 테스트 인프라

### 구조

```
backend/
├── conftest.py          # 공통 fixtures (DB, client, 인증)
├── pytest.ini           # asyncio_mode=auto, testpaths=tests
└── tests/
    ├── __init__.py
    ├── test_auth.py     # 회원가입, 로그인, 승인, 토큰
    ├── test_{name}.py   # 리소스별 CRUD, 검색, 필터
    └── test_chat.py     # 스레드, 메시지, AI SSE (선택)
```

### 테스트 의존성

```
pytest==8.3.4
pytest-asyncio==0.24.0
httpx==0.28.0          # AsyncClient (ASGI transport)
aiosqlite==0.20.0      # 테스트 DB
```

### Fixtures (conftest.py)

| Fixture | 용도 |
|---------|------|
| `setup_db` | (autouse) 매 테스트 전 테이블 생성, 후 삭제 |
| `db_session` | AsyncSession — DB 직접 조작 필요 시 |
| `client` | AsyncClient — 비인증 HTTP 클라이언트 |
| `authenticated_client` | AsyncClient — JWT 인증된 일반 사용자 (CONSULTANT) |
| `admin_client` | AsyncClient — JWT 인증된 관리자 (ADMIN) |

### 테스트 실행

```bash
# 전체 실행
cd backend && pytest -v

# 특정 파일
cd backend && pytest tests/test_student.py -v

# 특정 테스트
cd backend && pytest tests/test_student.py::test_create_student -v

# 실패 시 즉시 중단
cd backend && pytest -x -v
```

### 테스트 작성 패턴

#### 기본 CRUD 테스트 (함수 기반)

```python
# backend/tests/test_{name}.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_{name}(authenticated_client: AsyncClient):
    response = await authenticated_client.post("/v1/{name}s/", json={
        "title": "테스트 항목",
        # ... 필수 필드 (한국어 테스트 데이터)
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "테스트 항목"


@pytest.mark.asyncio
async def test_list_{name}s(authenticated_client: AsyncClient):
    await authenticated_client.post("/v1/{name}s/", json={"title": "항목A"})
    await authenticated_client.post("/v1/{name}s/", json={"title": "항목B"})

    response = await authenticated_client.get("/v1/{name}s/")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 2


@pytest.mark.asyncio
async def test_get_{name}(authenticated_client: AsyncClient):
    create_resp = await authenticated_client.post("/v1/{name}s/", json={"title": "상세조회"})
    item_id = create_resp.json()["id"]

    response = await authenticated_client.get(f"/v1/{name}s/{item_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "상세조회"


@pytest.mark.asyncio
async def test_update_{name}(authenticated_client: AsyncClient):
    create_resp = await authenticated_client.post("/v1/{name}s/", json={"title": "수정전"})
    item_id = create_resp.json()["id"]

    response = await authenticated_client.patch(f"/v1/{name}s/{item_id}", json={
        "title": "수정후",
    })
    assert response.status_code == 200
    assert response.json()["title"] == "수정후"


@pytest.mark.asyncio
async def test_delete_{name}(authenticated_client: AsyncClient):
    create_resp = await authenticated_client.post("/v1/{name}s/", json={"title": "삭제대상"})
    item_id = create_resp.json()["id"]

    response = await authenticated_client.delete(f"/v1/{name}s/{item_id}")
    assert response.status_code == 200

    # 삭제 확인
    response = await authenticated_client.get(f"/v1/{name}s/{item_id}")
    assert response.status_code == 404
```

#### FK 의존 리소스 테스트

부모 리소스를 먼저 생성한 후 테스트:

```python
@pytest.mark.asyncio
async def test_create_report(authenticated_client: AsyncClient):
    # 부모(학생) 먼저 생성
    student_resp = await authenticated_client.post("/v1/students/", json={"name": "학생A"})
    student_id = student_resp.json()["id"]

    # 자식(리포트) 생성
    response = await authenticated_client.post("/v1/reports/", json={
        "title": "리포트 제목",
        "student_id": student_id,
    })
    assert response.status_code == 200
    assert response.json()["student_name"] == "학생A"
```

#### 검색/필터 테스트

```python
@pytest.mark.asyncio
async def test_search_{name}s(authenticated_client: AsyncClient):
    await authenticated_client.post("/v1/{name}s/", json={"title": "검색대상"})
    await authenticated_client.post("/v1/{name}s/", json={"title": "다른항목"})

    response = await authenticated_client.get("/v1/{name}s/?search=검색")
    assert response.status_code == 200
    assert response.json()["total_cnt"] == 1
```

#### 에러 케이스 테스트

```python
@pytest.mark.asyncio
async def test_get_{name}_not_found(authenticated_client: AsyncClient):
    response = await authenticated_client.get("/v1/{name}s/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_{name}_unauthenticated(client: AsyncClient):
    response = await client.post("/v1/{name}s/", json={"title": "테스트"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_{name}_validation_error(authenticated_client: AsyncClient):
    response = await authenticated_client.post("/v1/{name}s/", json={})
    assert response.status_code == 422
```

#### 권한 테스트 (관리자 전용)

```python
@pytest.mark.asyncio
async def test_admin_only_endpoint(authenticated_client: AsyncClient):
    """일반 사용자는 접근 불가."""
    response = await authenticated_client.get("/v1/admin/users")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_only_endpoint_success(admin_client: AsyncClient):
    """관리자는 접근 가능."""
    response = await admin_client.get("/v1/admin/users")
    assert response.status_code == 200
```

#### 외부 서비스 모킹 (Deep Agents SSE)

```python
import json
from unittest.mock import patch


async def _mock_stream_agent(*args, **kwargs):
    """stream_agent_response mock — yields text chunks."""
    for chunk in ["응답", " 내용"]:
        yield chunk


@pytest.mark.asyncio
@patch("app.routers.chat.stream_agent_response", side_effect=_mock_stream_agent)
@patch("app.routers.chat.get_agent")
async def test_agent_streaming(mock_get_agent, mock_stream, authenticated_client: AsyncClient):
    # ... SSE 응답 파싱 및 검증
```

### 테스트 작성 규칙

1. **테스트 파일**: `tests/test_{리소스명}.py` — 라우터와 1:1 매핑
2. **함수명**: `test_{동작}_{리소스}` (예: `test_create_student`, `test_list_reports`)
3. **한국어 데이터**: 테스트 데이터는 실제 사용 시나리오와 동일하게 한국어로 작성
4. **독립 테스트**: 각 테스트는 독립적 (setup_db가 매번 테이블 초기화)
5. **상태 코드 검증**: 성공(200), 유효성(422), 권한(401/403), 미존재(404)
6. **삭제 확인**: delete 후 get으로 404 확인
7. **페이지네이션 확인**: list 시 `total_cnt` 검증
8. **모킹**: 외부 API(AI 클라이언트 등)는 `unittest.mock.patch`로 모킹

## 초기 데이터 시딩 (필수)

프로젝트 생성 완료 후 **반드시** 목업 데이터와 테스트 계정을 포함해야 합니다.

### 시드 스크립트

```
backend/
└── seed.py              # 목업 데이터 + 테스트 계정 시딩 스크립트
```

### 테스트 계정 (필수)

| 역할 | username | password | 상태 |
|------|----------|----------|------|
| 관리자 | `admin` | `admin1234` | ADMIN |
| 일반 사용자 | `testuser` | `test1234` | SPEC 기반 기본 상태 |

### 목업 데이터 (필수)

SPEC.md의 데이터 모델에 맞춰 **의미 있는 한국어 목업 데이터**를 생성합니다:

- 각 모델별 최소 3~5개 샘플 데이터
- FK 관계가 있는 모델은 부모 → 자식 순서로 생성
- 실제 서비스 시나리오를 반영 (예: 조직 → 멤버 → 프로젝트)
- 날짜/시간은 최근 날짜 기준으로 현실적인 값

### 시드 스크립트 패턴

```python
# backend/seed.py
import asyncio
from app.database import engine, AsyncSessionLocal
from app.models.base import Base
from app.models.user import User, UserStatus
from app.utils.security import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. 테스트 계정 생성
        admin = User(
            username="admin",
            password=hash_password("admin1234"),
            status=UserStatus.ADMIN,
            terms_of_service=True,
            privacy_policy_agreement=True,
        )
        testuser = User(
            username="testuser",
            password=hash_password("test1234"),
            status=UserStatus.CONSULTANT,  # SPEC 기반 기본 상태
            terms_of_service=True,
            privacy_policy_agreement=True,
        )
        db.add_all([admin, testuser])
        await db.flush()

        # 2. SPEC 기반 목업 데이터 (조직, 프로젝트 등)
        # ... 모델별 샘플 데이터 생성

        await db.commit()
        print("시드 데이터 생성 완료")


if __name__ == "__main__":
    asyncio.run(seed())
```

### 실행 방법

```bash
cd backend && python seed.py
```

> **주의**: `seed.py`는 프로젝트 생성 시 SPEC.md의 데이터 모델에 맞춰 자동 생성됩니다.
> 모든 테스트 계정의 비밀번호는 `.env.example`에도 주석으로 명시합니다.

## ⚠️ 주의사항 (실전 디버깅에서 확인된 필수 사항)

### Alembic 마이그레이션

| 문제 | 원인 | 해결 |
|------|------|------|
| `NameError: name 'app' is not defined` | autogenerate가 GUID 타입을 `app.models.base.GUID(length=36)`으로 기록 | 마이그레이션 파일에서 `sa.String(length=36)`으로 수동 변경 |

### Python 호환성

| 문제 | 원인 | 해결 |
|------|------|------|
| `datetime.utcnow()` DeprecationWarning | Python 3.12+ deprecated | `from datetime import datetime, timezone` → `datetime.now(timezone.utc)` 사용 |

### PaginatedResponse 규약

프론트엔드와 반드시 일치시켜야 하는 필드:

```python
# backend/app/utils/pagination.py → PaginatedResponse
{
    "count": int,        # 현재 페이지 항목 수
    "total_cnt": int,    # 전체 항목 수
    "page_cnt": int,     # 전체 페이지 수
    "cur_page": int,     # 현재 페이지 번호
    "next_page": int | None,
    "previous_page": int | None,
    "results": list[T],  # ⚠️ "items"가 아닌 "results"
}
```

### 로그인 응답 규약

```python
# 로그인 응답 — user 객체를 포함하지 않음
{"status": "success", "access_token": "...", "refresh_token": "..."}
# 유저 정보는 GET /v1/auth/me 로 별도 조회
```

## 새 기능 추가 시 체크리스트

1. `models/` — SQLAlchemy 모델 생성 (BaseModel 상속)
2. `schemas/` — Pydantic 요청/응답 스키마 생성
3. `routers/` — FastAPI 라우터 작성, `Depends(get_current_user)` + `Depends(get_db)` 주입
4. `main.py` — `app.include_router(router, prefix="/v1/...", tags=[...])` 등록
5. `alembic revision --autogenerate -m "..."` → `alembic upgrade head`
6. **`tests/test_{name}.py` — CRUD + 에러 케이스 테스트 작성**
7. **`cd backend && pytest -v` — 전체 테스트 통과 확인**
8. **`seed.py` — 목업 데이터 + 테스트 계정 시딩 스크립트 생성/업데이트**
9. 에러 메시지는 **한국어**로 작성
