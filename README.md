# SaaS Boilerplate — Next.js + FastAPI

SPEC.md 기획서 하나로 풀스택 SaaS 프로젝트를 자동 생성하고, `git push`만으로 자동 배포까지 완성하는 보일러플레이트.

## 사용법 요약

```bash
# 1. 기획서 작성 (둘 중 하나)
cp SPEC.template.md SPEC.md                          # A) 템플릿 복사 후 직접 작성
# 또는 planning/ 폴더에 기획 문서 넣고 →             # B) "planning 폴더를 읽고 SPEC.md를 작성해줘"

# 2. 코드 자동 생성 (Claude Code)
# → "SPEC.md를 읽고 프로젝트를 생성해줘"

# 3. 로컬 실행
make install && make backend-run   # 터미널 1
make frontend-run                  # 터미널 2

# 4. 배포 (최초 1회)
make deploy-init                   # GitHub repo + Railway 생성 + 토큰 자동 등록

# 5. 서비스 ID 등록 (Railway 대시보드에서 확인 후)
gh secret set RAILWAY_BACKEND_SVC_ID
gh secret set RAILWAY_FRONTEND_SVC_ID

# 6. 이후 배포는 push만
git push origin main
```

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router, Turbopack), React 18, TypeScript, Tailwind CSS |
| UI | shadcn/ui (new-york), Radix UI, CVA |
| 상태관리 | TanStack Query v5 |
| 백엔드 | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic |
| 인증 | JWT (access + refresh), Bearer + Cookie fallback |
| DB | PostgreSQL (prod), SQLite + aiosqlite (dev) |
| AI (선택) | Deep Agents (LangGraph), Qdrant RAG |
| CI/CD | GitHub Actions → Railway 자동 배포 |

---

## 이미 구현된 기능 (보일러플레이트)

별도 설정 없이 바로 사용 가능:

- **인증 시스템**: 회원가입, 로그인, 로그아웃, JWT 토큰 갱신
- **역할 기반 권한**: 사용자 역할별 접근제어 (SPEC.md에서 역할 자유롭게 정의)
- **UI 컴포넌트**: shadcn/ui 기반 24개 컴포넌트 (Button, Card, Dialog, Table, Badge 등)
- **디자인 시스템**: 10색 컬러 팔레트, 11단계 타이포그래피, 커스텀 디자인 토큰
- **페이지네이션**: 서버사이드 페이지네이션 유틸리티
- **테스트**: pytest 기반 백엔드 테스트 인프라
- **CI/CD 파이프라인**: GitHub Actions (CI) + Railway (CD) 자동 배포

---

## 전체 흐름

```
1. SPEC.md 작성         ← 직접 또는 planning/ 폴더에서 자동 생성
2. 코드 자동 생성        ← Claude Code가 14단계로 생성
3. 로컬에서 확인         ← make install → 실행 → 테스트
4. make deploy-init     ← GitHub repo + Railway + 토큰 자동 등록 (최초 1회)
5. 서비스 ID 등록        ← gh secret set 2번 (최초 1회)
6. git push             ← 이후 push만 하면 자동 배포
```

---

## Step 1: SPEC.md 작성

### 방법 A: 템플릿에서 수동 작성

루트 디렉토리에 `SPEC.md` 파일을 작성합니다. `SPEC.template.md`를 복사해서 시작하면 편합니다.

```bash
cp SPEC.template.md SPEC.md
```

### 방법 B: 기획 문서에서 자동 생성

1. `planning/` 폴더에 기획 문서(md, txt, pdf)를 넣습니다.
2. Claude Code에 요청: `"planning 폴더를 읽고 SPEC.md를 작성해줘"`
3. 생성된 `SPEC.md`를 검토 후 수정합니다.

### SPEC.md 섹션 구성

