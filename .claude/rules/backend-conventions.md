---
paths:
  - "backend/**"
---

# 백엔드 코드 컨벤션

## 함수 & DB
- 비동기 함수: `async def` + `await`
- DB 세션: `Depends(get_db)` 주입, `flush()` → `commit()` → `refresh()` 순서
- 쿼리: `select()` 사용 (레거시 `query()` 금지), eager loading → `selectinload()`
- datetime: `datetime.now(timezone.utc)` 사용 (`utcnow()` 금지 — Python 3.12+ deprecated)

## 스키마 & 직렬화
- 스키마: Pydantic BaseModel, UUID → str 변환, datetime → isoformat
- 응답: `PaginatedResponse` 필드는 `results` (NOT `items`), `total_cnt`, `page_cnt`
- 로그인 응답: `{status, access_token, refresh_token}` — user 객체 포함 금지

## 인증 & 권한
- 인증: `Depends(get_current_user)` 로 보호
- 역할 검증: 라우터 내 인라인으로 member role 체크
- 관리자 전용: `if user.status != UserStatus.ADMIN: raise HTTPException(403)`

## 에러 & 라우팅
- 에러 메시지는 **한국어**로 작성
- FastAPI trailing slash: 프론트엔드 axios interceptor가 자동 `/` 추가 (307 방지)

## Alembic
- GUID 타입 마이그레이션: `app.models.base.GUID()` → `sa.String(length=36)` 수동 변경 필수
