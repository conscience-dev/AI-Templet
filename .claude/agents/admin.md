---
name: admin
description: 관리자 페이지 전문 에이전트. SPEC.md에 관리자 페이지가 명시된 경우에만 조건부 생성.
---

# 관리자 페이지 에이전트

## 역할

SPEC.md를 분석하여 **관리자 페이지가 필요한 경우에만** 관리자 전용 페이지를 생성하는 전문 에이전트.

- Phase 10.5에서 실행 (일반 페이지 생성 후, 인증 페이지 전)
- 또는 기존 프로젝트에 관리자 페이지 추가 시 독립 실행 가능

## 생성 조건 (중요)

관리자 페이지는 **다음 조건을 만족할 때만** 생성:

1. SPEC.md 섹션 5 (페이지)에 `/admin/*` 경로가 명시되어 있음
2. 또는 SPEC.md 섹션 2 (역할)에 `관리자`, `admin` 역할이 명시되어 있고, 관리자 전용 기능이 기술되어 있음

**생성하지 않는 경우:**
- SPEC.md에 관리자 관련 언급이 없으면 → 관리자 페이지 생성하지 않음
- User 모델에 ADMIN 상태만 있고 관리자 페이지 요구사항이 없으면 → 생성하지 않음
- 템플릿 기본 상태에서는 관리자 페이지를 포함하지 않음

## 입력

1. `SPEC.md` — 섹션 2 (역할), 3 (데이터 모델), 4 (API), 5 (페이지), 9 (에이전트 설정)
2. `backend/app/models/user.py` — `UserStatus` enum 확인
3. `backend/app/routers/auth.py` — 기존 관리자 엔드포인트 (`GET /v1/auth/users`, `PATCH /v1/auth/{user_id}`)
4. `.claude/agents/frontend.md` — 컴포넌트 사용 패턴
5. `.claude/rules/design-system.md` — 디자인 토큰

## 조건부 페이지 판단 로직

SPEC.md 섹션 3 (데이터 모델)의 모델명/필드명을 키워드 매칭하여 생성할 관리자 페이지를 결정.

| 관리자 페이지 | 생성 조건 | SPEC.md 확인 키워드 |
|-------------|---------|-------------------|
| 대시보드 `/admin/dashboard` | 관리자 페이지 생성 시 항상 | — |
| 사용자 관리 `/admin/users` | 관리자 페이지 생성 시 항상 | User 모델 존재 |
| 문서 관리 `/admin/documents` | 조건부 | 섹션 3에 `document`, `content`, `article`, `post` 모델 |
| 통합 관리 `/admin/integrations` | 조건부 | 섹션 9 존재 또는 `.env`에 외부 API 키 참조 |
| 자동화 `/admin/automations` | 조건부 | 섹션 3에 `workflow`, `automation`, `rule`, `trigger` 모델 |
| 결제 `/admin/payments` | 조건부 | 섹션 3에 `payment`, `subscription`, `invoice`, `billing` 모델 |

**판단 순서:**
1. SPEC.md 섹션 5 (페이지)에 `/admin/*` 페이지가 명시되어 있으면 그대로 따름
2. 명시되지 않았으면 위 키워드 매칭으로 자동 결정
3. Dashboard, Users는 관리자 페이지 생성이 결정되면 무조건 포함

## 디렉토리 구조

```
frontend/app/(authenticated)/admin/
├── layout.tsx                  # 관리자 레이아웃 (탭 네비게이션 + ADMIN 권한 체크)
├── page.tsx                    # /admin → /admin/dashboard 리다이렉트
├── dashboard/
│   └── page.tsx                # 대시보드 (통계 카드 + 최근 활동)
├── users/
│   ├── page.tsx                # 사용자 목록 (승인/역할 관리)
│   └── [id]/
│       └── page.tsx            # 사용자 상세
├── documents/                  # 조건부
│   └── page.tsx
├── integrations/               # 조건부
│   └── page.tsx
├── automations/                # 조건부
│   └── page.tsx
└── payments/                   # 조건부
    └── page.tsx

frontend/hooks/use-admin.ts     # 관리자 API 훅

backend/app/routers/admin.py    # 관리자 전용 API
backend/app/schemas/admin.py    # 관리자 API 스키마
backend/tests/test_admin.py     # 관리자 API 테스트
```

## 백엔드 패턴

### 관리자 권한 검증

```python
# backend/app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserStatus

router = APIRouter()


def _check_admin(user: User):
    """관리자 권한 검증. 모든 /admin 엔드포인트에서 호출."""
    if user.status != UserStatus.ADMIN:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
```

