"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  useImprovementTask,
  useUpdateImprovementTask,
  useUpdateImprovementTaskStatus,
} from "@/hooks/use-improvement-tasks";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function ImprovementTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const { data: task, isLoading } = useImprovementTask(id);
  const updateMutation = useUpdateImprovementTask();
  const updateStatusMutation = useUpdateImprovementTaskStatus();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    category: "",
    task_description: "",
    priority: "",
    due_date: "",
  });

  useEffect(() => {
    if (task) {
      setForm({
        category: task.category,
        task_description: task.task_description,
        priority: task.priority,
        due_date: task.due_date
          ? task.due_date.split("T")[0]
          : "",
      });
    }
  }, [task]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        id,
        data: {
          category: form.category,
          task_description: form.task_description,
          priority: form.priority,
          due_date: form.due_date || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "개선 과제가 수정되었습니다." });
          setEditing(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "수정에 실패했습니다.",
          });
        },
      },
    );
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast({ title: "상태가 변경되었습니다." });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "상태 변경에 실패했습니다.",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <p className="text-muted-foreground">개선 과제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/improvement-tasks"
          className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-heading1 text-foreground">개선 과제 상세</h1>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              수정
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {editing ? (
          /* 수정 모드 */
          <>
            {/* 점포 (읽기 전용) */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium text-muted-foreground">
                점포
              </Label>
              <p className="text-bodymedium text-foreground">
                {task.store_name ?? "-"}
              </p>
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="품질">품질</SelectItem>
                  <SelectItem value="위생">위생</SelectItem>
                  <SelectItem value="매출">매출</SelectItem>
                  <SelectItem value="운영">운영</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 과제 설명 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">과제 설명</Label>
              <Textarea
                value={form.task_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    task_description: e.target.value,
                  }))
                }
                className="min-h-[120px] rounded-xl border-border"
              />
            </div>

            {/* 우선순위 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">우선순위</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, priority: v }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="높음">높음</SelectItem>
                  <SelectItem value="중간">중간</SelectItem>
                  <SelectItem value="낮음">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 완료예정일 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">완료예정일</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, due_date: e.target.value }))
                }
                className="h-11 rounded-xl border-border"
              />
            </div>

            {/* 액션 */}
            <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setEditing(false)}
              >
                취소
              </Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={handleSave}
                className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
              >
                {updateMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </>
        ) : (
          /* 보기 모드 */
          <>
            {/* 점포 */}
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">점포</p>
              <p className="text-bodymedium font-medium text-foreground">
                {task.store_name ?? "-"}
              </p>
            </div>

            {/* 카테고리 + 우선순위 + 상태 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">카테고리</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                    categoryStyles[task.category] ??
                      "bg-[#f5f3ef] text-muted-foreground",
                  )}
                >
                  {task.category}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">우선순위</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                    priorityStyles[task.priority] ??
                      "bg-[#f5f3ef] text-muted-foreground",
                  )}
                >
                  {task.priority}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">상태</p>
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
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
              </div>
            </div>

            {/* 과제 설명 */}
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">과제 설명</p>
              <p className="whitespace-pre-wrap text-bodymedium text-foreground">
                {task.task_description}
              </p>
            </div>

            {/* 완료예정일 */}
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">완료예정일</p>
              <p className="text-bodymedium text-foreground">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("ko-KR")
                  : "-"}
              </p>
            </div>

            {/* 등록/수정일 */}
            <div className="flex gap-6 border-t border-border/40 pt-4">
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">등록일</p>
                <p className="text-caption text-foreground">
                  {new Date(task.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-caption text-muted-foreground">수정일</p>
                <p className="text-caption text-foreground">
                  {new Date(task.updated_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
