"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  executive: "bg-blue-50 text-blue-700",
  dev_manager: "bg-teal-50 text-teal-700",
  dev_staff: "bg-teal-50 text-teal-700",
  supervisor_manager: "bg-amber-50 text-amber-700",
  supervisor: "bg-amber-50 text-amber-700",
};

const roleLabels: Record<string, string> = {
  admin: "관리자",
  executive: "경영진",
  dev_manager: "점포개발 매니저",
  dev_staff: "점포개발 담당자",
  supervisor_manager: "SV 매니저",
  supervisor: "슈퍼바이저",
};

const statusBadgeStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  inactive: "bg-[#f5f3ef] text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  active: "활성",
  pending: "승인대기",
  inactive: "비활성",
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

  const handleApprove = (userId: number) => {
    updateStatusMutation.mutate(
      { userId, data: { status: "active", is_active: true } },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "사용자가 승인되었습니다." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "승인에 실패했습니다." });
        },
      },
    );
  };

  const handleDeactivate = (userId: number) => {
    updateStatusMutation.mutate(
      { userId, data: { status: "inactive", is_active: false } },
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
            <SelectItem value="pending">승인대기</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">이름</TableHead>
              <TableHead className="text-caption font-medium">아이디</TableHead>
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
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48">
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
                    {user.username}
                  </TableCell>
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
                    {user.department || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        statusBadgeStyles[user.status] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {statusLabels[user.status] ?? user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {user.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-7 rounded-lg bg-[#c47833] px-3 text-tiny text-white hover:bg-[#b06a2a]"
                          onClick={() => handleApprove(user.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          승인
                        </Button>
                      )}
                      {user.status === "active" &&
                        user.role !== "admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg px-3 text-tiny text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeactivate(user.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            비활성화
                          </Button>
                        )}
                      {user.status === "inactive" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-lg px-3 text-tiny"
                          onClick={() => handleApprove(user.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          재활성화
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
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <span className="text-caption text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
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
