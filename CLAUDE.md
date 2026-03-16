# Project Reference — Claude Code

이 문서는 Claude Code가 프로젝트 구조와 설계 시스템을 빠르게 이해하고 일관된 코드를 생성하기 위한 레퍼런스입니다.

---

## 1. 프로젝트 개요

모노레포 구조의 Next.js + FastAPI 풀스택 SaaS 보일러플레이트. SPEC.md 기획서 기반 코드 자동 생성.

| 항목 | 스택 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router, Turbopack), React 18, TypeScript |
| 백엔드 | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic |
| 인증 | JWT (access + refresh), Bearer + Cookie fallback |
| DB | PostgreSQL (prod), SQLite + aiosqlite (dev) |
| UI 시스템 | shadcn/ui (new-york), Radix UI, Tailwind CSS, CVA |
| 상태관리 | TanStack Query v5 (서버상태), React state (로컬) |
| 아이콘 | lucide-react |
| 폰트 | Pretendard Variable (한국어), lang="ko" |

```
nextjs-django-project/
├── backend/          # FastAPI 백엔드
├── frontend/         # Next.js 프론트엔드
├── nginx/            # 리버스 프록시 설정
├── docker-compose.yml
├── Makefile
└── CLAUDE.md         # ← 이 파일
```

---

## 2. 로컬 개발 실행

```bash
# 백엔드 (포트 8000)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # DATABASE_URL=sqlite+aiosqlite:///./dev.db 로 변경
python -c "from app.database import engine; from app.models.base import Base; import asyncio; asyncio.run(Base.metadata.create_all(bind=engine))"
# 또는 alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 프론트엔드 (포트 3000)
cd frontend
npm install
npm run dev  # next dev --turbopack
```

---

## 3. 상세 레퍼런스

역할별로 분리된 상세 문서를 참조하세요.

| 파일 | 로딩 | 내용 |
|------|------|------|
| `.claude/rules/conventions.md` | 항상 | 공통 코드 컨벤션 |
| `.claude/rules/backend-conventions.md` | `backend/**` 작업 시 | 백엔드 코드 컨벤션 |
| `.claude/rules/frontend-conventions.md` | `frontend/**` 작업 시 | 프론트엔드 코드 컨벤션 |
| `.claude/rules/design-system.md` | `frontend/**` 작업 시 | 색상, 타이포그래피, 스타일 규칙 |
| `.claude/agents/backend.md` | 서브에이전트 | 백엔드 구조, API, 모델, 패턴, 체크리스트 |
| `.claude/agents/frontend.md` | 서브에이전트 | 프론트엔드 구조, 컴포넌트, 페이지 가이드 |
| `.claude/agents/design.md` | 서브에이전트 | Claude 스타일 디자인 시스템, 브랜드 컬러, 컴포넌트 스타일 적용 |
| `.claude/agents/admin.md` | 서브에이전트 | 관리자 페이지 (대시보드, 사용자, 조건부 페이지) 생성 |
| `.claude/agents/chat.md` | 서브에이전트 | 채팅 UI (마크다운, SSE 스트리밍, 복사, 메시지 버블) 생성 |
| `.claude/agents/agent.md` | 서브에이전트 | AI 에이전트 설정 (SPEC 섹션 9 기반, 외부 AI 서비스 연동) |
| `.claude/skills/generate-project/SKILL.md` | 스킬 호출 시 | SPEC.md → 코드 자동 생성 워크플로우 (Phase 9.5 디자인, 10.5 관리자/채팅 포함) |
| `.claude/skills/generate-spec/SKILL.md` | 스킬 호출 시 | planning/ → SPEC.md 자동 생성 |

---

## 4. 환경변수

### 백엔드 (.env)

```env
SECRET_KEY=dev-secret-key-change-me-in-production
DEBUG=True
ENV_NAME=local
DATABASE_URL=sqlite+aiosqlite:///./dev.db
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
FRONTEND_URL=http://127.0.0.1:3000
SESSION_COOKIE_DOMAIN=
SESSION_COOKIE_SECURE=False
SESSION_COOKIE_SAMESITE=lax
ACCESS_TOKEN_EXPIRATION_MINUTES=525600
REFRESH_TOKEN_EXPIRATION_MINUTES=1051200
PAGINATION_PER_PAGE=10

# Deep Agent (SPEC.md 섹션 9에 따라 설정, .claude/agents/agent.md 참조)
ANTHROPIC_API_KEY=
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_TEMPERATURE=0.7
AGENT_MAX_TOKENS=4096

# Qdrant (RAG)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=knowledge_base

# 임베딩
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_KEY=
```

### 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. 빌드 & 배포

```bash
# 프론트엔드 빌드
cd frontend && npm run build   # output: standalone

# 백엔드 테스트
cd backend && pytest

# Docker
docker-compose up --build
```

| 서비스 | Dockerfile | 포트 |
|--------|-----------|------|
| frontend | nextjs_dockerfile | 3000 |
| backend | backend.railway.dockerfile | 8000 |
| nginx | nginx/ | 80 |
