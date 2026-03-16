---
paths:
  - "frontend/**"
---

# 디자인 시스템

## 기본 디자인 철학: Claude 웹 UI 스타일

claude.ai의 디자인 언어를 따르는 warm paper palette 기반 프리미엄 미니멀리즘.
차가운 gray/slate 대신 따뜻한 beige/brown 톤 사용.

## 핵심 디자인 원칙

1. **미니멀** — 불필요한 장식 없음, 콘텐츠에 집중
2. **따뜻함** — cool gray 금지, warm neutral만 사용
3. **여백** — 넉넉한 패딩과 간격으로 숨 쉬는 레이아웃
4. **부드러움** — 둥근 모서리(rounded-xl~2xl), 미세한 그림자
5. **계층** — 타이포그래피 크기/굵기로 시각적 위계 형성

> SPEC.md에 **섹션 10 (디자인 요구사항)**이 있으면 아래 기본값 대신 SPEC 명세를 우선 적용.

## 색상 체계

### 핵심 컬러

| 이름 | 값 | 용도 | 사용법 |
|------|---|------|--------|
| **배경** | `hsl(40, 30%, 98%)` | 페이지 배경 | `bg-background` |
| **서피스** | `#ffffff` | 카드, 모달 | `bg-white` 또는 `bg-card` |
| **사이드바** | `#1a1915` | 사이드바 배경 | `bg-[#1a1915]` |
| **텍스트 주요** | `hsl(24, 9%, 20%)` | 본문, 제목 | `text-foreground` |
| **텍스트 보조** | `hsl(24, 5%, 45%)` | 설명, 날짜 | `text-muted-foreground` |
| **테라코타** | `#c47833` | CTA, 링크, 아이콘 | `bg-[#c47833]`, `text-[#c47833]` |
| **테라코타 호버** | `#b06a2a` | 버튼 호버 | `hover:bg-[#b06a2a]` |
| **보더** | `hsl(30, 10%, 90%)` | 구분선 | `border-border` 또는 `border-border/60` |
| **호버 배경** | `#faf9f7` | 행/항목 호버 | `hover:bg-[#faf9f7]` |

### 사이드바 전용 컬러

| 역할 | 값 | 사용법 |
|------|---|--------|
| 배경 | `#1a1915` | `bg-[#1a1915]` |
| 텍스트 기본 | `#a39e93` | `text-[#a39e93]` |
| 텍스트 밝은 | `#e8e4dc` | `text-[#e8e4dc]` |
| 로고/아이콘 | `#d4a574` | `text-[#d4a574]` |
| 항목 호버 | `white/5%` | `hover:bg-white/5` |
| 항목 활성 | `white/10%` | `bg-white/10` |
| 구분선 | `white/8%` | `border-white/[0.08]` |

### 아이콘 배경 컬러

테라코타 기반 아이콘 배경 (대시보드 통계 카드, 빈 상태 등):
- 기본: `bg-[#d4a574]/10` + `text-[#c47833]`
- 강조: `bg-[#d4a574]/15` + `text-[#c47833]`

### 상태 배지 컬러

| 상태 | 배경 | 텍스트 | 사용법 |
|------|------|--------|--------|
| 활성/성공 | `bg-green-50` | `text-green-700` | `<Badge>활성</Badge>` |
| 대기/경고 | `bg-amber-50` | `text-amber-700` | `<Badge>대기</Badge>` |
| 에러/삭제 | `bg-red-50` | `text-red-700` | `<Badge>오류</Badge>` |
| 정보 | `bg-blue-50` | `text-blue-700` | `<Badge>정보</Badge>` |
| 비활성 | `bg-[#f5f3ef]` | `text-muted-foreground` | `<Badge>비활성</Badge>` |

### Paper 팔레트 (기존 호환)

따뜻한 cream → dark brown 스케일.

| 토큰 | 약어 | 값 | 용도 |
|------|------|---|------|
| Paper-900 | `DG` | #3D3D3D | 본문 진한 텍스트 |
| Paper-600 | `MG` | #6B6B6B | 보조 텍스트 |
| Paper-400 | `sv` | #949494 | 비활성 텍스트, 플레이스홀더 |
| Paper-200 | `bordercolor` | #E4E4E4 | 보더 |
| Paper-100 | `LG` | #EDEDED | 밝은 배경, 구분선 |
| Paper-50 | `BG` | #FAFAFA | 페이지 배경 |

### 시맨틱 컬러 (shadcn 컴포넌트용)

| 이름 | DEFAULT | 용도 |
|------|---------|------|
| **rd** | #F0635C | 경고, 삭제 |
| **blue** | #5B8DEF | 정보, 링크 대안 |
| **green** | #009E03 | 성공, 활성 |
| **yellow** | #F57F17 | 경고, 대기 |
| **purple** | #7C3AED | 관리자, 프리미엄 |

## 타이포그래피

| 클래스 | 크기 | 굵기 | 용도 |
|--------|------|------|------|
| `text-display` | 28px | 800 | 히어로, 대형 타이틀 |
| `text-heading1` | 22px | 700 | 페이지 제목 |
| `text-heading2` | 21px | 600 | 섹션 제목 |
| `text-heading3` | 18px | 600 | 카드 제목 |
| `text-heading4` | 16px | 600 | 소제목 |
| `text-bodymedium` | 15px | 400 | 일반 본문 |
| `text-caption` | 13px | 400 | 작은 보조 텍스트 |
| `text-tiny` | 11px | 400 | 라벨, 각주 |

## 스타일 규칙

### 모서리 (border-radius)
- 카드, 모달: `rounded-2xl`
- 버튼, 인풋, 배지: `rounded-xl`
- 코드 블록: `rounded-xl`
- 아바타: `rounded-full`
- 작은 요소: `rounded-lg`

### 그림자
- 카드 기본: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- 입력 포커스: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]` + `ring-1 ring-[#c47833]/20`
- 강한 그림자 사용 금지 (`shadow-lg`, `shadow-xl`, `shadow-2xl`)

### 패딩
- 카드 내부: `p-6`
- 섹션 간격: `space-y-6` ~ `space-y-8`
- 페이지 패딩: `px-4 py-8` (모바일), `px-8 py-8` (데스크탑)
- 인풋 높이: `h-11`
- 버튼 기본: `px-5 py-2.5`

### 보더
- 기본: `border-border/60` (반투명으로 부드럽게)
- 구분선: `border-border/40`
- 사이드바: `border-white/[0.08]`
- 두꺼운 보더 금지 (`border-2` 이상)

### 금지 사항
- `bg-slate-*`, `bg-gray-*`, `text-gray-*` 사용 금지 (차가운 톤)
- `shadow-lg` 이상의 강한 그림자 금지
- `border-2` 이상의 두꺼운 보더 금지
- 원색 버튼 (`bg-blue-600`, `bg-red-600`) 금지 — 테라코타 또는 시맨틱 컬러 사용

### 필수 패턴
- Tailwind 클래스는 반드시 정적: `bg-[#c47833]` (O), `` bg-${color} `` (X)
- cn() 활용: `cn("기본클래스", condition && "조건부클래스", className)`
- 호버 전환: `transition-colors` 필수 추가
