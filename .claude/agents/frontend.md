---
name: frontend
description: Next.js 프론트엔드 작업 전문 에이전트. 페이지, 컴포넌트, 훅, 레이아웃 생성 및 수정.
---

# 프론트엔드 구조 (Next.js)

## 디렉토리

```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (Pretendard 폰트, Providers)
│   ├── providers.tsx           # QueryClientProvider (TanStack Query)
│   ├── page.tsx                # 홈 페이지
│   ├── error.tsx               # 에러 바운더리
│   └── components/page.tsx     # 컴포넌트 쇼케이스 (/components)
├── components/
│   ├── ui/                     # shadcn/ui 컴포넌트 (24개)
│   └── primitives.ts           # 그래디언트 타이틀 CVA
├── hooks/
│   └── use-toast.ts            # Toast 상태관리 훅
├── lib/
│   └── utils.ts                # cn() 헬퍼 (clsx + tailwind-merge)
├── styles/
│   └── globals.css             # CSS 변수 (light/dark 모드)
├── public/font/                # Pretendard 폰트 파일
├── tailwind.config.js          # 디자인 토큰 (색상, 타이포그래피)
├── components.json             # shadcn/ui 설정
└── package.json
```

## shadcn/ui 설정 (components.json)

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.js", "css": "styles/globals.css", "baseColor": "neutral", "cssVariables": true },
  "aliases": { "components": "@/components", "ui": "@/components/ui", "utils": "@/lib/utils", "lib": "@/lib", "hooks": "@/hooks" },
  "iconLibrary": "lucide"
}
```

## UI 컴포넌트 목록 (components/ui/)

| 카테고리 | 컴포넌트 | 파일 | 주요 variant/props |
|---------|---------|------|-------------------|
| **버튼** | Button | button.tsx | variant: `default` `destructive` `outline` `secondary` `ghost` `link` + 컬러(rd/blue/green/yellow/purple/pink/teal/indigo) × (solid/outline/ghost), size: `default` `sm` `lg` `icon` |
| **폼** | Input | input.tsx | HTML input 확장, 커스텀 스타일 |
| | Textarea | textarea.tsx | HTML textarea 확장 |
| | Label | label.tsx | Radix Label 래퍼 |
| | Select | select.tsx | Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup |
| | Checkbox | checkbox.tsx | Radix Checkbox (체크 아이콘 포함) |
| | Switch | switch.tsx | Radix Switch (토글) |
| **데이터** | Badge | badge.tsx | variant: `default` `secondary` `destructive` `outline` + 컬러(9색) + solid(8색) + role(owner/developer/viewer/admin) + status(active/pending/expired/rejected/inactive/warning/info/success/error) |
| | Avatar | avatar.tsx | AvatarImage, AvatarFallback |
| | Table | table.tsx | Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter |
| | Tabs | tabs.tsx | Tabs, TabsList, TabsTrigger, TabsContent |
| **레이아웃** | Card | card.tsx | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| | Separator | separator.tsx | orientation: horizontal/vertical |
| | ScrollArea | scroll-area.tsx | ScrollArea, ScrollBar |
| | Skeleton | skeleton.tsx | 펄스 애니메이션 로딩 |
| | Sheet | sheet.tsx | side: top/bottom/left/right |
| **오버레이** | Dialog | dialog.tsx | Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription |
| | AlertDialog | alert-dialog.tsx | AlertDialogAction, AlertDialogCancel 포함 |
| | DropdownMenu | dropdown-menu.tsx | MenuItem, CheckboxItem, RadioItem, Sub 등 |
| | Tooltip | tooltip.tsx | TooltipProvider 필요 |
| | Popover | popover.tsx | Popover, PopoverTrigger, PopoverContent |
| **피드백** | Alert | alert.tsx | variant: `default` `destructive` `success` `warning` `info` + 컬러(rd/purple/pink/teal/indigo) |
| | Toast | toast.tsx | variant: `default` `destructive` `success` `warning` `info` |
| | Toaster | toaster.tsx | Toast 렌더링 프로바이더 |

## 컴포넌트 사용 패턴

```tsx
// 기본 import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 버튼
<Button variant="default">기본</Button>
<Button variant="rd">빨강</Button>
<Button variant="blue-outline">파랑 아웃라인</Button>
<Button variant="green-ghost">초록 고스트</Button>
<Button variant="destructive" size="sm">삭제</Button>
<Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>

// 배지
<Badge variant="active">활성</Badge>
<Badge variant="owner">Owner</Badge>
<Badge variant="blue-solid">Blue</Badge>

// 카드
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>

// 다이얼로그
<Dialog>
  <DialogTrigger asChild><Button>열기</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명</DialogDescription>
    </DialogHeader>
    {/* 내용 */}
    <DialogFooter>
      <Button>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// 셀렉트
<Select>
  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">항목 A</SelectItem>
    <SelectItem value="b">항목 B</SelectItem>
  </SelectContent>
</Select>

// 알림
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>성공</AlertTitle>
  <AlertDescription>저장되었습니다.</AlertDescription>
</Alert>

// 테이블
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>역할</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>홍길동</TableCell>
      <TableCell><Badge variant="owner">Owner</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 새 페이지 추가 가이드

### 프론트엔드 페이지 생성

```
app/
├── dashboard/
│   ├── page.tsx              # /dashboard
│   └── layout.tsx            # 대시보드 레이아웃 (사이드바 등)
├── organizations/
│   ├── page.tsx              # /organizations (목록)
│   └── [id]/
│       ├── page.tsx          # /organizations/:id (상세)
│       └── settings/
│           └── page.tsx      # /organizations/:id/settings
└── projects/
    ├── page.tsx              # /projects
    └── [id]/
        └── page.tsx          # /projects/:id
```

### API 통신 패턴 (권장)

**필수 규약:**
- **PaginatedResponse**: `data.results` (NOT `data.items`), `data.total_cnt`, `data.cur_page`
- **LoginResponse**: `{status, access_token, refresh_token}` — user 객체 없음. `GET /v1/auth/me` 별도 호출
- **Trailing slash**: axios interceptor에서 자동 `/` 추가 (FastAPI 307 리다이렉트 방지)

```tsx
// lib/api.ts — axios 인스턴스 (trailing slash interceptor 포함)
import axios from "axios";
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
});

// hooks/use-organizations.ts — TanStack Query 훅
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/v1/organizations").then(res => res.data),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post("/v1/organizations", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });
}
```

### 페이지 구성 예시

```tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function OrganizationsPage() {
  // const { data, isLoading } = useOrganizations();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1">조직 관리</h1>
        <Button variant="rd">
          <Plus className="h-4 w-4" />
          새 조직
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* isLoading ? Skeleton : data.map(...) */}
        <Card>
          <CardHeader>
            <CardTitle>컨시언스파트너스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="owner">Owner</Badge>
              <span className="text-caption text-sv">멤버 5명</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```
