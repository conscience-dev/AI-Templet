"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListTodo, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useImprovementTasks,
  useUpdateImprovementTaskStatus,
} from "@/hooks/use-improvement-tasks";
import { useStores } from "@/hooks/use-stores";
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

const statusStyles: Record<string, string> = {
  미처리: "bg-red-50 text-red-700",
  진행중: "bg-amber-50 text-amber-700",
  완료: "bg-green-50 text-green-700",
};

const priorityStyles: Record<string, string> = {
  높음: "bg-red-50 text-red-700",
  중간: "bg-amber-50 text-amber-700",
  낮음: "bg-[#f5f3ef] text-muted-foreground",
};

const categoryStyles: Record<string, string> = {
  품질: "bg-blue-50 text-blue-700",
  위생: "bg-green-50 text-green-700",
  매출: "bg-amber-50 text-amber-700",
  운영: "bg-purple-50 text-purple-700",
  기타: "bg-[#f5f3ef] text-muted-foreground",
};

export default function ImprovementTasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useImprovementTasks({
    search: search || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    store_id: storeFilter || undefined,
    page,
  });

  const { data: storesData } = useStores({ page: 1 });
  const stores = storesData?.results ?? [];

  const updateStatusMutation = useUpdateImprovementTaskStatus();

  const tasks = data?.results ?? [];
  const totalPages = data?.page_cnt ?? 1;

  // 클라이언트 사이드 우선순위 필터링
  const filtered = priorityFilter
    ? tasks.filter((t) => t.priority === priorityFilter)
    : tasks;

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateStatusMutation.mutate(
      { id: taskId, status: newStatus },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "상태가 변경되었습니다." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "상태 변경에 실패했습니다." });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">개선 과제 관리</h1>
        <Link href="/improvement-tasks/new">
          <Button className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]">
            <Plus className="mr-1.5 h-4 w-4" />
            새 과제
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="과제 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border-border pl-10"
          />
        </div>
        <Select
          value={storeFilter}
          onValueChange={(v) => {
            setStoreFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[140px] rounded-xl border-border">
            <SelectValue placeholder="점포" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 점포</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.store_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[130px] rounded-xl border-border">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="품질">품질</SelectItem>
            <SelectItem value="위생">위생</SelectItem>
            <SelectItem value="매출">매출</SelectItem>
            <SelectItem value="운영">운영</SelectItem>
            <SelectItem value="기타">기타</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[130px] rounded-xl border-border">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="미처리">미처리</SelectItem>
            <SelectItem value="진행중">진행중</SelectItem>
            <SelectItem value="완료">완료</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[130px] rounded-xl border-border">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="높음">높음</SelectItem>
            <SelectItem value="중간">중간</SelectItem>
            <SelectItem value="낮음">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">점포명</TableHead>
              <TableHead className="text-caption font-medium">카테고리</TableHead>
              <TableHead className="text-caption font-medium">과제 설명</TableHead>
              <TableHead className="text-caption font-medium">우선순위</TableHead>
              <TableHead className="text-caption font-medium">상태</TableHead>
              <TableHead className="text-caption font-medium">완료예정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <ListTodo className="h-6 w-6 text-[#c47833]" />
                    </div>
                    <p className="text-bodymedium text-muted-foreground">
                      개선 과제가 없습니다
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer border-border/40 transition-colors hover:bg-[#faf9f7]"
                  onClick={() => router.push(`/improvement-tasks/${task.id}`)}
                >
                  <TableCell className="font-medium">
                    {task.store_name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        categoryStyles[task.category] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {task.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground">
                    {task.task_description}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        priorityStyles[task.priority] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status}
                      onValueChange={(v) => handleStatusChange(task.id, v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-[100px] rounded-xl border-0 text-caption font-medium",
                          statusStyles[task.status] ??
                            "bg-[#f5f3ef] text-muted-foreground",
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="미처리">미처리</SelectItem>
                        <SelectItem value="진행중">진행중</SelectItem>
                        <SelectItem value="완료">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString("ko-KR")
                      : "-"}
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
