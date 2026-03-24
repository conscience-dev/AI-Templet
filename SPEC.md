# SPEC — 이비가푸드 AI 자산화 업무툴

## 1. 프로젝트 기본정보

| 항목 | 값 |
|------|---|
| 프로젝트 이름 | 이비가푸드 AI 자산화 업무툴 |
| slug | ibiga-food-ai-asset-tool |
| 설명 | 프랜차이즈 점포개발 상담 관리와 슈퍼바이저 점포 관리를 AI 기반으로 자동화하는 본사 업무 플랫폼 |
| 개발사 | Amplab (대표: 김진영) |
| 고객사 | 이비가푸드 |
| 대상 독자 | 경영진/임원, 점포개발팀, 슈퍼바이저팀 |

## 2. 사용자 역할 (Roles)

| slug | 이름 | 설명 | 권한 수준 |
|------|------|------|----------|
| `admin` | 시스템 관리자 | 전체 시스템 관리 및 사용자 관리 | 모든 리소스 CRUD + 사용자 관리 |
| `executive` | 경영진 | 대시보드 조회, 전사 지표 모니터링 | 대시보드 조회, 보고서 생성 |
| `dev_manager` | 점포개발 팀장 | 상담 이력 관리, 고객 전환 추적 | 상담 기록 CRUD, 고객 상태 변경 |
| `dev_staff` | 점포개발 담당자 | 상담 진행, 고객 정보 입력 | 상담 기록 생성/수정, 고객 조회 |
| `supervisor_manager` | 슈퍼바이저 팀장 | 점포 점검 결과 분석, 개선사항 추적 | 점검 기록 조회, 분석 리포트 생성 |
| `supervisor` | 슈퍼바이저 | 점포 방문 점검, 점검 결과 입력 | 점검 기록 생성/수정 |

## 3. 데이터 모델

### 모델: `Prospect` (가맹문의자)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `name` | String(100) | NOT NULL | 가맹문의자 이름 |
| `phone` | String(20) | NOT NULL, UNIQUE | 연락처 |
| `email` | String(100) | - | 이메일 주소 |
| `inquiry_path` | Enum(매장방문, 매체광고, 인터넷검색, 소개추천, 기타) | NOT NULL | 문의 경로 |
| `hope_region` | String(100) | - | 희망 지역 |
| `startup_budget` | Integer | - | 창업 예산 (만원) |
| `tasted` | Boolean | DEFAULT false | 매장 시식 여부 |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 접수 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |
| `status` | Enum(신규, 진행중, 성약, 종료) | DEFAULT 신규 | 현재 상태 |

### 모델: `Consultation` (상담 기록)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `prospect_id` | String(36) | FK → Prospect, NOT NULL | 가맹문의자 ID |
| `consultation_order` | Integer | NOT NULL | 상담 차수 (1차, 2차, ..., 8차) |
| `consultant_id` | String(36) | FK → User, NOT NULL | 상담자 ID |
| `consultation_date` | DateTime | NOT NULL | 상담 일시 |
| `content` | Text | NOT NULL | 상담 내용 |
| `result` | Enum(A가망고객, B지속고객, C종료의지없음) | NOT NULL | 상담 결과 |
| `next_action` | Text | - | 다음 조치 사항 |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 생성 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |

### 모델: `Store` (가맹점)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `store_name` | String(100) | NOT NULL, UNIQUE | 점포명 (예: 부산해운대센텀점) |
| `region` | String(100) | NOT NULL | 지역 |
| `address` | String(200) | - | 주소 |
| `supervisor_id` | String(36) | FK → User | 담당 슈퍼바이저 ID |
| `store_size` | Integer | - | 점포 면적 (평) |
| `opening_date` | DateTime | - | 개점 일시 |
| `status` | Enum(운영중, 휴점, 폐점) | DEFAULT 운영중 | 점포 상태 |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 생성 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |

