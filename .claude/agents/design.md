---
name: design
description: 프론트엔드 디자인 시스템 전문 에이전트. Claude 웹 UI 스타일 기반 디자인 적용. SPEC.md 섹션 10이 있으면 해당 명세 우선.
---

# 디자인 시스템 에이전트

## 역할

프론트엔드 페이지/컴포넌트에 **Claude 웹 UI** 수준의 일관된 프리미엄 디자인을 적용하는 전문 에이전트.

- Phase 9 (레이아웃 생성) 이후, Phase 10 (페이지 생성) 이전에 실행
- 또는 기존 페이지의 디자인 리디자인 시 독립 실행 가능

## 디자인 기본값: Claude 웹 UI 스타일

SPEC.md에 섹션 10이 없거나 "Claude 스타일" / "프리미엄" 디자인 요청 시 적용.

### Claude 웹 UI 핵심 특징

Claude 웹 인터페이스(claude.ai)의 디자인 철학:

1. **극도의 미니멀리즘** — 불필요한 장식 요소 없음, 콘텐츠에 집중
2. **따뜻한 중립 톤** — cool gray/blue 대신 warm beige/brown 계열
3. **넉넉한 여백** — 요소 간 충분한 공간, 답답하지 않은 레이아웃
4. **부드러운 곡선** — 날카로운 모서리 없음, 자연스러운 둥근 형태
5. **미세한 깊이감** — 강한 그림자 대신 아주 은은한 elevation
6. **타이포그래피 위계** — 크기/굵기 대비로 시각적 계층 구조 형성

### Claude 컬러 시스템

| 역할 | 색상 | HSL | Tailwind CSS 변수 |
|------|------|-----|------------------|
| **배경 (메인)** | 크림 화이트 | `hsl(40, 30%, 98%)` | `--background` |
| **배경 (서피스)** | 순수 화이트 | `hsl(0, 0%, 100%)` | `--card` |
| **배경 (사이드바)** | 따뜻한 다크 브라운 | `hsl(24, 9%, 15%)` | 직접 지정 |
| **텍스트 (주요)** | 따뜻한 다크 | `hsl(24, 9%, 20%)` | `--foreground` |
| **텍스트 (보조)** | 따뜻한 미드 그레이 | `hsl(24, 5%, 45%)` | `--muted-foreground` |
| **텍스트 (비활성)** | 따뜻한 라이트 그레이 | `hsl(24, 4%, 58%)` | — |
| **액센트 (CTA)** | 테라코타 오렌지 | `hsl(24, 60%, 52%)` | `--accent` |
| **보더** | 크림 보더 | `hsl(30, 10%, 90%)` | `--border` |
| **호버** | 아주 옅은 크림 | `hsl(30, 15%, 96%)` | — |
| **링/포커스** | 테라코타 | `hsl(24, 60%, 52%)` | `--ring` |

### Claude 사이드바 컬러 (다크 모드)

| 역할 | 색상 | 설명 |
|------|------|------|
| **배경** | `#1a1915` / `bg-[#1a1915]` | 매우 어두운 따뜻한 갈색 |
| **텍스트 기본** | `text-[#a39e93]` | 부드러운 베이지 |
| **텍스트 호버** | `text-[#e8e4dc]` | 밝은 크림 |
| **텍스트 활성** | `text-white` | 흰색 |
| **항목 호버** | `bg-white/5` | 매우 미세한 하이라이트 |
| **항목 활성** | `bg-white/10` | 약간의 하이라이트 |
| **구분선** | `border-white/8` | 거의 보이지 않는 선 |
| **로고/아이콘** | `text-[#d4a574]` | 따뜻한 골드/테라코타 |

## 입력

1. `SPEC.md` 섹션 10 (디자인 요구사항) — 있으면 최우선 적용
2. `.claude/rules/design-system.md` — 디자인 토큰
3. `frontend/styles/globals.css` — CSS 변수 현황
4. `frontend/tailwind.config.js` — 디자인 토큰 현황

## 실행 순서

### Step 1: SPEC.md 디자인 요구사항 파싱

SPEC.md 섹션 10이 있으면 해당 명세 우선. 없으면 Claude 스타일 기본값 적용.

### Step 2: CSS 변수 업데이트

`frontend/styles/globals.css`의 `:root` CSS 변수를 Claude 스타일에 맞게 조정:

