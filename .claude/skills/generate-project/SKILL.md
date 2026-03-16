# 프로젝트 생성 워크플로우

> `SPEC.md`를 읽고 전체 코드를 자동 생성하는 워크플로우.

## Phase 1: 기획서 분석·검증

1. `SPEC.md` 파일을 읽고 모든 섹션 파싱
2. 검증: FK 관계, API↔모델 매핑, 페이지↔API 매핑, Role 일관성
3. 조건부 관리자 페이지 목록 결정 (→ `.claude/agents/admin.md` 참조)
4. 문제 발견 시 사용자에게 확인 요청

## Phase 2~4: 백엔드 생성

**백엔드 에이전트** (`.claude/agents/backend.md`) 참조하여 실행.

- Phase 2: 모델 생성 (`backend/app/models/{name}.py`) + `__init__.py` 등록
- Phase 3: 스키마 생성 (`backend/app/schemas/{name}.py`)
- Phase 4: 라우터 생성 (`backend/app/routers/{name}.py`) + `main.py` 등록. `crud` 키워드 시 5개 엔드포인트 자동 생성

## Phase 5: DB 마이그레이션

```bash
cd backend && alembic revision --autogenerate -m "add {name} models" && alembic upgrade head
```

## Phase 5.5: AI 에이전트 설정 (조건부)

> SPEC.md **섹션 9**가 있을 때만 실행. 없으면 건너뜀.

**에이전트 에이전트** (`.claude/agents/agent.md`)를 서브에이전트로 호출하여 실행.

## Phase 6: 백엔드 테스트 생성 및 실행

`.claude/agents/backend.md`의 테스트 패턴을 따라 `backend/tests/test_{name}.py` 생성.
- `conftest.py`의 `authenticated_client` fixture 사용
- CRUD, FK 의존, 검색/필터, 에러 케이스, 관리자 전용 테스트
- **모든 테스트 통과 확인 후 다음 Phase 진행**

## Phase 6.5: 초기 데이터 시딩

`backend/seed.py` 생성 (→ `.claude/agents/backend.md` 시딩 패턴 참조).
- 테스트 계정: admin/admin1234 (ADMIN), testuser/test1234 (기본)
- 목업 데이터: 모델별 3~5개 한국어 샘플

## Phase 7~8: 프론트엔드 API 연동

**프론트엔드 에이전트** (`.claude/agents/frontend.md`) 참조.

- Phase 7: `frontend/lib/api.ts` — axios + 토큰 인터셉터 + trailing slash 처리
- Phase 8: `frontend/hooks/use-{name}.ts` — TanStack Query 훅 (목록/상세/생성/수정/삭제)

## Phase 9: 레이아웃 생성

SPEC.md 섹션 6 사이드바 메뉴 기반으로 생성 (→ `.claude/agents/frontend.md` 참조).
- `frontend/components/layout/sidebar.tsx`
- `frontend/app/(authenticated)/layout.tsx`

## Phase 9.5: 디자인 시스템 적용 (조건부)

> SPEC.md **섹션 10**이 있을 때만 실행.

**디자인 에이전트** (`.claude/agents/design.md`)를 서브에이전트로 호출.

## Phase 10: 페이지 생성

SPEC.md 섹션 5의 각 페이지를 `app/(authenticated)/{path}/page.tsx`로 생성 (→ `.claude/agents/frontend.md`).

## Phase 10.5: 관리자/채팅 페이지 (조건부)

> SPEC.md에 관리자 페이지가 명시된 경우에만 실행. 단순히 User 모델에 ADMIN 역할이 있다고 생성하지 않음.