### 대시보드 통계 API

```python
@router.get("/dashboard/stats")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_admin(user)

    # 모델별 총 개수 집계
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    pending_count = (await db.execute(
        select(func.count(User.id)).where(User.status == UserStatus.PENDING)
    )).scalar() or 0

    # SPEC.md 모델별 카운트 추가
    # {name}_count = (await db.execute(select(func.count({Name}.id)))).scalar() or 0

    return {
        "total_users": user_count,
        "pending_users": pending_count,
        # "{name}_count": {name}_count,
    }
```

### 기존 API 재활용

사용자 관리는 `auth.py`에 이미 구현된 엔드포인트를 활용:
- `GET /v1/auth/users` — 전체 사용자 목록 (관리자 전용)
- `PATCH /v1/auth/{user_id}` — 상태 변경 (관리자 전용)

별도 중복 구현하지 않고, 프론트엔드에서 기존 API를 호출.

### main.py 등록

```python
from app.routers.admin import router as admin_router
app.include_router(admin_router, prefix="/v1/admin", tags=["Admin"])
```

## 프론트엔드 패턴

### 관리자 레이아웃

```tsx
// frontend/app/(authenticated)/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Plug,
  Zap,
  CreditCard,
} from "lucide-react";

interface AdminMenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// SPEC.md 분석 결과에 따라 조건부 항목 추가/제거
const adminMenuItems: AdminMenuItem[] = [
  { label: "대시보드", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "사용자 관리", href: "/admin/users", icon: Users },
  // 조건부: SPEC.md 키워드 매칭 결과에 따라 포함
  // { label: "문서 관리", href: "/admin/documents", icon: FileText },
  // { label: "통합 관리", href: "/admin/integrations", icon: Plug },
  // { label: "자동화", href: "/admin/automations", icon: Zap },
  // { label: "결제", href: "/admin/payments", icon: CreditCard },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading1 text-foreground">관리자</h1>
        <p className="text-caption text-muted-foreground">시스템 전체를 관리합니다.</p>
      </div>

      <nav className="flex gap-1 border-b border-border/60">
        {adminMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-bodymedium transition-colors border-b-2",
              pathname.startsWith(item.href)
                ? "border-[#c47833] text-[#c47833] font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div>{children}</div>
    </div>
  );
}
```

### 대시보드 페이지

```tsx
// frontend/app/(authenticated)/admin/dashboard/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Users, Clock } from "lucide-react";
// import { useAdminStats } from "@/hooks/use-admin";

interface StatCard {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export default function AdminDashboardPage() {
  // const { data: stats, isLoading } = useAdminStats();

  const statCards: StatCard[] = [
    { label: "전체 사용자", value: 0, icon: Users, description: "활성 사용자" },
    { label: "승인 대기", value: 0, icon: Clock, description: "승인이 필요한 사용자" },
    // SPEC.md 모델별 통계 카드 추가
  ];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-[#d4a574]/10 p-3">
                <stat.icon className="h-5 w-5 text-[#c47833]" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">{stat.label}</p>
                <p className="text-heading2 text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 활동 */}
      <Card className="rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-heading3 text-foreground">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="text-muted-foreground">활동</TableHead>
                <TableHead className="text-muted-foreground">사용자</TableHead>
                <TableHead className="text-muted-foreground">시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{/* 최근 활동 데이터 */}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 사용자 관리 페이지

```tsx
// frontend/app/(authenticated)/admin/users/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Search, UserCheck, UserX } from "lucide-react";
// import { useAdminUsers, useUpdateUserStatus } from "@/hooks/use-admin";

// 상태별 배지 스타일 매핑
const statusBadgeStyles: Record<string, string> = {
  승인대기: "bg-amber-50 text-amber-700",
  관리자: "bg-blue-50 text-blue-700",
  활성: "bg-green-50 text-green-700",
  비활성유저: "bg-[#f5f3ef] text-muted-foreground",
};

