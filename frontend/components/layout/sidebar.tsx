"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Store,
  CheckCircle,
  ListTodo,
  BarChart3,
  Settings,
  LogOut,
  ChefHat,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useMe, useLogout, User } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// 역할별 메뉴 접근 권한 정의
interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "admin",
      "executive",
      "dev_manager",
      "dev_staff",
      "supervisor_manager",
      "supervisor",
    ],
  },
  {
    label: "가맹문의자",
    href: "/prospects",
    icon: Users,
    roles: ["admin", "executive", "dev_manager", "dev_staff"],
  },
  {
    label: "상담 기록",
    href: "/consultations",
    icon: MessageSquare,
    roles: ["admin", "dev_manager", "dev_staff"],
  },
  {
    label: "점포 관리",
    href: "/stores",
    icon: Store,
    roles: ["admin", "executive", "supervisor_manager", "supervisor"],
  },
  {
    label: "점포 점검",
    href: "/inspections",
    icon: CheckCircle,
    roles: ["admin", "supervisor_manager", "supervisor"],
  },
  {
    label: "개선 과제",
    href: "/improvement-tasks",
    icon: ListTodo,
    roles: ["admin", "executive", "supervisor_manager", "supervisor"],
  },
  {
    label: "분석 리포트",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "executive", "dev_manager", "supervisor_manager"],
  },
  {
    label: "사용자 관리",
    href: "/admin/users",
    icon: Settings,
    roles: ["admin"],
  },
];

// 역할 표시명
const roleLabels: Record<string, string> = {
  admin: "관리자",
  executive: "경영진",
  dev_manager: "점포개발 매니저",
  dev_staff: "점포개발 담당자",
  supervisor_manager: "SV 매니저",
  supervisor: "슈퍼바이저",
};

// 유저 이니셜 추출
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// 역할에 따라 필터링된 메뉴 반환
function getFilteredMenu(role: string): MenuItem[] {
  return menuItems.filter((item) => item.roles.includes(role));
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  const filteredMenu = user ? getFilteredMenu(user.role) : [];

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#1a1915]">
      {/* 로고 영역 */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a574]/15">
          <ChefHat className="h-5 w-5 text-[#d4a574]" />
        </div>
        <span className="text-heading4 text-[#e8e4dc]">이비가푸드</span>
      </div>

      <Separator className="border-white/[0.08]" />

      {/* 내비게이션 메뉴 */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : (
          filteredMenu.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-bodymedium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-[#a39e93] hover:bg-white/5 hover:text-[#e8e4dc]",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      <Separator className="border-white/[0.08]" />

      {/* 유저 영역 */}
      <div className="px-3 py-4">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3">
            <Skeleton className="h-9 w-9 rounded-full bg-white/5" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded bg-white/5" />
              <Skeleton className="h-3 w-14 rounded bg-white/5" />
            </div>
          </div>
        ) : user ? (
          <UserSection user={user} onLogout={logout} />
        ) : null}
      </div>
    </aside>
  );
}

function UserSection({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a574]/20 text-caption font-semibold text-[#d4a574]">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-caption font-medium text-[#e8e4dc]">
            {user.name}
          </p>
          <p className="truncate text-tiny text-[#a39e93]">
            {roleLabels[user.role] || user.role}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="rounded-lg p-1.5 text-[#a39e93] transition-colors hover:bg-white/5 hover:text-[#e8e4dc]"
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
