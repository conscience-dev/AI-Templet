# SPEC — 이비가푸드 AI 자산화 업무툴 (프로토타입 범위 축소본)

## 0. 프로토타입 목표

이 프로토타입의 목적은 **전체 운영 시스템을 완성하는 것**이 아니라,
이비가푸드 본사 실무자가 아래 3가지를 실제로 체감하도록 만드는 데 있다.

1. 가맹문의 상담 이력을 한곳에서 관리할 수 있다.
2. 점포 점검 내용을 구조화해서 입력하고 후속조치를 추적할 수 있다.
3. AI가 상담 요약 / 다음 액션 / 점검 기반 개선 항목 추천을 실무에 바로 도움되는 수준으로 제공한다.

따라서 프로토타입은 다음 원칙으로 제한한다.

* 복잡한 자동화 워크플로우는 제외
* 고도화된 예측 AI는 제외
* 역할/권한은 최소화
* 모바일 앱, 실시간 연동, 외부 메신저 알림 제외
* 운영 가능한 수준의 핵심 입력/조회/분석 흐름만 구현

---

## 1. 프로젝트 기본정보

| 항목      | 값                                                                |
| ------- | ---------------------------------------------------------------- |
| 프로젝트 이름 | 이비가푸드 AI 자산화 업무툴                                                 |
| slug    | ibiga-food-ai-asset-tool                                         |
| 설명      | 프랜차이즈 점포개발 상담 관리와 슈퍼바이저 점검 관리를 통합하고, AI로 요약·추천을 제공하는 내부 업무 프로토타입 |
| 개발사     | Amplab                                                           |
| 고객사     | 이비가푸드                                                            |
| 대상 독자   | 경영진/임원, 점포개발팀, 슈퍼바이저팀                                            |
| 개발 목표   | 프로토타입(시연 및 PoC)                                                  |

---

## 2. 이번 프로토타입에서 구현할 범위

### 포함 범위

1. 가맹문의자 등록 / 조회 / 수정
2. 상담 기록 등록 / 조회
3. 상담 이력 AI 요약
4. 다음 상담 액션 제안
5. 점포 등록 / 조회
6. 점포 점검 기록 등록 / 조회
7. 점검 결과 기반 개선 과제 자동 생성
8. 개선 과제 상태 변경
9. 역할별 기본 대시보드
10. 리포트 화면에서 기본 통계 조회

### 제외 범위

1. 정교한 권한 제어(Row-level permission)
2. 계약/성약 이후 자동 점포 생성 워크플로우
3. Slack/이메일/카카오 알림 연동
4. WebSocket 기반 실시간 협업
5. 음성 입력 / 통화 녹취 자동 수집
6. 사진 AI 분석
7. 예측 모델(성약 확률, 폐점 위험도 등)
8. 복잡한 조직 구조/결재 기능
9. 모바일 앱
10. 고급 RAG 파이프라인

---

## 3. 사용자 역할 (프로토타입 축소본)

프로토타입은 역할을 너무 잘게 나누지 않고 3개로 단순화한다.

| slug      | 이름     | 설명                      | 권한 수준        |
| --------- | ------ | ----------------------- | ------------ |
| `admin`   | 관리자    | 전체 데이터 관리, 사용자 계정 관리    | 모든 리소스 CRUD  |
| `manager` | 팀장/관리자 | 상담/점검/개선과제/대시보드 조회 및 관리 | 대부분 기능 사용 가능 |
| `staff`   | 실무자    | 상담 입력, 점검 입력, 본인 업무 조회  | 입력/조회 중심     |

### 권한 원칙

* `admin`: 전체 기능 접근 가능
* `manager`: Prospect, Consultation, Store, Inspection, ImprovementTask, Dashboard 접근 가능
* `staff`: Prospect/Consultation/Inspection 입력 및 조회 가능, 대시보드는 제한적 조회

---

## 4. 핵심 사용자 시나리오

### 시나리오 A — 점포개발팀 상담 관리

1. 실무자가 가맹문의자를 등록한다.
2. 상담 기록을 누적 입력한다.
3. AI가 기존 상담 내용을 요약한다.
4. AI가 다음 상담 때 물어볼 질문과 권장 액션을 제안한다.
5. 팀장이 전체 문의자 진행 현황과 전환 현황을 본다.