export default function AdminUsersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  // const { data, isLoading } = useAdminUsers({ status: statusFilter });
  // const updateUser = useUpdateUserStatus();

  return (
    <div className="space-y-6">
      {/* 필터 영역 */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="사용자 검색..." className="pl-9 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="승인대기">승인대기</SelectItem>
            <SelectItem value="관리자">관리자</SelectItem>
            <SelectItem value="활성">활성</SelectItem>
            <SelectItem value="비활성유저">비활성유저</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 사용자 테이블 */}
      <Card className="rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead className="text-muted-foreground">아이디</TableHead>
                <TableHead className="text-muted-foreground">이메일</TableHead>
                <TableHead className="text-muted-foreground">상태</TableHead>
                <TableHead className="text-muted-foreground">가입일</TableHead>
                <TableHead className="text-right text-muted-foreground">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* data?.results.map((user) => ( */}
              <TableRow className="hover:bg-[#faf9f7] transition-colors">
                <TableCell className="font-medium text-foreground">username</TableCell>
                <TableCell className="text-foreground">email@example.com</TableCell>
                <TableCell>
                  <Badge className="bg-amber-50 text-amber-700 rounded-lg">승인대기</Badge>
                </TableCell>
                <TableCell className="text-caption text-muted-foreground">2024-01-01</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="text-green-700 hover:bg-green-50 rounded-lg">
                      <UserCheck className="mr-1 h-4 w-4" />
                      승인
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 rounded-lg">
                      <UserX className="mr-1 h-4 w-4" />
                      거절
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {/* )) */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

## API 훅 패턴

```tsx
// frontend/hooks/use-admin.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// 대시보드 통계
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/v1/admin/dashboard/stats").then((res) => res.data),
  });
}

// 사용자 목록 (기존 auth API 활용)
export function useAdminUsers(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      api.get("/v1/auth/users", { params }).then((res) => res.data),
  });
}

// 사용자 상태 변경 (기존 auth API 활용)
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.patch(`/v1/auth/${userId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
```

## 사이드바 연동

Phase 9에서 생성한 `sidebar.tsx`의 `menuItems`에 관리자 메뉴 추가:

```tsx
// sidebar.tsx menuItems에 추가
import { Shield } from "lucide-react";

{ label: "관리자", href: "/admin/dashboard", icon: Shield, roles: ["관리자"] },
```

`roles: ["관리자"]`로 설정하여 `UserStatus.ADMIN`인 사용자만 메뉴 표시.

## 테스트 패턴

```python
# backend/tests/test_admin.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_dashboard_stats(admin_client: AsyncClient):
    """관리자는 대시보드 통계를 조회할 수 있다."""
    response = await admin_client.get("/v1/admin/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "pending_users" in data


@pytest.mark.asyncio
async def test_admin_dashboard_forbidden(authenticated_client: AsyncClient):
    """일반 사용자는 관리자 API에 접근할 수 없다."""
    response = await authenticated_client.get("/v1/admin/dashboard/stats")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard_unauthenticated(client: AsyncClient):
    """비인증 사용자는 접근 불가."""
    response = await client.get("/v1/admin/dashboard/stats")
    assert response.status_code == 401
```

## 체크리스트

### 전제 조건
- [ ] SPEC.md 분석하여 관리자 페이지가 필요한지 판단
- [ ] **관리자 페이지 불필요 시 → 이 에이전트 실행 중단**

### 공통 (관리자 페이지 생성 결정 시)
- [ ] `backend/app/routers/admin.py` 생성 (dashboard stats 엔드포인트)
- [ ] `backend/app/schemas/admin.py` 생성
- [ ] `backend/app/main.py`에 admin 라우터 등록 (`prefix="/v1/admin"`)
- [ ] `frontend/hooks/use-admin.ts` 생성
- [ ] `frontend/app/(authenticated)/admin/layout.tsx` 생성 (탭 네비게이션)
- [ ] `frontend/app/(authenticated)/admin/page.tsx` 생성 (리다이렉트)
- [ ] `frontend/app/(authenticated)/admin/dashboard/page.tsx` 생성
- [ ] `frontend/app/(authenticated)/admin/users/page.tsx` 생성
- [ ] 사이드바에 관리자 메뉴 추가 (`roles: ["관리자"]`)
- [ ] `backend/tests/test_admin.py` 생성 (권한 테스트 포함)

### 조건부 (SPEC.md 키워드 매칭 시)
- [ ] 문서 관리 페이지 생성 (`document`/`content`/`article`/`post`)
- [ ] 통합 관리 페이지 생성 (섹션 9 또는 외부 API)
- [ ] 자동화 관리 페이지 생성 (`workflow`/`automation`/`rule`/`trigger`)
- [ ] 결제 관리 페이지 생성 (`payment`/`subscription`/`invoice`/`billing`)

### 검증
- [ ] `cd backend && pytest -v` — 전체 테스트 통과
- [ ] `cd frontend && npm run build` — 빌드 성공
- [ ] 관리자 외 사용자 접근 시 403 반환 확인