### 모델: `StoreInspection` (점포 점검 기록)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `store_id` | String(36) | FK → Store, NOT NULL | 점포 ID |
| `supervisor_id` | String(36) | FK → User, NOT NULL | 점검자(슈퍼바이저) ID |
| `inspection_date` | DateTime | NOT NULL | 점검 일시 |
| `quality_status` | Enum(준수, 미흡) | NOT NULL | 품질 상태 (메뉴얼 준수 여부) |
| `quality_notes` | Text | - | 품질 점검 내용 (면 물붓기, 염도, 야채 볶음 등) |
| `hygiene_status` | Enum(양호, 미흡) | NOT NULL | 위생 상태 |
| `hygiene_notes` | Text | - | 위생 점검 내용 (청소 요청 사항 등) |
| `sales_amount` | Integer | - | 월 매출 (만원) |
| `sales_yoy_change` | Float | - | 전년 동월 대비 매출 변화율 (%) |
| `sales_mom_change` | Float | - | 전월 대비 매출 변화율 (%) |
| `staff_count` | JSON | - | 직원 구성 (예: {"홀": 2, "주방": 3}) |
| `market_change` | Text | - | 상권 변화 (신규 경쟁점포, 폐점 등) |
| `owner_feedback` | Text | - | 점주 의견 및 요청사항 |
| `improvement_items` | JSON | - | 개선 요청 사항 (카테고리별 배열) |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 생성 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |

### 모델: `ImprovementTask` (개선 과제)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `store_id` | String(36) | FK → Store, NOT NULL | 점포 ID |
| `inspection_id` | String(36) | FK → StoreInspection | 원본 점검 기록 ID |
| `category` | Enum(품질, 위생, 매출, 인력, 상권, 기타) | NOT NULL | 개선 카테고리 |
| `task_description` | Text | NOT NULL | 개선 과제 설명 |
| `priority` | Enum(높음, 중간, 낮음) | DEFAULT 중간 | 우선순위 |
| `status` | Enum(미처리, 진행중, 완료, 보류) | DEFAULT 미처리 | 처리 상태 |
| `due_date` | DateTime | - | 완료 예정일 |
| `completed_date` | DateTime | - | 완료 일시 |
| `completion_notes` | Text | - | 완료 내용 |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 생성 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |

### 모델: `User` (사용자)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `id` | String(36) | PK, UUID | 고유 식별자 |
| `email` | String(100) | NOT NULL, UNIQUE | 이메일 |
| `name` | String(100) | NOT NULL | 이름 |
| `role` | Enum(admin, executive, dev_manager, dev_staff, supervisor_manager, supervisor) | NOT NULL | 역할 |
| `department` | String(100) | - | 부서 (점포개발팀, 슈퍼바이저팀 등) |
| `phone` | String(20) | - | 연락처 |
| `is_active` | Boolean | DEFAULT true | 활성 여부 |
| `created_at` | DateTime | NOT NULL, DEFAULT NOW() | 생성 일시 |
| `updated_at` | DateTime | NOT NULL, DEFAULT NOW() | 수정 일시 |

## 4. API 엔드포인트

### 리소스: `Prospect` (가맹문의자)

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/prospects?status=&region=&page=1` | 가맹문의자 목록 조회 (필터/페이지네이션) | 필수 | dev_manager, dev_staff |
| GET | `/prospects/{id}/consultations` | 특정 가맹문의자의 모든 상담 이력 조회 | 필수 | dev_manager, dev_staff |
| GET | `/prospects/{id}/consultation-summary` | 상담 이력 AI 요약 조회 | 필수 | dev_manager, dev_staff |
| POST | `/prospects/{id}/next-consultation-tips` | 다음 상담 팁 AI 생성 | 필수 | dev_manager, dev_staff |
| GET | `/prospects/conversion-analytics` | 상담 전환율 분석 | 필수 | dev_manager, executive |

### 리소스: `Consultation` (상담 기록)

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/consultations?prospect_id=&order=&page=1` | 상담 기록 목록 조회 | 필수 | dev_manager, dev_staff |
| POST | `/consultations/{id}/ai-summary` | 상담 내용 AI 자동 요약 | 필수 | dev_manager, dev_staff |
| GET | `/consultations/best-practices` | 우수 상담 사례 조회 | 필수 | dev_manager, dev_staff |

### 리소스: `Store` (가맹점)

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/stores?region=&status=&supervisor_id=&page=1` | 점포 목록 조회 (필터/페이지네이션) | 필수 | supervisor_manager, supervisor, executive |
| GET | `/stores/{id}/inspections` | 특정 점포의 점검 이력 조회 | 필수 | supervisor_manager, supervisor |
| GET | `/stores/{id}/improvement-tasks` | 특정 점포의 개선 과제 조회 | 필수 | supervisor_manager, supervisor |
| GET | `/stores/{id}/health-score` | 점포 건강도 점수 (품질, 위생, 매출 종합) | 필수 | supervisor_manager, executive |

### 리소스: `StoreInspection` (점포 점검)

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/inspections?store_id=&date_from=&date_to=&page=1` | 점검 기록 목록 조회 | 필수 | supervisor_manager, supervisor |
| POST | `/inspections/{id}/improvement-tasks-auto-create` | 점검 결과로부터 개선 과제 자동 생성 | 필수 | supervisor_manager |
| GET | `/inspections/overdue-tasks` | 미처리 개선 과제 목록 | 필수 | supervisor_manager, executive |