### 시나리오 B — 슈퍼바이저 점검 관리

1. 슈퍼바이저가 점포를 선택한다.
2. 점검 결과(품질/위생/매출/점주의견)를 입력한다.
3. AI가 개선 과제를 자동 추천한다.
4. 팀장이 개선 과제 상태를 관리한다.
5. 경영진/관리자가 점포별 상태와 누적 과제를 본다.

---

## 5. 데이터 모델

프로토타입에서는 분석 가능성과 구현 난이도를 고려하여 JSON 사용을 최소화하고 핵심 필드만 유지한다.

### 모델: `User`

| 필드명             | 타입                                      | 제약조건             | 설명      |
| --------------- | --------------------------------------- | ---------------- | ------- |
| `id`            | UUID                                    | PK               | 사용자 ID  |
| `email`         | String                                  | NOT NULL, UNIQUE | 로그인 이메일 |
| `password_hash` | String                                  | NOT NULL         | 비밀번호 해시 |
| `name`          | String                                  | NOT NULL         | 이름      |
| `role`          | Enum(admin, manager, staff)             | NOT NULL         | 역할      |
| `department`    | Enum(dev, supervisor, executive, admin) | -                | 소속      |
| `is_active`     | Boolean                                 | DEFAULT true     | 활성 여부   |
| `created_at`    | DateTime                                | DEFAULT NOW()    | 생성일     |
| `updated_at`    | DateTime                                | DEFAULT NOW()    | 수정일     |

### 모델: `Prospect`

| 필드명                | 타입                                | 제약조건          | 설명        |
| ------------------ | --------------------------------- | ------------- | --------- |
| `id`               | UUID                              | PK            | 가맹문의자 ID  |
| `name`             | String                            | NOT NULL      | 이름        |
| `phone`            | String                            | NOT NULL      | 연락처       |
| `email`            | String                            | -             | 이메일       |
| `inquiry_path`     | Enum(매장방문, 매체광고, 인터넷검색, 소개추천, 기타) | NOT NULL      | 문의 경로     |
| `hope_region`      | String                            | -             | 희망 지역     |
| `startup_budget`   | Integer                           | -             | 창업 예산(만원) |
| `status`           | Enum(신규, 상담중, 보류, 성약, 종료)         | DEFAULT 신규    | 상태        |
| `assigned_user_id` | UUID                              | FK → User     | 담당자       |
| `memo`             | Text                              | -             | 비고        |
| `created_at`       | DateTime                          | DEFAULT NOW() | 생성일       |
| `updated_at`       | DateTime                          | DEFAULT NOW() | 수정일       |

### 모델: `Consultation`

| 필드명                  | 타입                   | 제약조건                    | 설명       |
| -------------------- | -------------------- | ----------------------- | -------- |
| `id`                 | UUID                 | PK                      | 상담 ID    |
| `prospect_id`        | UUID                 | FK → Prospect, NOT NULL | 문의자 ID   |
| `consultation_order` | Integer              | NOT NULL                | 상담 차수    |
| `consultant_id`      | UUID                 | FK → User, NOT NULL     | 상담자      |
| `consultation_date`  | DateTime             | NOT NULL                | 상담 일시    |
| `content`            | Text                 | NOT NULL                | 상담 내용    |
| `result`             | Enum(긍정, 보통, 부정, 종료) | NOT NULL                | 상담 결과    |
| `next_action`        | Text                 | -                       | 다음 액션 메모 |
| `created_at`         | DateTime             | DEFAULT NOW()           | 생성일      |
| `updated_at`         | DateTime             | DEFAULT NOW()           | 수정일      |

### 모델: `Store`

| 필드명             | 타입                | 제약조건          | 설명       |
| --------------- | ----------------- | ------------- | -------- |
| `id`            | UUID              | PK            | 점포 ID    |
| `store_name`    | String            | NOT NULL      | 점포명      |
| `region`        | String            | NOT NULL      | 지역       |
| `address`       | String            | -             | 주소       |
| `supervisor_id` | UUID              | FK → User     | 담당 슈퍼바이저 |
| `status`        | Enum(운영중, 휴점, 폐점) | DEFAULT 운영중   | 점포 상태    |
| `created_at`    | DateTime          | DEFAULT NOW() | 생성일      |
| `updated_at`    | DateTime          | DEFAULT NOW() | 수정일      |