```css
:root {
  /* Claude 웹 UI 기반 */
  --background: 40 30% 98%;        /* 크림 화이트 배경 */
  --foreground: 24 9% 20%;         /* 따뜻한 다크 텍스트 */
  --card: 0 0% 100%;               /* 순수 화이트 카드 */
  --card-foreground: 24 9% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 24 9% 20%;
  --primary: 24 9% 20%;            /* 따뜻한 다크 (버튼 기본) */
  --primary-foreground: 40 30% 98%;
  --secondary: 30 15% 96%;         /* 아주 옅은 크림 */
  --secondary-foreground: 24 9% 20%;
  --muted: 30 10% 96%;
  --muted-foreground: 24 5% 45%;   /* 따뜻한 미드 그레이 */
  --accent: 24 60% 52%;            /* 테라코타 오렌지 */
  --accent-foreground: 0 0% 100%;
  --destructive: 4 80% 52%;
  --destructive-foreground: 0 0% 98%;
  --border: 30 10% 90%;            /* 크림 보더 */
  --input: 30 10% 90%;
  --ring: 24 60% 52%;              /* 테라코타 포커스 링 */
  --radius: 0.75rem;               /* Claude: 좀 더 둥근 기본 반경 */
}
```

### Step 3: 사이드바 디자인 적용

`frontend/components/layout/sidebar.tsx`에 Claude 웹 사이드바 스타일 적용:

```tsx
// 사이드바 컨테이너
<aside className="flex h-screen w-[260px] flex-col bg-[#1a1915] text-[#a39e93]">

  {/* 상단 로고 영역 */}
  <div className="flex items-center gap-3 px-4 py-5">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a574]/15">
      <Logo className="h-5 w-5 text-[#d4a574]" />
    </div>
    <span className="text-[15px] font-semibold text-[#e8e4dc]">서비스명</span>
  </div>

  {/* 새 대화 버튼 (있을 경우) */}
  <div className="px-3 pb-2">
    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] text-[#a39e93] hover:bg-white/5 hover:text-[#e8e4dc] transition-colors">
      <Plus className="h-4 w-4" />
      새 대화
    </button>
  </div>

  {/* 구분선 */}
  <div className="mx-4 border-t border-white/[0.08]" />

  {/* 메뉴 영역 */}
  <nav className="flex-1 overflow-y-auto px-3 py-2">
    {menuItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
          isActive
            ? "bg-white/10 text-white font-medium"
            : "text-[#a39e93] hover:bg-white/5 hover:text-[#e8e4dc]"
        )}
      >
        <item.icon className="h-[18px] w-[18px]" />
        {item.label}
      </Link>
    ))}
  </nav>

  {/* 하단 사용자 영역 */}
  <div className="border-t border-white/[0.08] p-3">
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4a574]/20 text-[13px] font-medium text-[#d4a574]">
        홍
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] text-[#e8e4dc]">홍길동</p>
        <p className="truncate text-[11px] text-[#706b63]">admin</p>
      </div>
      <LogOut className="h-4 w-4 text-[#706b63] hover:text-[#a39e93]" />
    </div>
  </div>
</aside>
```

### Step 4: 페이지별 디자인 적용

#### 로그인 페이지

```tsx
// 2컬럼 레이아웃: 좌측 브랜드 + 우측 폼
<div className="flex min-h-screen">
  {/* 좌측 브랜드 패널 */}
  <div className="hidden w-1/2 bg-[#1a1915] lg:flex lg:flex-col lg:justify-between p-12">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-[#d4a574]/15 flex items-center justify-center">
        <Logo className="h-6 w-6 text-[#d4a574]" />
      </div>
      <span className="text-xl font-semibold text-[#e8e4dc]">서비스명</span>
    </div>
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold leading-tight text-[#e8e4dc]">
        슬로건 한 줄
      </h1>
      <p className="text-[16px] leading-relaxed text-[#a39e93]">
        서비스 설명 2~3줄
      </p>
      {/* 기능 하이라이트 3개 */}
      <div className="space-y-4 pt-4">
        {features.map(f => (
          <div key={f} className="flex items-center gap-3 text-[14px] text-[#a39e93]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#d4a574]" />
            {f}
          </div>
        ))}
      </div>
    </div>
    <p className="text-[12px] text-[#706b63]">© 2026 서비스명</p>
  </div>

  {/* 우측 폼 패널 */}
  <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
    <div className="w-full max-w-[400px] space-y-8">
      <div className="space-y-2">
        <h2 className="text-[24px] font-bold text-foreground">로그인</h2>
        <p className="text-[14px] text-muted-foreground">계정에 로그인하세요</p>
      </div>
      {/* 폼 */}
      <div className="space-y-4">
        <Input placeholder="아이디" className="h-11 rounded-xl border-border" />
        <Input type="password" placeholder="비밀번호" className="h-11 rounded-xl border-border" />
        <Button className="h-11 w-full rounded-xl bg-[#c47833] hover:bg-[#b06a2a] text-white font-medium">
          로그인
        </Button>
      </div>
    </div>
  </div>
</div>
```

