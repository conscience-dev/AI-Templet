# SPEC — [프로젝트 이름]

> 이 파일을 `SPEC.md`로 복사한 뒤 작성하세요.
> Claude Code에게 "SPEC.md를 읽고 프로젝트를 생성해줘"라고 요청하면 자동으로 전체 코드를 생성합니다.
>
> **작성 팁:**
> - `<!-- 주석 -->` 안의 예시를 참고하여 실제 값으로 교체하세요
> - 섹션 9(에이전트)와 섹션 10(디자인)은 선택사항입니다 — 필요 없으면 섹션 전체를 삭제하세요
> - 섹션 3(모델)과 섹션 4(API)가 가장 중요합니다 — 여기가 부실하면 코드 품질이 떨어집니다

---

## 1. 프로젝트 기본정보

| 항목 | 값 |
|------|---|
| 프로젝트 이름 | <!-- 예: Princeton Review — 대학 입시 컨설팅 플랫폼 --> |
| slug | <!-- 예: princeton-review (URL, 파일명, DB 컬렉션명에 사용) --> |
| 도메인 | <!-- 예: princeton.example.com --> |
| 설명 | <!-- 한 줄 설명. 예: 컨설턴트가 학생을 관리하고 AI 챗으로 분석을 수행하는 SaaS --> |

---

## 2. 사용자 역할 (Roles)

> 역할은 시스템 전체의 권한 체계를 결정합니다.
> `admin`은 필수이며, 나머지는 프로젝트에 맞게 정의하세요.

| slug | 이름 | 설명 | 권한 수준 |
|------|------|------|----------|
| `admin` | 관리자 | 전체 시스템 관리 | 모든 리소스 CRUD + 사용자 관리 |
| `member` | 멤버 | 일반 사용자 | 자신의 리소스 CRUD |
<!-- 필요시 추가:
| `viewer` | 뷰어 | 읽기 전용 | 조회만 가능 |
| `pending` | 승인대기 | 가입 후 관리자 승인 전 | 접근 불가 |
| `inactive` | 비활성 | 비활성화된 계정 | 접근 불가 |
-->

<!-- 승인 워크플로우가 필요하면 아래 작성:
**승인 워크플로우**: 회원가입 → `pending` → 관리자 승인 → `member`
-->

<!-- 역할 내에서 세분화된 권한이 필요하면 아래 작성:
**권한 레벨** (permission 필드):

| 값 | 설명 |
|----|------|
| `read` | 읽기만 |
| `write` | 읽기 + 쓰기 |
| `all` | 모든 권한 |
-->

---

## 3. 데이터 모델

> 리소스(테이블)별로 아래 블록을 반복합니다.
> `BaseModel`(id, created_at, updated_at)은 자동 포함이므로 생략하세요.
>
> **타입 가이드:**
> - 문자열: `String(길이)` — 제목, 이름 등
> - 긴 텍스트: `Text` — 설명, 본문 등
> - 숫자: `Integer`, `Float`
> - 날짜: `DateTime`
> - 논리값: `Boolean`
> - 선택지: `Enum(값1, 값2, 값3)` — 상태, 타입 등
> - JSON: `JSON` — 태그 배열, 설정 객체 등
> - 외래키: `FK → 모델명` — 다른 모델과의 관계
>
> **제약조건 가이드:**
> - `NOT NULL` — 필수 필드
> - `nullable` — 선택 필드
> - `unique` — 중복 불가
> - `default=값` — 기본값
> - `CASCADE` — 부모 삭제 시 함께 삭제

### 모델: `Task`

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `title` | `String(200)` | `NOT NULL` | 태스크 제목 |
| `description` | `Text` | `nullable` | 상세 설명 |
| `status` | `Enum(todo, in_progress, done)` | `NOT NULL, default=todo` | 진행 상태 |
| `priority` | `Enum(low, medium, high)` | `NOT NULL, default=medium` | 우선순위 |
| `due_date` | `DateTime` | `nullable` | 마감일 |
| `assignee_id` | `FK → User` | `nullable` | 담당자 |
| `project_id` | `FK → Project` | `NOT NULL, CASCADE` | 소속 프로젝트 |

<!-- 필요한 만큼 ### 모델: `XXX` 블록을 추가하세요.
예시:

### 모델: `Comment`

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `content` | `Text` | `NOT NULL` | 댓글 내용 |
| `task_id` | `FK → Task` | `NOT NULL, CASCADE` | 소속 태스크 |
| `author_id` | `FK → User` | `NOT NULL` | 작성자 |
-->

---

## 4. API 엔드포인트

> 리소스별로 아래 블록을 반복합니다.
>
> **`crud` 키워드**: 적으면 5개 엔드포인트(목록/상세/생성/수정/삭제)가 자동 생성됩니다.
> 추가 엔드포인트가 필요하면 테이블에 추가하세요.
>
> **권한 가이드:**
> - `모든 역할` — 로그인한 모든 사용자
> - `admin` — 관리자만
> - `admin, member` — 관리자 + 멤버
> - `작성자 또는 admin` — 본인이 생성한 리소스만 + 관리자는 모두 가능

### 리소스: `Task`

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| `PATCH` | `/v1/tasks/{id}/status` | 상태 변경 | 필요 | `admin`, `member` |

<!-- 검색/필터가 필요하면 목록 API에 쿼리 파라미터를 명시:
목록 API 쿼리 파라미터: `?search=제목&status=todo&assignee_id=xxx&page=1`
-->

<!-- 필요한 만큼 ### 리소스: `XXX` 블록을 추가하세요 -->

---

## 5. 페이지 구성

> 프론트엔드 페이지를 정의합니다.
> `authenticated` 레이아웃은 사이드바가 포함되며, `public`은 로그인/회원가입 등 비인증 페이지입니다.
>
> **구성 요소 작성 팁:**
> - 구체적으로 작성할수록 좋습니다 (예: "테이블" → "학생명, 상태, 최근상담일 컬럼의 테이블 + 상태별 필터 탭")
> - 버튼명, 필드명을 한국어로 명시하세요

| 경로 | 페이지명 | 레이아웃 | 인증 | 구성 요소 |
|------|---------|---------|------|----------|
| `/login` | 로그인 | public | 불필요 | 이메일/비밀번호 폼, 회원가입 링크 |
| `/signup` | 회원가입 | public | 불필요 | 회원가입 폼, 약관 동의 |
| `/dashboard` | 대시보드 | authenticated | 필요 | 통계 카드 4개, 최근 항목 테이블 |
| `/tasks` | 태스크 목록 | authenticated | 필요 | 검색바, 상태 필터 탭, 테이블, 페이지네이션 |
| `/tasks/[id]` | 태스크 상세 | authenticated | 필요 | 상세 정보 카드, 댓글 목록, 상태 변경 버튼 |

<!-- 필요시 추가:
| `/tasks/new` | 태스크 생성 | authenticated | 필요 | 생성 폼 (제목, 설명, 우선순위, 마감일, 담당자) |
| `/tasks/[id]/edit` | 태스크 편집 | authenticated | 필요 | 수정 폼 |
| `/settings` | 설정 | authenticated | 필요 | 프로필 수정, 비밀번호 변경 |
| `/admin/users` | 사용자 관리 | authenticated | 필요 (`admin`) | 사용자 테이블, 역할 변경, 승인 버튼 |
-->

---

## 6. 레이아웃

### 사이드바 메뉴 (authenticated 레이아웃)