| 섹션 | 필수 | 설명 |
|------|------|------|
| 1. 프로젝트 기본정보 | 필수 | 이름, slug, 설명 |
| 2. 사용자 역할 | 필수 | 역할 정의, 권한 수준 |
| 3. 데이터 모델 | 필수 | 테이블, 필드, FK 관계 |
| 4. API 엔드포인트 | 필수 | REST API 정의, `crud` 키워드 |
| 5. 페이지 구성 | 필수 | 프론트엔드 페이지, 구성 요소 |
| 6. 레이아웃 | 필수 | 사이드바 메뉴, 아이콘, 역할 제한 |
| 7. 추가 기능 | 선택 | 체크리스트 (Markdown 에디터, PDF 등) |
| 8. 배포 설정 | 선택 | 도메인, DB 등 |
| 9. 에이전트 설정 | 선택 | AI 에이전트, RAG, 서브에이전트 |
| 10. 디자인 요구사항 | 선택 | 브랜드 컬러, 컴포넌트 스타일 |

### 섹션별 작성법

#### 1) 프로젝트 기본정보

```markdown
## 1. 프로젝트 기본정보

| 항목 | 값 |
|------|---|
| 프로젝트 이름 | 내 프로젝트 이름 |
| slug | my-project |
| 설명 | 프로젝트 한 줄 설명 |
```

- **slug**: GitHub repo 이름, Railway 프로젝트 이름으로 사용됨 (kebab-case)

#### 2) 사용자 역할

```markdown
## 2. 사용자 역할 (Roles)

| slug | 이름 | 설명 | 권한 수준 |
|------|------|------|----------|
| `admin` | 관리자 | 시스템 관리 | 모든 리소스 CRUD |
| `member` | 멤버 | 일반 사용자 | 자신의 리소스 CRUD |
| `pending` | 승인대기 | 가입 직후 | 접근 불가 |
```

- `admin`은 필수
- 승인 워크플로우가 필요하면 `pending` 역할 추가
- 관리자 역할이 있으면 관리자 페이지가 자동 생성됨

#### 3) 데이터 모델

```markdown
## 3. 데이터 모델

### 모델: `Student`

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `name` | `String(100)` | `NOT NULL` | 학생 이름 |
| `status` | `Enum(active, inactive)` | `NOT NULL, default=active` | 상태 |
| `consultant_id` | `FK → User` | `nullable` | 담당자 |
```

**지원 타입**: `String(N)`, `Text`, `Integer`, `Float`, `Boolean`, `DateTime`, `JSON`, `Enum(값1, 값2, ...)`, `FK → 모델명`

**제약조건**: `NOT NULL`, `nullable`, `unique`, `default=값`, `CASCADE`

- `BaseModel`(id, created_at, updated_at)은 자동 포함이므로 생략
- `FK → 모델명`으로 외래키 관계 정의
- 모델 간 종속 관계(CASCADE)를 명시하면 삭제 시 자동 처리

#### 4) API 엔드포인트

```markdown
## 4. API 엔드포인트

### 리소스: `Student`

**기본 CRUD**: `crud`

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| `GET` | `/v1/students` | 학생 목록 | 필요 | `admin`, `member` |
| `POST` | `/v1/students` | 학생 등록 | 필요 | `admin`, `member` |
| `GET` | `/v1/students/{id}` | 학생 상세 | 필요 | `admin`, `member` |
| `PATCH` | `/v1/students/{id}` | 학생 수정 | 필요 | `admin`, `member` |
| `DELETE` | `/v1/students/{id}` | 학생 삭제 | 필요 | `admin` |
```

- `crud` 키워드를 쓰면 5개 엔드포인트(생성/목록/상세/수정/삭제) 자동 생성
- 검색/필터가 필요하면 쿼리 파라미터 명시: `?search=이름&status=active&page=1`

#### 5) 페이지 구성

```markdown
## 5. 페이지 구성

| 경로 | 페이지명 | 레이아웃 | 인증 | 구성 요소 |
|------|---------|---------|------|----------|
| `/login` | 로그인 | public | 불필요 | 이메일/비밀번호 폼 |
| `/dashboard` | 대시보드 | authenticated | 필요 | 통계 카드 4개, 최근 항목 테이블 |
| `/students` | 학생 목록 | authenticated | 필요 | 검색바, 테이블, 페이지네이션 |
```