### 모델: `StoreInspection`

| 필드명               | 타입           | 제약조건                 | 설명       |
| ----------------- | ------------ | -------------------- | -------- |
| `id`              | UUID         | PK                   | 점검 ID    |
| `store_id`        | UUID         | FK → Store, NOT NULL | 점포 ID    |
| `supervisor_id`   | UUID         | FK → User, NOT NULL  | 점검자      |
| `inspection_date` | DateTime     | NOT NULL             | 점검 일시    |
| `quality_status`  | Enum(양호, 미흡) | NOT NULL             | 품질 상태    |
| `quality_notes`   | Text         | -                    | 품질 메모    |
| `hygiene_status`  | Enum(양호, 미흡) | NOT NULL             | 위생 상태    |
| `hygiene_notes`   | Text         | -                    | 위생 메모    |
| `sales_note`      | Text         | -                    | 매출 관련 메모 |
| `owner_feedback`  | Text         | -                    | 점주 의견    |
| `created_at`      | DateTime     | DEFAULT NOW()        | 생성일      |
| `updated_at`      | DateTime     | DEFAULT NOW()        | 수정일      |

### 모델: `ImprovementTask`

| 필드명                | 타입                       | 제약조건                           | 설명       |
| ------------------ | ------------------------ | ------------------------------ | -------- |
| `id`               | UUID                     | PK                             | 과제 ID    |
| `store_id`         | UUID                     | FK → Store, NOT NULL           | 점포 ID    |
| `inspection_id`    | UUID                     | FK → StoreInspection, NOT NULL | 원본 점검 ID |
| `category`         | Enum(품질, 위생, 매출, 운영, 기타) | NOT NULL                       | 카테고리     |
| `task_description` | Text                     | NOT NULL                       | 과제 내용    |
| `priority`         | Enum(높음, 중간, 낮음)         | DEFAULT 중간                     | 우선순위     |
| `status`           | Enum(미처리, 진행중, 완료)       | DEFAULT 미처리                    | 처리 상태    |
| `due_date`         | Date                     | -                              | 목표 완료일   |
| `created_at`       | DateTime                 | DEFAULT NOW()                  | 생성일      |
| `updated_at`       | DateTime                 | DEFAULT NOW()                  | 수정일      |

---

## 6. 핵심 AI 기능 정의

프로토타입에서는 AI 기능을 2개 흐름으로만 제한한다.

### AI 기능 1 — 상담 이력 요약

입력:

* 특정 Prospect의 전체 Consultation 목록

출력:

* 핵심 관심사
* 현재 진행 단계
* 고객 우려사항
* 이전 상담 핵심 포인트 3~5개

### AI 기능 2 — 다음 상담 액션 제안

입력:

* Prospect 기본정보
* 최근 상담 내용
* 전체 상담 이력 요약

출력:

* 다음 상담에서 꼭 물어봐야 할 질문
* 설득 포인트
* 주의할 리스크
* 추천 다음 액션

### AI 기능 3 — 점검 결과 기반 개선 과제 추천

입력:

* StoreInspection 데이터

출력:

* 카테고리별 개선 과제 1~5건
* 우선순위
* 추천 조치 문장

### 비포함 AI 기능

* 성약 확률 예측
* 폐점 위험도 예측
* 상담 품질 자동 채점
* 이미지 분석
* 고급 벡터검색 기반 RAG

---

## 7. API 엔드포인트

프로토타입에서는 화면 구현에 필요한 최소 API만 정의한다.

### Auth

| 메서드  | 경로             | 설명      |
| ---- | -------------- | ------- |
| POST | `/auth/login`  | 로그인     |
| POST | `/auth/logout` | 로그아웃    |
| GET  | `/auth/me`     | 내 정보 조회 |

### Prospect

| 메서드   | 경로                | 설명          |
| ----- | ----------------- | ----------- |
| GET   | `/prospects`      | 가맹문의자 목록 조회 |
| POST  | `/prospects`      | 가맹문의자 등록    |
| GET   | `/prospects/{id}` | 가맹문의자 상세 조회 |
| PATCH | `/prospects/{id}` | 가맹문의자 수정    |

### Consultation

