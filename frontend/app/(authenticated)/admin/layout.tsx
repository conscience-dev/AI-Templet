"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Users, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

const adminTabs = [
  { label: "사용자 관리", href: "/admin/users", icon: Users },
  { label: "시스템 설정", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-8">
        <Skeleton className="mb-6 h-8 w-48 rounded" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // 관리자가 아닌 경우 접근 거부
  if (user?.role !== "admin") {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
          <ShieldAlert className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-heading2 text-foreground">접근 권한이 없습니다</h1>
        <p className="text-bodymedium text-muted-foreground">
          이 페이지는 관리자만 접근할 수 있습니다.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 text-bodymedium text-[#c47833] transition-colors hover:text-[#b06a2a]"
        >
          대시보드로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 탭 네비게이션 */}
      <div className="mb-6 flex items-center gap-1 border-b border-border/40">
        {adminTabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-bodymedium font-medium transition-colors",
                isActive
                  ? "border-[#c47833] text-[#c47833]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