> 아이콘은 [lucide-react](https://lucide.dev/icons) 아이콘명을 사용합니다.
> 역할 제한이 있으면 해당 역할만 메뉴가 보입니다.

| 메뉴명 | 경로 | 아이콘 (lucide) | 역할 제한 |
|--------|------|----------------|----------|
| 대시보드 | `/dashboard` | `LayoutDashboard` | 없음 |
| 태스크 | `/tasks` | `CheckSquare` | 없음 |
<!-- 필요시 추가:
| 멤버 관리 | `/admin/users` | `Users` | `admin` |
| 설정 | `/settings` | `Settings` | 없음 |
| 상담 챗 | `/chat` | `MessageSquare` | 없음 |
-->

### 사이드바 기능

<!-- 필요한 기능에 체크:
- [ ] 접기/펼치기 토글 (펼침: 240px, 접힘: 64px 아이콘만)
- [ ] 하단 로그아웃 버튼
- [ ] 현재 경로 하이라이트
- [ ] 사용자 프로필 (아바타 + 이름)
-->

---

## 7. 추가 기능

> 필요한 기능에 `[x]` 체크하세요. 체크된 항목만 구현됩니다.

- [ ] 이메일 인증 (회원가입 시 인증 메일 발송)
- [ ] 사용자 승인 워크플로우 (가입 → pending → admin 승인)
- [ ] 비밀번호 재설정
- [ ] 파일 업로드 (S3/R2)
- [ ] 실시간 알림 (WebSocket)
- [ ] 검색 + 필터 (전문 검색)
- [ ] 내보내기 (CSV/Excel/PDF)
- [ ] 다크 모드
- [ ] 다국어 (i18n)
- [ ] Markdown 에디터 + 렌더러
- [ ] 감사 로그 (Audit Log)
- [ ] Rate Limiting

---

## 8. 배포 설정

| 항목 | 값 |
|------|---|
| 플랫폼 | Railway |
| DB | PostgreSQL (Railway Addon) |
| 백엔드 도메인 | <!-- 예: api.tasks.example.com --> |
| 프론트엔드 도메인 | <!-- 예: tasks.example.com --> |
| 환경변수 관리 | Railway Variables |

---

## 9. 에이전트 설정 (선택)

> **이 섹션이 있으면** Phase 5.5에서 AI 에이전트 시스템이 자동 생성됩니다.
> **없으면** 이 Phase를 건너뜁니다 — 에이전트가 필요 없는 프로젝트는 이 섹션을 삭제하세요.
>
> **동작 원리:**
> 1. 아래 테이블을 `.claude/agents/agent.md`가 파싱합니다
> 2. 메인 에이전트 설정 → `backend/app/agent/core.py` + `config.py` 환경변수 생성
> 3. 서브에이전트 테이블 → `chat.py`에 `SubAgent` 정의 자동 추가
> 4. 커스텀 도구 테이블 → `backend/app/agent/tools/db_tools.py` 자동 생성 (섹션 3 모델 참조)
> 5. RAG 소스 테이블 → 파일 임베딩 API (`routers/embedding.py`) + 모델 + 마이그레이션 생성

### 메인 에이전트

| 항목 | 값 |
|------|---|
| 에이전트 이름 | <!-- 예: 입시 컨설팅 AI --> |
| 프레임워크 | Deep Agents (`deepagents` v0.4+) |
| LLM | <!-- 예: Anthropic Claude (`claude-sonnet-4-20250514`) --> |
| Temperature | <!-- 0.0~1.0, 예: 0.7 (높을수록 창의적, 낮을수록 정확) --> |
| Max Tokens | <!-- 예: 4096 (응답 최대 길이) --> |
| 임베딩 모델 | <!-- 예: `text-embedding-3-small` (RAG 소스가 있을 때 필수) --> |
| 벡터 DB | Qdrant |

### 시스템 프롬프트

<!-- 에이전트의 역할과 지침을 작성합니다. 구체적으로 작성할수록 에이전트 품질이 올라갑니다.

포함할 내용:
1. 역할 정의 — "당신은 ~~ 전문 AI 어시스턴트입니다"
2. 핵심 기능 나열 — "학생 데이터를 분석하여..." / "문서를 검색하여..."
3. 행동 지침 — "한국어로 응답", "근거 제시", "불확실한 정보 표시"
4. 제한 사항 — "개인정보 보호", "의료/법률 조언 금지" 등

예시:
당신은 대학 입시 컨설팅 전문 AI 어시스턴트입니다.

**역할:**
- 학생의 프로필, 성적, 활동 데이터를 분석하여 입시 전략을 제안합니다.
- 업로드된 대학 자료를 RAG 검색하여 근거를 제시합니다.

**지침:**
- 한국어로 응답합니다.
- 불확실한 정보에 대해서는 명시적으로 표시합니다.
-->

### 서브에이전트 (선택)

> 서브에이전트는 메인 에이전트가 작업을 위임하는 전문화된 하위 에이전트입니다.
> 복잡한 도메인에서 역할을 분리하면 응답 품질이 올라갑니다.
> 필요 없으면 이 테이블을 삭제하세요.
>
> **이름**: snake_case (예: `university_agent`)
> **도구**: 아래 커스텀 도구 테이블에서 정의한 도구명 + `search_knowledge` (기본 제공)

| 이름 | 설명 | 도구 |
|------|------|------|
<!-- 예:
| `university_agent` | 대학 정보 검색 및 입학 요건 분석. 대학 랭킹, 합격률, 전공별 요건을 RAG에서 검색하고 비교 분석. | `search_knowledge`, `get_student_info` |
| `student_agent` | 학생 프로필 분석 및 전략 제안. DB 학생 데이터를 조회하고 대학 요건과 매칭하여 전략 수립. | `search_knowledge`, `get_student_info`, `list_student_reports` |
| `report_agent` | 리포트 초안 생성. 학생 데이터와 분석 결과를 바탕으로 상담 리포트를 작성. | `search_knowledge`, `get_student_info`, `list_student_reports` |
-->

### 커스텀 도구 (선택)

> 에이전트가 사용할 도구를 정의합니다.
> `search_knowledge`는 RAG 검색 도구로 항상 자동 생성되므로 여기에 적지 않아도 됩니다.
>
> **DB 조회 도구를 만들려면:**
> - `get_{모델명}_info` — 섹션 3의 해당 모델 전체 필드를 조회하는 도구 생성
> - `list_{모델명}_{관련모델명}s` — FK 관계를 따라 관련 목록을 조회하는 도구 생성
> - 모델명은 섹션 3에서 정의한 이름의 snake_case입니다 (Student → student)

| 도구 | 설명 |
|------|------|
<!-- 예:
| `get_student_info` | DB에서 학생 프로필 조회 (이름, 성적, 희망 대학, 상태 등) — 섹션 3의 Student 모델 참조 |
| `list_student_reports` | DB에서 학생의 상담 리포트 목록 조회 — 섹션 3의 Report 모델 참조 (FK: student_id) |
| `get_task_summary` | DB에서 태스크 정보 조회 — 섹션 3의 Task 모델 참조 |
-->

### RAG 소스 (선택)

> 에이전트가 참조할 문서를 정의합니다.
> 이 테이블이 있으면 **파일 임베딩 API**가 자동 생성됩니다:
> - `POST /v1/embeddings/upload` — 파일 업로드 → Qdrant 임베딩
> - `GET /v1/embeddings` — 임베딩 문서 목록
> - `DELETE /v1/embeddings/{id}` — 문서 삭제
>
> **지원 형식**: PDF, DOCX, TXT, MD (최대 10MB)
> **카테고리**: 아래 소스명이 임베딩 시 category 메타데이터로 저장됩니다.
>
> 필요 없으면 이 테이블을 삭제하세요.

| 소스 | 타입 | 설명 |
|------|------|------|
<!-- 예:
| 대학 입학 가이드 | `file` (PDF/DOCX) | 대학별 입학 요건, 합격률, 전공 정보 문서 |
| 입시 트렌드 리포트 | `file` (PDF) | 연도별 입시 트렌드, 통계 자료 |
| 학생 포트폴리오 | `file` (PDF/DOCX) | 학생별 에세이, 활동 내역서, 성적표 |
| 컨설팅 매뉴얼 | `file` (PDF/DOCX) | 컨설턴트용 상담 가이드라인 |
| 제품 매뉴얼 | `file` (PDF) | 제품 사용 설명서 |
| FAQ 문서 | `file` (MD/TXT) | 자주 묻는 질문과 답변 |
-->

### 환경변수

> 아래 환경변수가 `backend/.env`에 자동 추가됩니다. API 키는 직접 설정해야 합니다.

```env
# Deep Agent
ANTHROPIC_API_KEY=          # Anthropic API 키 (필수)
AGENT_MODEL=                # 위 LLM 항목의 모델명
AGENT_TEMPERATURE=          # 위 Temperature 값
AGENT_MAX_TOKENS=           # 위 Max Tokens 값

# Qdrant (RAG)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=             # Qdrant Cloud 사용 시 필요
QDRANT_COLLECTION_NAME=     # slug_knowledge (자동 생성)

# 임베딩 (RAG 소스가 있을 때)
EMBEDDING_MODEL=            # 위 임베딩 모델 항목
EMBEDDING_API_KEY=          # OpenAI API 키 (임베딩용)
```

---

## 10. 디자인 요구사항 (선택)

> **이 섹션이 있으면** Phase 9.5에서 **디자인 시스템**이 자동 적용됩니다.
> **없으면** 기본 디자인 토큰(rd, blue 등)이 사용됩니다.
>
> **작성 팁:**
> - Tailwind CSS 클래스로 작성하면 그대로 코드에 반영됩니다
> - 색상은 Tailwind 기본 팔레트 사용을 권장합니다 (indigo, emerald, rose 등)
> - 커스텀 HEX가 필요하면 `#4F46E5` 형태로 명시하세요

### 브랜드 컬러

| 용도 | 색상 | Tailwind |
|------|------|---------|
| 브랜드 Primary | <!-- 예: Indigo #4F46E5 --> | <!-- 예: `indigo-600` --> |
| 사이드바 배경 | <!-- 예: Deep Indigo --> | <!-- 예: `bg-indigo-950` --> |
| 사이드바 활성 | <!-- 예: 반투명 --> | <!-- 예: `bg-white/15` --> |
| CTA 버튼 | <!-- 예: Indigo 600 --> | <!-- 예: `bg-indigo-600 hover:bg-indigo-700` --> |
| 링크 | <!-- 예: Indigo 600 --> | <!-- 예: `text-indigo-600` --> |

### 레이아웃 원칙

<!-- 아래를 프로젝트에 맞게 수정하세요 -->
- 여백: 카드 `p-6~p-8`, 테이블 셀 `py-4 px-6`, 섹션 간 `space-y-8`
- 최대 너비: 대시보드/목록 `max-w-7xl`, 폼/상세 `max-w-4xl`
- 카드: `rounded-xl border-0 shadow-sm`
- 페이지 배경: <!-- 예: `bg-slate-50` -->

### 컴포넌트 명세

> 필요한 컴포넌트만 작성하세요. Tailwind 클래스 수준으로 상세하게 명세합니다.
> 여기에 작성하지 않은 컴포넌트는 기본 shadcn/ui 스타일이 적용됩니다.

#### 사이드바
<!--
- 배경: `bg-{color}-950`
- 로고: 흰색 텍스트 + `{color}-400` 아이콘
- 메뉴: 기본 `text-{color}-200` → 호버 `text-white bg-white/10` → 활성 `text-white bg-white/15 font-medium`
- 하단: 사용자 이니셜 아바타 + 이름 + 로그아웃
- 구분선: `border-{color}-800`
-->

#### 통계 카드 (대시보드)
<!--
- 레이아웃: `grid-cols-4`, 각 카드 `p-6`
- 아이콘: `h-12 w-12` 원형, 8% 배경 (`bg-{color}-50`)
- 숫자: `text-3xl font-bold`
- 라벨: `text-xs text-slate-500 uppercase tracking-wider`
-->

#### 테이블
<!--
- 헤더: `text-xs uppercase tracking-wider text-slate-400 font-medium bg-slate-50`
- 셀: `py-4 px-6`
- 호버: `hover:bg-slate-50`
- 링크: `text-{color}-600 font-medium hover:text-{color}-800`
- 액션: 항상 표시, 아이콘 버튼 나열
-->

#### 배지
<!--
- 배경: 8% opacity (`bg-green-50 text-green-700`, `bg-yellow-50 text-yellow-700`)
- 크기: `px-2.5 py-1 text-xs font-medium rounded-full`
-->

#### 로그인 페이지
<!--
- 좌측 패널: `bg-{color}-950` 풀하이트, 브랜드 로고 + 슬로건 + 기능 하이라이트 3개
- 우측 패널: 흰색 배경, 헤딩 + 로그인 폼
-->

#### 채팅 UI (섹션 9가 있을 때)
<!--
- 사용자 버블: `bg-{color}-600 text-white rounded-2xl rounded-br-md`
- AI 버블: `bg-white border border-slate-200 rounded-2xl rounded-bl-md`
- AI 아바타: `bg-{color}-100` 원형 + `Bot` 아이콘
- 입력창: `rounded-full border-slate-200 shadow-sm`
-->

#### 빈 상태
<!--
- 중앙 정렬: 아이콘 (64px, `text-slate-300`) + 메시지 + CTA 버튼
-->

#### 페이지네이션
<!--
- 숫자 버튼 방식 (`1 2 3 ... 10`)
- 활성: `bg-{color}-600 text-white rounded-md`
- 비활성: `text-slate-600 hover:bg-slate-100`
-->