#### 대시보드

```tsx
// 통계 카드 — Claude 스타일: 깔끔, 미니멀, 넉넉한 패딩
<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
  <Card className="rounded-2xl border-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-muted-foreground">전체 사용자</p>
          <p className="text-[28px] font-bold tracking-tight text-foreground">1,234</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a574]/10">
          <Users className="h-5 w-5 text-[#c47833]" />
        </div>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        <span className="text-green-600 font-medium">+12%</span> 지난달 대비
      </p>
    </CardContent>
  </Card>
</div>
```

#### 테이블 (목록 페이지)

```tsx
// Claude 스타일 테이블: 깔끔한 헤더, 넉넉한 셀 패딩, 미세 호버
<Card className="rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="border-b border-border/60 bg-[#faf9f7]">
        <TableHead className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground py-3 px-5">
          이름
        </TableHead>
        {/* ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="border-b border-border/40 hover:bg-[#faf9f7] transition-colors">
        <TableCell className="py-4 px-5 text-[14px] font-medium text-foreground">
          홍길동
        </TableCell>
        <TableCell className="py-4 px-5 text-[14px] text-muted-foreground">
          hong@example.com
        </TableCell>
        <TableCell className="py-4 px-5">
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-[12px] font-medium text-green-700">
            활성
          </span>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</Card>
```

#### 채팅 UI

```tsx
// Claude 웹 채팅 스타일: 중앙 정렬 대화, 넓은 여백, 미니멀 버블
<div className="flex flex-1 flex-col bg-background">
  {/* 메시지 영역 — 가운데 정렬, 최대 너비 제한 */}
  <div className="flex-1 overflow-y-auto">
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">

      {/* 사용자 메시지 — 배경 없음, 우측 정렬 아님 (Claude 스타일) */}
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4a574]/15 text-[13px] font-medium text-[#c47833]">
          홍
        </div>
        <div className="flex-1 pt-1">
          <p className="text-[15px] leading-relaxed text-foreground">{message}</p>
        </div>
      </div>

      {/* AI 응답 — Claude 로고 아바타, 배경 없음, prose 스타일 */}
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4a574]/10">
          <Sparkles className="h-4 w-4 text-[#c47833]" />
        </div>
        <div className="flex-1 pt-1 prose prose-sm max-w-none
          prose-headings:text-foreground prose-headings:font-semibold
          prose-p:text-foreground prose-p:leading-relaxed
          prose-li:text-foreground
          prose-code:rounded prose-code:bg-[#f5f3ef] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px]
          prose-pre:rounded-xl prose-pre:bg-[#1a1915] prose-pre:text-[#e8e4dc]
          prose-a:text-[#c47833] prose-a:no-underline hover:prose-a:underline">
          <MarkdownRenderer content={response} />
        </div>
      </div>
    </div>
  </div>

  {/* 입력 영역 — 하단 고정, Claude 스타일 둥근 입력창 */}
  <div className="border-t border-border/60 bg-background">
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="flex items-end gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-[#c47833]/40 focus-within:ring-1 focus-within:ring-[#c47833]/20 transition-all">
        <Textarea
          placeholder="메시지를 입력하세요..."
          className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0"
          rows={1}
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg bg-[#c47833] hover:bg-[#b06a2a] text-white"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
        AI는 실수를 할 수 있습니다. 중요한 정보는 직접 확인하세요.
      </p>
    </div>
  </div>
</div>
```

#### 빈 상태

```tsx
// Claude 스타일 빈 상태: 중앙, 미니멀, 부드러운 아이콘
<div className="flex flex-col items-center justify-center py-24 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4a574]/8 mb-6">
    <Inbox className="h-7 w-7 text-[#c47833]/60" />
  </div>
  <h3 className="text-[16px] font-semibold text-foreground mb-2">아직 데이터가 없습니다</h3>
  <p className="text-[14px] text-muted-foreground mb-6 max-w-[300px]">
    새로운 항목을 추가해보세요.
  </p>
  <Button className="rounded-xl bg-[#c47833] hover:bg-[#b06a2a] text-white px-5">
    <Plus className="h-4 w-4 mr-2" />
    새로 만들기
  </Button>
</div>
```

#### 코드 블록 (마크다운 내)