| 메서드  | 경로                              | 설명               |
| ---- | ------------------------------- | ---------------- |
| GET  | `/prospects/{id}/consultations` | 특정 문의자의 상담 목록 조회 |
| POST | `/prospects/{id}/consultations` | 상담 기록 등록         |
| GET  | `/consultations/{id}`           | 상담 상세 조회         |
| POST | `/prospects/{id}/ai-summary`    | 상담 이력 AI 요약 생성   |
| POST | `/prospects/{id}/next-action`   | 다음 상담 액션 제안 생성   |

### Store

| 메서드   | 경로             | 설명       |
| ----- | -------------- | -------- |
| GET   | `/stores`      | 점포 목록 조회 |
| POST  | `/stores`      | 점포 등록    |
| GET   | `/stores/{id}` | 점포 상세 조회 |
| PATCH | `/stores/{id}` | 점포 수정    |

### Inspection

| 메서드  | 경로                                 | 설명                |
| ---- | ---------------------------------- | ----------------- |
| GET  | `/stores/{id}/inspections`         | 특정 점포 점검 목록 조회    |
| POST | `/stores/{id}/inspections`         | 점검 기록 등록          |
| GET  | `/inspections/{id}`                | 점검 상세 조회          |
| POST | `/inspections/{id}/generate-tasks` | AI 기반 개선 과제 추천 생성 |

### ImprovementTask

| 메서드   | 경로                               | 설명          |
| ----- | -------------------------------- | ----------- |
| GET   | `/improvement-tasks`             | 개선 과제 목록 조회 |
| POST  | `/improvement-tasks`             | 개선 과제 등록    |
| PATCH | `/improvement-tasks/{id}`        | 개선 과제 수정    |
| PATCH | `/improvement-tasks/{id}/status` | 상태 변경       |

### Dashboard

| 메서드 | 경로                            | 설명          |
| --- | ----------------------------- | ----------- |
| GET | `/dashboard/summary`          | 요약 지표 조회    |
| GET | `/dashboard/prospect-metrics` | 상담 관련 지표    |
| GET | `/dashboard/store-metrics`    | 점포/과제 관련 지표 |

---

## 8. 페이지 구성

### 1) 로그인 `/login`

* 이메일 입력
* 비밀번호 입력
* 로그인 버튼

### 2) 대시보드 `/dashboard`

구성:

* 총 가맹문의 수
* 상담중 문의 수
* 성약 수
* 점포 수
* 미처리 개선 과제 수
* 최근 상담 기록
* 최근 점검 기록

### 3) 가맹문의자 목록 `/prospects`

구성:

* 검색
* 상태 필터
* 담당자 필터
* 문의자 테이블
* 신규 등록 버튼

### 4) 가맹문의자 상세 `/prospects/{id}`

구성:

* 기본 정보 카드
* 상담 이력 타임라인
* 상담 추가 버튼
* AI 요약 영역
* 다음 액션 제안 영역

### 5) 상담 입력 `/prospects/{id}/consultations/new`

구성:

* 상담 차수
* 상담 일시
* 상담 내용
* 상담 결과
* 다음 액션 메모
* 저장 버튼

### 6) 점포 목록 `/stores`

구성:

* 지역 필터
* 상태 필터
* 점포 테이블
* 신규 등록 버튼

### 7) 점포 상세 `/stores/{id}`

구성:

* 점포 기본 정보
* 최근 점검 이력
* 개선 과제 목록
* 점검 추가 버튼

### 8) 점검 입력 `/stores/{id}/inspections/new`

구성:

* 품질 상태
* 품질 메모
* 위생 상태
* 위생 메모
* 매출 메모
* 점주 의견
* 저장 버튼
* AI 개선 과제 추천 버튼

### 9) 개선 과제 목록 `/improvement-tasks`

구성:

* 상태 필터
* 카테고리 필터
* 우선순위 정렬
* 과제 목록 테이블
* 상태 변경 액션

### 10) 리포트 `/reports`

구성:

* 월별 상담 건수
* 상태별 문의 분포
* 점포별 미처리 과제 수
* 카테고리별 개선 과제 분포

---

## 9. UX 원칙

프로토타입은 화려함보다 **빠른 입력과 명확한 조회**를 우선한다.

### UX 기준