### 리소스: `ImprovementTask` (개선 과제)

**기본 CRUD**: `crud`

**추가 엔드포인트**:

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/improvement-tasks?store_id=&category=&status=&page=1` | 개선 과제 목록 조회 (카테고리/상태 필터) | 필수 | supervisor_manager, supervisor |
| PATCH | `/improvement-tasks/{id}/status` | 개선 과제 상태 변경 | 필수 | supervisor_manager, supervisor |
| GET | `/improvement-tasks/priority-ranking` | 우선순위별 개선 과제 랭킹 | 필수 | supervisor_manager, executive |

### 리소스: `Dashboard` (대시보드)

| 메서드 | 경로 | 설명 | 인증 | 권한 |
|--------|------|------|------|------|
| GET | `/dashboard/executive-summary` | 경영진 대시보드 (전사 지표 요약) | 필수 | executive |
| GET | `/dashboard/dev-team-metrics` | 점포개발팀 대시보드 (상담 전환율, 진행 현황) | 필수 | dev_manager, dev_staff |
| GET | `/dashboard/supervisor-metrics` | 슈퍼바이저 대시보드 (점포별 건강도, 개선 과제) | 필수 | supervisor_manager, supervisor |

## 5. 페이지 구성

| 경로 | 페이지명 | 레이아웃 | 인증 | 구성 요소 |
|------|---------|---------|------|----------|
| `/login` | 로그인 | public | 불필요 | 이메일/비밀번호 입력 폼, 로그인 버튼 |
| `/dashboard` | 대시보드 (역할별) | authenticated | 필수 | 역할별 주요 지표 카드, 최근 활동 목록, 경고 알림 |
| `/prospects` | 가맹문의자 관리 | authenticated | 필수 | 가맹문의자 목록 테이블 (이름, 지역, 상태, 최근 상담일), 상태별 필터 탭, 검색 바, 신규 등록 버튼 |
| `/prospects/{id}` | 가맹문의자 상세 | authenticated | 필수 | 기본 정보, 상담 이력 타임라인, AI 요약 (이전 상담 내용 요약), 다음 상담 팁 (AI 생성), 상담 기록 추가 버튼 |
| `/consultations` | 상담 기록 관리 | authenticated | 필수 | 상담 기록 목록 (상담자, 상담일, 상담 차수, 결과), 가맹문의자별 필터, 상담 차수별 필터, 상담 기록 상세 조회 |
| `/consultations/new` | 상담 기록 입력 | authenticated | 필수 | 가맹문의자 선택, 상담 차수 자동 계산, 상담 내용 입력 (텍스트 에디터), 상담 결과 선택, 다음 조치 입력, 저장 버튼 |
| `/stores` | 점포 관리 | authenticated | 필수 | 점포 목록 테이블 (점포명, 지역, 슈퍼바이저, 상태, 최근 점검일), 지역별/상태별 필터, 슈퍼바이저별 필터, 검색 바 |
| `/stores/{id}` | 점포 상세 | authenticated | 필수 | 기본 정보, 건강도 점수 (품질/위생/매출 종합), 최근 점검 결과, 개선 과제 목록 (카테고리별, 상태별), 점검 기록 추가 버튼 |
| `/inspections` | 점포 점검 관리 | authenticated | 필수 | 점검 기록 목록 (점포명, 점검일, 품질/위생 상태, 매출), 점포별 필터, 날짜 범위 필터, 상태별 필터 |
| `/inspections/new` | 점포 점검 입력 | authenticated | 필수 | 점포 선택, 점검 항목 입력 (품질, 위생, 매출, 직원, 상권, 점주 의견), 개선 요청 사항 입력, 사진 첨부 (선택), 저장 버튼 |
| `/improvement-tasks` | 개선 과제 관리 | authenticated | 필수 | 개선 과제 목록 (점포명, 카테고리, 설명, 우선순위, 상태, 완료예정일), 카테고리별 필터, 상태별 필터, 우선순위 정렬, 상태 변경 버튼 |
| `/reports` | 분석 리포트 | authenticated | 필수 | 상담 전환율 분석 (월별 추이 그래프), 점포 건강도 분석 (지역별/슈퍼바이저별), 개선 과제 진행률 (카테고리별), 매출 분석 (점포별 비교), 리포트 다운로드 버튼 (CSV/PDF) |

## 6. 레이아웃

### 사이드바 메뉴

| 메뉴명 | 경로 | 아이콘 (lucide) | 역할 제한 |
|--------|------|----------------|----------|
| 대시보드 | `/dashboard` | LayoutDashboard | 모든 역할 |
| 가맹문의자 | `/prospects` | Users | dev_manager, dev_staff, executive |
| 상담 기록 | `/consultations` | MessageSquare | dev_manager, dev_staff |
| 점포 관리 | `/stores` | Store | supervisor_manager, supervisor, executive |
| 점포 점검 | `/inspections` | CheckCircle | supervisor_manager, supervisor |
| 개선 과제 | `/improvement-tasks` | ListTodo | supervisor_manager, supervisor, executive |
| 분석 리포트 | `/reports` | BarChart3 | supervisor_manager, dev_manager, executive |
| 사용자 관리 | `/admin/users` | Settings | admin |

## 7. 추가 기능

- [x] 파일 업로드 (점포 점검 시 사진 첨부)
- [x] 실시간 알림 (WebSocket) - 미처리 개선 과제, 점포 건강도 악화 알림
- [x] 검색 + 필터 (가맹문의자, 점포, 개선 과제 등)
- [x] 내보내기 (CSV/Excel/PDF) - 상담 기록, 점검 결과, 개선 과제, 분석 리포트
- [x] AI 기반 자동 요약 및 분석 (상담 내용 요약, 다음 상담 팁, 개선 과제 자동 생성)
- [x] 다크 모드

## 8. 배포 설정

| 항목 | 값 |
|------|---|
| 플랫폼 | Railway |
| DB | PostgreSQL (Railway Addon) |
| 백엔드 | Node.js/Express 또는 Python/FastAPI |
| 프론트엔드 | React + TypeScript + Tailwind CSS |
| 인증 | JWT (Access Token + Refresh Token) |
| 파일 저장소 | AWS S3 또는 Railway 스토리지 |

## 9. 에이전트 설정

### 메인 에이전트: 상담 이력 분석 및 최적화 에이전트

| 항목 | 값 |
|------|---|
| 에이전트 이름 | ConsultationOptimizer |
| LLM | Claude 3.5 Sonnet |
| Temperature | 0.7 |
| Max Tokens | 2000 |

### 시스템 프롬프트

```
당신은 프랜차이즈 점포개발 상담 전문가입니다. 
다음 역할을 수행합니다:

1. **상담 이력 통합 요약**: 가맹문의자의 모든 상담 기록을 분석하여 
   - 고객의 주요 관심사 (지역, 예산, 브랜드 이해도)
   - 상담 진행 상황 (현재 단계, 의사결정 수준)
   - 이전 상담에서 논의된 핵심 내용
   을 명확하게 정리합니다.

2. **다음 상담 팁 생성**: 다음 상담자를 위해
   - 빠트린 질문 항목 (예: 자금 조달 방법, 운영 경험, 가족 동의 여부)
   - 고객의 우려사항 해결 방안
   - 우수 상담 사례 벤치마킹 포인트
   - 상담 스크립트 제안
   을 제공합니다.

3. **우수 상담 사례 학습**: 높은 전환율을 보인 상담 기록을 분석하여
   - 효과적인 상담 구조
   - 고객 신뢰 구축 방법
   - 이의 제기 대응 방법
   을 도출합니다.

4. **상담 품질 평가**: 각 상담 기록에 대해
   - 상담 완성도 점수 (0-100)
   - 개선 필요 영역
   - 강점 분석
   을 제공합니다.

모든 응답은 실무자가 즉시 활용할 수 있도록 
구체적이고 실행 가능한 형태로 제시하세요.
```

### 서브에이전트: 점포 건강도 분석 에이전트

| 이름 | 설명 | 도구 |
|------|------|------|
| StoreHealthAnalyzer | 점포 점검 결과를 분석하여 건강도 점수 산출 및 개선 과제 자동 생성 | 점검 데이터 조회, 매출 분석, 개선 과제 생성 |

### 커스텀 도구

| 도구 | 설명 |
|------|------|
| `get_prospect_consultation_history` | 가맹문의자의 모든 상담 기록 조회 |
| `get_best_consultation_examples` | 전환율 상위 상담 사례 조회 |
| `generate_consultation_summary` | 상담 이력 자동 요약 생성 |
| `generate_next_consultation_tips` | 다음 상담 팁 생성 |
| `get_store_inspection_history` | 점포의 모든 점검 기록 조회 |
| `analyze_store_health` | 점포 건강도 분석 (품질, 위생, 매출) |
| `auto_create_improvement_tasks` | 점검 결과로부터 개선 과제 자동 생성 |
| `get_improvement_task_status` | 개선 과제 진행 상황 조회 |

### RAG 소스

| 소스 | 타입 | 설명 |
|------|------|------|
| 상담 이력 데이터베이스 | 구조화 데이터 | 모든 가맹문의자의 상담 기록 (1차~8차) |
| 점포 점검 데이터베이스 | 구조화 데이터 | 모든 점포의 점검 결과 및 개선 과제 |
| 우수 상담 사례 문서 | 비정형 데이터 | 높은 전환율을 보인 상담 기록 및 분석 |
| 프랜차이즈 운영 매뉴얼 | 비정형 데이터 | 점포개발, 슈퍼바이저 관리 관련 내부 문서 |
| 점포 운영 가이드 | 비정형 데이터 | 품질, 위생, 매출 관리 기준 및 체크리스트 |

## 10. 디자인 요구사항

### 브랜드 컬러

| 용도 | 색상 | Tailwind |
|------|------|---------|
| 주색 (Primary) | #FF6B35 (이비가 브랜드 오렌지) | `bg-orange-500` |
| 보조색 (Secondary) | #004E89 (신뢰감 파란색) | `bg-blue-900` |
| 성공 (Success) | #06A77D (초록색) | `bg-emerald-500` |
| 경고 (Warning) | #F7B801 (노란색) | `bg-amber-400` |
| 위험 (Danger) | #D62828 (빨간색) | `bg-red-600` |
| 배경 (Background) | #F8F9FA (밝은 회색) | `bg-gray-50` |
| 텍스트 (Text) | #2C3E50 (진한 회색) | `text-gray-800` |

### 레이아웃 원칙

- **여백**: 기본 여백 16px (Tailwind `p-4`), 섹션 간 32px (`p-8`)
- **최대 너비**: 1400px (대형 모니터 대응)
- **카드 스타일**: 흰색 배경, 1px 회색 테두리, 8px 모서리 반경, 가벼운 그림자
- **타이포그래피**: 
  - 제목: Inter Bold 24px (h1), 20px (h2), 16px (h3)
  - 본문: Inter Regular 14px
  - 라벨: Inter Medium 12px
- **반응형**: 모바일(320px), 태블릿(768px), 데스크톱(1024px+) 대응

### 컴포넌트 명세

#### 대시보드 카드
```
- 배경: bg-white
- 테두리: border border-gray-200
- 모서리: rounded-lg
- 패딩: p-6
- 그림자: shadow-sm
- 제목: text-lg font-semibold text-gray-900
- 값: text-3xl font-bold text-orange-500
- 부제: text-sm text-gray-500
```

#### 상태 배지
```
- 신규: bg-blue-100 text-blue-800
- 진행중: bg-amber-100 text-amber-800
- 성약: bg-emerald-100 text-emerald-800
- 종료: bg-gray-100 text-gray-800
- 미처리: bg-red-100 text-red-800
- 완료: bg-emerald-100 text-emerald-800
```

#### 테이블
```
- 헤더: bg-gray-50 border-b border-gray-200
- 행: border-b border-gray-100 hover:bg-gray-50
- 셀 패딩: px-6 py-4
- 텍스트: text-sm text-gray-900
```

#### 버튼
```
- 주 버튼: bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg
- 보조 버튼: bg-gray-200 text-gray-900 hover:bg-gray-300 px-4 py-2 rounded-lg
- 위험 버튼: bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg
- 크기: sm(px-3 py-1), md(px-4 py-2), lg(px-6 py-3)
```

#### 입력 필드
```
- 배경: bg-white
- 테두리: border border-gray-300 focus:border-orange-500
- 모서리: rounded-lg
- 패딩: px-4 py-2
- 포커스: ring-2 ring-orange-200
```

#### 필터 탭
```
- 활성 탭: border-b-2 border-orange-500 text-orange-500 font-semibold
- 비활성 탭: border-b-2 border-transparent text-gray-600 hover:text-gray-900
- 패딩: px-4 py-2
```