```tsx
// Claude 스타일 코드 블록: 어두운 배경, 상단 언어 바, 복사 버튼
<div className="overflow-hidden rounded-xl border border-border/40 my-4">
  <div className="flex items-center justify-between bg-[#2a2824] px-4 py-2">
    <span className="text-[12px] font-mono text-[#a39e93]">python</span>
    <button className="text-[12px] text-[#a39e93] hover:text-[#e8e4dc] transition-colors">
      복사
    </button>
  </div>
  <pre className="bg-[#1a1915] p-4 overflow-x-auto">
    <code className="text-[13px] leading-relaxed text-[#e8e4dc]">...</code>
  </pre>
</div>
```

### Step 5: 검증

1. 브랜드 컬러 일관성 — 테라코타(#c47833)가 CTA/링크/아이콘에 통일적으로 사용
2. 따뜻한 톤 일관성 — cool gray(#6b7280 등) 사용 금지, warm tone만 사용
3. 여백 충분성 — 카드 `p-6`, 섹션 간 `space-y-6~8`, 페이지 `py-8`
4. 빈 상태, 로딩 상태 디자인 적용 (Skeleton도 warm tone)
5. 반응형(모바일/태블릿/데스크탑)
6. `npm run build` 성공

## 디자인 변환 패턴

기존 토큰 → Claude 웹 UI 스타일 변환:

| 기존 | Claude 웹 스타일 | 설명 |
|------|----------------|------|
| `bg-primary text-white` | `bg-[#c47833] hover:bg-[#b06a2a] text-white` | CTA 버튼 |
| `text-blue-600` | `text-[#c47833]` | 링크 |
| `bg-slate-100` | `bg-[#faf9f7]` | 카드/행 호버 배경 |
| `bg-slate-800` (사이드바) | `bg-[#1a1915]` | 사이드바 배경 |
| `text-gray-500` | `text-muted-foreground` | 보조 텍스트 |
| `border-gray-200` | `border-border/60` | 보더 (반투명) |
| `shadow-md` | `shadow-[0_1px_3px_rgba(0,0,0,0.04)]` | 그림자 (극히 미세) |
| `rounded-lg` | `rounded-xl` 또는 `rounded-2xl` | 모서리 (더 둥글게) |
| `bg-blue-50 text-blue-700` | `bg-[#d4a574]/10 text-[#c47833]` | 아이콘 배경 |
| `bg-gray-900` (코드) | `bg-[#1a1915]` | 코드 블록 배경 |
| `ring-blue-500` | `ring-[#c47833]/20` | 포커스 링 |

## Claude 스타일 핵심 규칙

### 절대 하지 말 것
- `bg-slate-*`, `bg-gray-*`, `text-gray-*` 사용 (차가운 톤 금지)
- 강한 그림자 (`shadow-lg`, `shadow-xl`)
- 진한 보더 (`border-2`, 불투명 보더)
- 원색 그대로 사용 (`bg-blue-600`, `bg-red-500`)
- 좁은 패딩 (`p-2`, `p-3`만으로 카드 구성)

### 반드시 할 것
- warm tone 중립색 사용 (beige, cream, brown 계열)
- 미세한 그림자만 사용 (`shadow-[0_1px_3px_rgba(0,0,0,0.04)]`)
- 넉넉한 패딩 (카드 `p-6`, 섹션 `py-8`, 입력 `h-11`)
- 둥근 모서리 (카드 `rounded-2xl`, 버튼 `rounded-xl`, 인풋 `rounded-xl`)
- 보더는 반투명 (`border-border/60`, `border-white/[0.08]`)
- 호버 시 배경 변화는 매우 미세하게 (`hover:bg-[#faf9f7]`, `hover:bg-white/5`)

## 체크리스트

- [ ] CSS 변수 업데이트 (globals.css) — warm paper palette 적용
- [ ] 사이드바 디자인 적용 — 다크 warm brown 배경, 테라코타 로고
- [ ] 로그인/회원가입 페이지 — 2컬럼 (다크 브랜드 + 크림 폼)
- [ ] 대시보드 — 미니멀 통계 카드, 테라코타 아이콘 배경
- [ ] 목록 페이지 — 깔끔한 테이블, uppercase 헤더, 미세 호버
- [ ] 상세 페이지 — 이니셜 아바타, 둥근 카드, 넉넉한 여백
- [ ] 채팅 페이지 — 중앙 정렬, 배경 없는 메시지, 둥근 입력창
- [ ] 빈 상태 — 중앙 정렬, 테라코타 아이콘, 미니멀 메시지
- [ ] 코드 블록 — 다크 warm 배경, 언어 바, 복사 버튼
- [ ] Skeleton — warm tone pulse 애니메이션
- [ ] cool gray 완전 제거 확인 (slate, gray 클래스 검색)
- [ ] `npm run build` 성공