- **구성 요소**를 구체적으로 쓸수록 좋은 결과 (예: "테이블" → "이름, 상태, 최근상담일 컬럼의 테이블 + 상태별 필터 탭")
- 버튼명, 필드명을 한국어로 명시

#### 6) 레이아웃 (사이드바)

```markdown
## 6. 레이아웃

### 사이드바 메뉴

| 메뉴명 | 경로 | 아이콘 (lucide) | 역할 제한 |
|--------|------|----------------|----------|
| 대시보드 | `/dashboard` | `LayoutDashboard` | 없음 |
| 학생 관리 | `/students` | `GraduationCap` | 없음 |
| 관리자 | `/admin` | `Shield` | `admin` |
```

- 아이콘은 [lucide-react](https://lucide.dev/icons)에서 선택
- 역할 제한이 있으면 해당 역할만 메뉴 표시

#### 7~10) 선택 섹션

- **7. 추가 기능**: 체크리스트 `[x]` 형태로 필요한 기능 선택
- **8. 배포 설정**: 도메인, DB 설정
- **9. 에이전트 설정**: AI 챗봇이 필요한 경우. 메인 에이전트, 서브에이전트, 커스텀 도구, RAG 소스 정의. **이 섹션이 없으면 AI 기능이 생성되지 않음**
- **10. 디자인 요구사항**: 브랜드 컬러, 컴포넌트 스타일을 Tailwind 클래스로 명세. **이 섹션이 없으면 기본 디자인 토큰 사용**

> 각 섹션의 상세 작성 예시는 `SPEC.template.md` 주석을 참고하세요.

---

## Step 2: 코드 자동 생성

SPEC.md 작성이 끝나면 Claude Code에게 요청:

```
SPEC.md를 읽고 프로젝트를 생성해줘
```

### 14단계 자동 생성 워크플로우

```
Phase 1    기획서 분석·검증
            └─ SPEC.md 파싱, FK 관계·API·역할 일관성 검증

Phase 2    백엔드 모델 생성
            └─ backend/app/models/{name}.py

Phase 3    백엔드 스키마 생성
            └─ backend/app/schemas/{name}.py

Phase 4    백엔드 라우터 생성
            └─ backend/app/routers/{name}.py + main.py 등록

Phase 5    DB 마이그레이션
            └─ alembic revision + upgrade head

Phase 5.5  AI 에이전트 설정 (SPEC 섹션 9가 있을 때만)
            └─ backend/app/agent/ 패키지 생성

Phase 6    백엔드 테스트 생성 + 실행
            └─ backend/tests/test_{name}.py → pytest 통과 확인

Phase 6.5  초기 데이터 시딩
            └─ backend/seed.py (테스트 계정 + 목업 데이터)

Phase 7    API 클라이언트 설정
            └─ frontend/lib/api.ts

Phase 8    API 훅 생성
            └─ frontend/hooks/use-{name}s.ts

Phase 9    레이아웃 생성
            └─ 사이드바 + authenticated 레이아웃

Phase 9.5  디자인 시스템 적용 (SPEC 섹션 10이 있을 때만)
            └─ 브랜드 컬러, 컴포넌트 스타일 적용

Phase 10   페이지 생성
            └─ 목록/상세/편집 페이지

Phase 10.5 관리자·채팅 페이지 (조건부)
            └─ 관리자 대시보드, 채팅 UI

Phase 11   인증 페이지
            └─ 로그인, 회원가입

Phase 12   통합 테스트
            └─ pytest + npm run build + lint

Phase 13   배포 준비
            └─ Dockerfile, 환경변수 체크리스트

Phase 14   자동 배포 (아래 Step 3~5)
```

---

## Step 3: 로컬 개발 실행

### 백엔드 (포트 8000)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # DATABASE_URL=sqlite+aiosqlite:///./dev.db
alembic upgrade head
python seed.py                # 테스트 데이터 생성
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드 (포트 3000)

```bash
cd frontend
npm install
npm run dev
```

### Make 명령어

```bash
make install          # 백엔드 + 프론트엔드 의존성 설치
make backend-run      # 백엔드 실행
make frontend-run     # 프론트엔드 실행
make backend-test     # pytest 실행
make frontend-build   # Next.js 빌드
make frontend-lint    # ESLint
make test             # 백엔드 테스트 + 프론트엔드 빌드
```

### 테스트 계정 (seed.py 실행 후)

| 아이디 | 비밀번호 | 역할 |
|--------|---------|------|
| admin | admin1234 | 관리자 |
| testuser | test1234 | 기본 사용자 |

---

## Step 4: 배포

### 사전 준비 (최초 1회)

#### 1) CLI 도구 설치 & 로그인

```bash
# GitHub CLI 설치 (https://cli.github.com)
brew install gh
gh auth login

# Railway CLI 설치 (https://docs.railway.app/guides/cli)
npm install -g @railway/cli
railway login
```

#### 2) 프로젝트 초기화

```bash
make deploy-init
```

이 명령어가 자동으로 수행하는 작업:

1. SPEC.md에서 slug 파싱 → repo 이름
2. GitHub private repo 생성 + 코드 push
3. Railway 프로젝트 생성
4. PostgreSQL DB 추가
5. Railway 환경변수 자동 설정 (SECRET_KEY 자동 생성, ENV_NAME=production 등)

#### 3) Railway 대시보드에서 서비스 확인

[Railway 대시보드](https://railway.com) 접속:

1. 생성된 프로젝트 클릭
2. **backend 서비스** 클릭 → **Settings** → **Service ID** 복사
3. **frontend 서비스** 클릭 → **Settings** → **Service ID** 복사

#### 4) GitHub Secrets 등록

GitHub repo 페이지 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | 값 | 얻는 곳 |
|--------|---|---------|
| `RAILWAY_TOKEN` | Railway API 토큰 | Railway 대시보드 → Account Settings → Tokens → New Token |
| `RAILWAY_BACKEND_SVC_ID` | backend 서비스 ID | 3단계에서 복사한 값 |
| `RAILWAY_FRONTEND_SVC_ID` | frontend 서비스 ID | 3단계에서 복사한 값 |

또는 CLI로 등록:

```bash
gh secret set RAILWAY_TOKEN
gh secret set RAILWAY_BACKEND_SVC_ID
gh secret set RAILWAY_FRONTEND_SVC_ID
```

#### 5) Railway 환경변수 수동 설정

`make deploy-init`이 자동 설정하는 값: `SECRET_KEY`, `ENV_NAME`, `DEBUG`, `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAMESITE`, `ACCESS_TOKEN_EXPIRATION_MINUTES`, `REFRESH_TOKEN_EXPIRATION_MINUTES`, `PAGINATION_PER_PAGE`

아래는 배포 도메인 확인 후 **수동으로 설정**해야 하는 값:

```bash
# 필수 (백엔드 서비스)
railway variables set CORS_ALLOWED_ORIGINS=https://프론트엔드-도메인
railway variables set FRONTEND_URL=https://프론트엔드-도메인
railway variables set SESSION_COOKIE_DOMAIN=.도메인

# 필수 (프론트엔드 서비스)
railway variables set NEXT_PUBLIC_API_URL=https://백엔드-도메인
```

AI 에이전트를 사용하는 경우 (SPEC 섹션 9):

```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set EMBEDDING_API_KEY=sk-...
railway variables set QDRANT_URL=https://qdrant-서버-주소
railway variables set QDRANT_API_KEY=...
```

### 자동 배포 (이후 반복)

설정 완료 후, 이후 배포는 push만 하면 됩니다:

```bash
git push origin main
```

자동 실행 흐름:

```
git push origin main
  │
  ├─ CI (.github/workflows/ci.yml)
  │  ├─ backend-test: pytest
  │  └─ frontend-build: npm run build + lint
  │
  ↓ CI 성공
  │
  ├─ CD (.github/workflows/deploy.yml)
  │  ├─ deploy-backend: Railway에 백엔드 배포
  │  └─ deploy-frontend: Railway에 프론트엔드 배포
  │
  ↓
  Railway 자동 배포 완료
```

### 배포 관리 명령어

```bash
make deploy              # 수동 배포 (railway up)
make deploy-status       # Railway 배포 상태 확인
make deploy-logs-backend   # 백엔드 로그
make deploy-logs-frontend  # 프론트엔드 로그
make deploy-env          # Railway 환경변수 재설정
```

---

## 프로젝트 구조

```
nextjs-django-project/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py             # 앱 진입점, CORS, 라우터 등록
│   │   ├── config.py           # 환경변수 설정
│   │   ├── database.py         # DB 엔진, 세션
│   │   ├── dependencies.py     # 인증 의존성
│   │   ├── models/             # SQLAlchemy 모델
│   │   ├── routers/            # API 라우터
│   │   ├── schemas/            # Pydantic 스키마
│   │   └── utils/              # 유틸리티 (보안, 페이지네이션)
│   ├── tests/                  # pytest 테스트
│   ├── alembic/                # DB 마이그레이션
│   └── requirements.txt
├── frontend/                   # Next.js 프론트엔드
│   ├── app/                    # App Router 페이지
│   ├── components/ui/          # shadcn/ui 컴포넌트 (24개)
│   ├── hooks/                  # TanStack Query 훅
│   ├── lib/                    # 유틸리티 (api, cn)
│   ├── styles/                 # CSS 변수
│   └── tailwind.config.js      # 디자인 토큰
├── scripts/
│   ├── deploy-init.sh          # GitHub + Railway 초기화
│   └── setup-railway-env.sh    # Railway 환경변수 설정
├── .github/workflows/
│   ├── ci.yml                  # CI (테스트 + 빌드)
│   └── deploy.yml              # CD (Railway 자동 배포)
├── nginx/                      # 리버스 프록시
├── docker-compose.yml
├── Makefile
├── planning/                   # 기획 문서 → SPEC.md 자동 생성
├── SPEC.md                     # 기획서 (이 파일을 교체)
├── SPEC.template.md            # 기획서 템플릿
├── CLAUDE.md                   # Claude Code 레퍼런스
└── .claude/                    # Claude Code 상세 설정
    ├── rules/                  # 코드 컨벤션
    ├── agents/                 # 서브에이전트 설정
    └── skills/                 # 코드 생성 워크플로우
```

---

## 환경변수

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

# AI 에이전트 (SPEC 섹션 9 사용 시)
ANTHROPIC_API_KEY=
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_TEMPERATURE=0.7
AGENT_MAX_TOKENS=4096
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=project_knowledge
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_KEY=
```

### 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Docker 로컬 실행

```bash
docker-compose up --build
```

| 서비스 | Dockerfile | 포트 |
|--------|-----------|------|
| frontend | nextjs_dockerfile | 3000 |
| backend | backend.railway.dockerfile | 8000 |
| nginx | nginx/ | 80 |

---

## 요약: 새 프로젝트 시작하기

```bash
# 1-A. 템플릿 복사 후 기획서 작성
cp SPEC.template.md SPEC.md
# SPEC.md 편집...

# 1-B. 또는 기획 문서에서 자동 생성
# → planning/ 폴더에 기획 문서 넣기
# → "planning 폴더를 읽고 SPEC.md를 작성해줘"

# 2. Claude Code로 코드 자동 생성
# → "SPEC.md를 읽고 프로젝트를 생성해줘"

# 3. 로컬 확인
make install
make backend-run    # 터미널 1
make frontend-run   # 터미널 2

# 4. 배포 (최초 1회 설정)
make deploy-init
# → GitHub Secrets 3개 등록 (RAILWAY_TOKEN, RAILWAY_BACKEND_SVC_ID, RAILWAY_FRONTEND_SVC_ID)
# → Railway 환경변수 수동 설정 (CORS, FRONTEND_URL, NEXT_PUBLIC_API_URL)

# 5. 이후 배포
git add . && git commit -m "feat: 기능 추가"
git push origin main
# → CI/CD 자동 실행 → Railway 배포 완료
```
