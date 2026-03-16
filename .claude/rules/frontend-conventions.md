---
paths:
  - "frontend/**"
---

# 프론트엔드 코드 컨벤션

## 기본
- `"use client"` — 상태, 이벤트핸들러, 브라우저 API 사용 시에만
- import 순서: react → 외부라이브러리 → @/ alias → 상대경로
- 컴포넌트: `React.forwardRef` 패턴, `displayName` 설정
- 포맷: `npx prettier --write` + `npx eslint --fix`

## 스타일
- Tailwind 유틸리티 클래스 + `cn()` (인라인 style 지양)
- Tailwind 클래스는 반드시 정적: `bg-rd-500` (O), `` bg-${color}-500 `` (X)
- 아이콘: `lucide-react`에서 import, `className="h-4 w-4"` 패턴

## 상태관리
- 서버 상태: TanStack Query v5 (`useQuery`, `useMutation`, `useQueryClient`)
- 로컬 상태: React `useState`, `useReducer`
- 쿼리 무효화: `queryClient.invalidateQueries({ queryKey: [...] })`

## API 통신
- axios 인스턴스: `lib/api.ts` (trailing slash interceptor 포함)
- 훅 파일: `hooks/use-{리소스명}.ts` 패턴
- 응답 파싱: `data.results` (목록), `data.total_cnt` (카운트)
- 로그인 후: `GET /v1/auth/me`로 별도 유저 정보 조회

## 마크다운
- `marked` 사용 (CJS 호환) — `react-markdown` 사용 금지 (ESM-only, Turbopack 비호환)
- `@tailwindcss/typography` + `prose` 클래스 필수