* 입력은 최대한 단순한 폼으로 구성
* 목록 화면에서 검색/필터 우선 제공
* AI 결과는 카드형 요약으로 노출
* 모든 상세 화면에서 “다음 행동”이 바로 보이게 구성
* 모바일 최적화는 최소 대응만 수행

---

## 10. 레이아웃 / 메뉴

### 사이드바 메뉴

| 메뉴명    | 경로                   |
| ------ | -------------------- |
| 대시보드   | `/dashboard`         |
| 가맹문의자  | `/prospects`         |
| 점포     | `/stores`            |
| 개선 과제  | `/improvement-tasks` |
| 리포트    | `/reports`           |
| 사용자 관리 | `/admin/users`       |

---

## 11. 기술 스택

| 항목    | 값                                 |
| ----- | --------------------------------- |
| 프론트엔드 | React + TypeScript + Tailwind CSS |
| 백엔드   | FastAPI 또는 Express                |
| DB    | PostgreSQL                        |
| 인증    | JWT 기반 로그인                        |
| 배포    | Railway                           |
| AI 호출 | Claude API                        |

### 선택 원칙

* 프로토타입 속도를 위해 SSR 없이 SPA 우선
* 파일 업로드는 이번 범위에서 제외 또는 최소화
* 복잡한 메시지큐/이벤트버스는 도입하지 않음

---

## 12. 에이전트 설정

### 메인 에이전트: `ConsultationAssistant`

목적:

* 상담 이력 요약
* 다음 상담 액션 제안

시스템 프롬프트 요약:

* 프랜차이즈 상담 실무자 관점으로 응답
* 요약은 짧고 구조적으로 작성
* 실행 가능한 다음 액션 중심으로 제안
* 장황한 설명보다 실무 활용도를 우선

### 서브 에이전트: `InspectionTaskAssistant`

목적:

* 점검 결과를 바탕으로 개선 과제 도출

시스템 프롬프트 요약:

* 품질/위생/운영 기준 위반 요소를 식별
* 추상적인 문장이 아니라 실행 가능한 과제 형태로 출력
* 우선순위를 반드시 부여

---

## 13. 성공 기준 (프로토타입 완료 판단 기준)

다음 조건을 만족하면 프로토타입 완료로 본다.

1. 실무자가 가맹문의자를 등록하고 상담 이력을 3건 이상 누적 입력할 수 있다.
2. 누적 상담 기록에 대해 AI 요약과 다음 액션 제안이 정상 동작한다.
3. 점포 점검 기록을 등록하고 개선 과제를 추천받을 수 있다.
4. 개선 과제 상태를 목록에서 변경할 수 있다.
5. 대시보드에서 핵심 현황을 한눈에 볼 수 있다.
6. 데모 시나리오 기준으로 처음 보는 사용자도 10분 내 핵심 흐름을 이해할 수 있다.

---

## 14. 데모 시나리오

### 데모 1 — 상담 AI

* Prospect 생성
* 상담 2~3건 등록
* AI 요약 실행
* 다음 액션 제안 확인

### 데모 2 — 점검 AI

* Store 생성
* 점검 입력
* 개선 과제 추천 생성
* 개선 과제 상태 변경

### 데모 3 — 관리자 시야

* 대시보드에서 상담 현황 / 점포 현황 / 미처리 과제 확인

---

## 15. 개발 우선순위

### P1 (반드시 구현)

* 로그인
* Prospect CRUD
* Consultation 등록/조회
* Store CRUD
* Inspection 등록/조회
* ImprovementTask 목록/상태변경
* AI 요약/추천 2종
* 기본 대시보드

### P2 (여유 있으면 구현)

* 리포트 화면 고도화
* CSV 다운로드
* 사용자 관리 화면
* 담당자별 필터 고도화

### P3 (이번 프로토타입 제외)

* 자동 워크플로우
* 외부 알림 연동
* 예측 모델
* 이미지 분석
* 모바일 앱

---

## 16. 한줄 정의

이 프로토타입은 **이비가푸드 본사의 상담 관리와 점포 점검 업무를 AI로 보조하는 내부 운영툴 PoC**이며,
핵심은 **실무자의 입력 부담을 크게 늘리지 않으면서 상담/점검 데이터를 구조화하고, AI가 즉시 활용 가능한 요약과 후속 액션을 제안하는 것**이다.