1. **관리자 에이전트** (`.claude/agents/admin.md`) 서브에이전트 호출 — SPEC.md 섹션 5에 `/admin/*` 경로가 있거나, 섹션 2에 관리자 전용 기능이 기술된 경우에만
2. **채팅 에이전트** (`.claude/agents/chat.md`) 서브에이전트 호출 — SPEC.md에 섹션 9 또는 채팅 모델이 있을 때
3. 관리자 에이전트 실행 시 사이드바에 관리자 메뉴 항목 추가
4. 관리자 에이전트 실행 시 `backend/tests/test_admin.py` 생성

## Phase 11: 인증 페이지

`frontend/app/(public)/login/page.tsx`, `signup/page.tsx` 생성 (→ `.claude/agents/frontend.md`).

## Phase 12: 통합 테스트

```bash
cd backend && pytest -v
cd frontend && npm run build && npm run lint
```

### 런타임 에러 방지 체크리스트

| 확인 항목 | 올바른 방법 |
|----------|-----------|
| PaginatedResponse 필드 | `data.results`, `data.total_cnt` |
| 로그인 후 유저 정보 | `getMe()` 별도 호출 |
| FastAPI trailing slash | axios interceptor로 자동 `/` 추가 |
| 마크다운 렌더링 | `marked` + `@tailwindcss/typography` (react-markdown 금지) |
| Alembic GUID 타입 | `sa.String(length=36)` 수동 변경 |
| datetime | `datetime.now(timezone.utc)` |
| Anthropic content | 리스트 `[{type:"text",text:"..."}]` 분기 처리 |

## Phase 13: 배포 준비

환경변수 체크리스트: `DATABASE_URL`, `SECRET_KEY`, `ENV_NAME=production`, `CORS_ALLOWED_ORIGINS`, `SESSION_COOKIE_SECURE=True`, `NEXT_PUBLIC_API_URL`

## Phase 14: GitHub + Railway 자동 배포

```bash
gh auth status && railway whoami   # CLI 인증 확인
make deploy-init                    # GitHub repo + Railway 초기화
git push origin main                # CI/CD 파이프라인 트리거
```

---

## 에러 복구 프로토콜

Phase 진행 중 에러 발생 시 아래 순서로 복구:

### Phase 2~4 에러 (백엔드 생성)
1. import 오류 → `models/__init__.py` 등록 확인
2. FK 관계 오류 → 부모 모델이 먼저 생성되었는지 확인
3. circular import → `TYPE_CHECKING` 블록으로 분리

### Phase 5 에러 (마이그레이션)
1. `NameError: app` → migration 파일의 `GUID()` → `sa.String(length=36)` 수동 변경
2. 테이블 이미 존재 → `alembic stamp head` 후 재시도
3. 마이그레이션 충돌 → `alembic heads`로 확인 후 merge

### Phase 6 에러 (테스트)
1. 테스트 실패 → 실패한 테스트만 `-x` 옵션으로 재실행하여 디버깅
2. fixture 오류 → `conftest.py`의 `setup_db` 확인
3. 외부 의존 오류 → mock/patch 적용

### Phase 12 에러 (통합 테스트)
1. 프론트엔드 빌드 → `npm run build` 에러 메시지 기반 수정
2. 백엔드 테스트 → 실패 테스트별 개별 수정
3. **최대 3회 재시도** 후에도 실패 시 사용자에게 보고

## Phase 간 의존성 그래프

```
Phase 1 (분석)
  ↓
Phase 2 (모델) → Phase 3 (스키마) → Phase 4 (라우터)
  ↓
Phase 5 (마이그레이션)
  ↓
Phase 5.5 (에이전트, 조건부)
  ↓
Phase 6 (테스트) → Phase 6.5 (시딩)
  ↓
Phase 7 (API 클라이언트) → Phase 8 (훅) → Phase 9 (레이아웃)
  ↓
Phase 9.5 (디자인, 조건부)
  ↓
Phase 10 (페이지) → Phase 10.5 (관리자/채팅, 조건부)
  ↓
Phase 11 (인증 페이지)
  ↓
Phase 12 (통합 테스트) → Phase 13 (배포 준비) → Phase 14 (배포)
```
