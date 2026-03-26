"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  manager: "bg-blue-50 text-blue-700",
  staff: "bg-teal-50 text-teal-700",
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  manager: "매니저",
  staff: "담당자",
};

const departmentLabels: Record<string, string> = {
  dev: "점포개발팀",
  supervisor: "슈퍼바이저팀",
  executive: "경영진",
  admin: "관리팀",
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({
    status: statusFilter || undefined,
    page,
  });

  const updateStatusMutation = useUpdateUserStatus();

  const users = data?.results ?? [];
  const totalPages = data?.page_cnt ?? 1;

  const handleActivate = (userId: string) => {
    updateStatusMutation.mutate(
      { userId, data: { is_active: true } },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "사용자가 활성화되었습니다." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "활성화에 실패했습니다." });
        },
      },
    );
  };

  const handleDeactivate = (userId: string) => {
    updateStatusMutation.mutate(
      { userId, data: { is_active: false } },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "사용자가 비활성화되었습니다." });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "비활성화에 실패했습니다.",
          });
        },
      },
    );
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-heading1 text-foreground">사용자 관리</h1>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-border">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">이름</TableHead>
              <TableHead className="text-caption font-medium">이메일</TableHead>
              <TableHead className="text-caption font-medium">역할</TableHead>
              <TableHead className="text-caption font-medium">부서</TableHead>
              <TableHead className="text-caption font-medium">상태</TableHead>
              <TableHead className="text-caption font-medium">가입일</TableHead>
              <TableHead className="text-caption font-medium">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell className="h-48" colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <Users className="h-6 w-6 text-[#c47833]" />
                    </div>
                    <p className="text-bodymedium text-muted-foreground">
                      사용자가 없습니다
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        roleBadgeStyles[user.role] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.department
                      ? departmentLabels[user.department] || user.department
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        user.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {user.is_active ? "활성" : "비활성"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {user.is_active && user.role !== "admin" && (
                        <Button
                          className="h-7 rounded-lg px-3 text-tiny text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={updateStatusMutation.isPending}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(user.id)}
                        >
                          비활성화
                        </Button>
                      )}
                      {!user.is_active && (
                        <Button
                          className="h-7 rounded-lg bg-[#c47833] px-3 text-tiny text-white hover:bg-[#b06a2a]"
                          disabled={updateStatusMutation.isPending}
                          size="sm"
                          onClick={() => handleActivate(user.id)}
                        >
                          활성화
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border/40 px-6 py-4">
            <Button
              className="rounded-xl"
              disabled={page <= 1}
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <span className="text-caption text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              className="rounded-xl"
              disabled={page >= totalPages}
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
