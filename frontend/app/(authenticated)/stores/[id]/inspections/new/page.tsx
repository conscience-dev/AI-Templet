"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2, ListTodo, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useCreateInspection, useGenerateInspectionTasks } from "@/hooks/use-inspections";
import { useStore } from "@/hooks/use-stores";
import { usePreviousIssues } from "@/hooks/use-store-health";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const priorityBadge: Record<string, string> = {
  높음: "bg-red-50 text-red-700",
  high: "bg-red-50 text-red-700",
  중간: "bg-amber-50 text-amber-700",
  medium: "bg-amber-50 text-amber-700",
  낮음: "bg-blue-50 text-blue-700",
  low: "bg-blue-50 text-blue-700",
};

const categoryBadge: Record<string, string> = {
  품질: "bg-[#d4a574]/10 text-[#c47833]",
  위생: "bg-green-50 text-green-700",
  매출: "bg-blue-50 text-blue-700",
  서비스: "bg-amber-50 text-amber-700",
  시설: "bg-[#f5f3ef] text-muted-foreground",
};

interface GeneratedTask {
  id?: string;
  category: string;
  task_description: string;
  priority: string;
  due_date?: string;
  status?: string;
}

export default function NewInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const { data: previousIssues } = usePreviousIssues(storeId);
  const createMutation = useCreateInspection();
  const generateTasksMutation = useGenerateInspectionTasks();

  const [form, setForm] = useState({
    inspection_date: "",
    quality_status: "",
    quality_notes: "",
    hygiene_status: "",
    hygiene_notes: "",
    sales_note: "",
    owner_feedback: "",
  });

  const [createdInspectionId, setCreatedInspectionId] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.quality_status) {
      toast({ variant: "destructive", title: "품질 상태를 선택해주세요." });
      return;
    }
    if (!form.hygiene_status) {
      toast({ variant: "destructive", title: "위생 상태를 선택해주세요." });
      return;
    }

    createMutation.mutate(
      {
        storeId,
        data: {
          inspection_date: form.inspection_date || new Date().toISOString(),
          quality_status: form.quality_status,
          quality_notes: form.quality_notes || undefined,
          hygiene_status: form.hygiene_status,
          hygiene_notes: form.hygiene_notes || undefined,
          sales_note: form.sales_note || undefined,
          owner_feedback: form.owner_feedback || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast({ title: "점검 기록이 저장되었습니다." });
          setCreatedInspectionId(data.id);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "저장에 실패했습니다. 다시 시도해주세요.",
          });
        },
      },
    );
  };

  const handleGenerateTasks = () => {
    if (!createdInspectionId) return;

    generateTasksMutation.mutate(createdInspectionId, {
      onSuccess: (data) => {
        toast({
          title: "AI 개선 과제 추천 완료",
          description: data.message || "개선 과제가 생성되었습니다.",
        });
        // 응답에서 생성된 과제 목록을 저장
        const tasks = data.tasks || data.results || data.data || [];
        setGeneratedTasks(Array.isArray(tasks) ? tasks : []);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "AI 추천에 실패했습니다.",
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/stores/${storeId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          점포 상세로 돌아가기
        </Link>
        {storeLoading ? (
          <Skeleton className="h-8 w-48 rounded-lg" />
        ) : (
          <h1 className="text-heading1 text-foreground">
            {store?.store_name} - 점검 등록
          </h1>
        )}
      </div>

      {createdInspectionId ? (
        /* 저장 완료 + AI 추천 영역 */
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
              <p className="mb-2 text-heading4 text-foreground">점검 기록이 저장되었습니다</p>
              <p className="mb-6 text-caption text-muted-foreground">
                AI가 점검 결과를 분석하여 개선 과제를 추천할 수 있습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateTasks}
                  disabled={generateTasksMutation.isPending || generateTasksMutation.isSuccess}
                  className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
                >
                  {generateTasksMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : generateTasksMutation.isSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      추천 완료
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI 개선 과제 추천
                    </>
                  )}
                </Button>
                <Link href={`/stores/${storeId}`}>
                  <Button variant="outline" className="rounded-xl">
                    점포 상세로 이동
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* AI 생성 과제 로딩 */}
          {generateTasksMutation.isPending && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a574]/10">
                  <Sparkles className="h-4 w-4 text-[#c47833]" />
                </div>
                <h2 className="text-heading4 text-foreground">AI 분석 중...</h2>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {/* AI 생성 과제 결과 */}
          {generatedTasks.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a574]/10">
                    <ListTodo className="h-4 w-4 text-[#c47833]" />
                  </div>
                  <h2 className="text-heading4 text-foreground">
                    AI 추천 개선 과제
                    <span className="ml-2 text-caption font-normal text-muted-foreground">
                      {generatedTasks.length}건
                    </span>
                  </h2>
                </div>
                <Link href={`/stores/${storeId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-border/60 transition-colors"
                  >
                    <ListTodo className="mr-1.5 h-3.5 w-3.5" />
                    개선 과제 목록으로 이동
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {generatedTasks.map((task, index) => (
                  <div
                    key={task.id || index}
                    className="rounded-xl border border-border/40 p-4 transition-colors hover:bg-[#faf9f7]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-lg px-2.5 py-0.5 text-tiny font-medium",
                              categoryBadge[task.category] ||
                                "bg-[#f5f3ef] text-muted-foreground",
                            )}
                          >
                            {task.category}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-tiny font-medium",
                              priorityBadge[task.priority] ||
                                "bg-[#f5f3ef] text-muted-foreground",
                            )}
                          >
                            {(task.priority === "high" || task.priority === "높음") && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-caption2 text-foreground">
                          {task.task_description}
                        </p>
                        {task.due_date && (
                          <p className="mt-1.5 text-tiny text-muted-foreground">
                            완료예정:{" "}
                            {new Date(task.due_date).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과제 생성 완료 후 빈 결과 */}
          {generateTasksMutation.isSuccess && generatedTasks.length === 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <CheckCircle2 className="h-6 w-6 text-[#c47833]" />
                </div>
                <p className="mb-2 text-heading4 text-foreground">
                  개선 과제가 생성되었습니다
                </p>
                <p className="mb-4 text-caption text-muted-foreground">
                  점포 상세 페이지에서 개선 과제를 확인할 수 있습니다.
                </p>
                <Link href={`/stores/${storeId}`}>
                  <Button
                    variant="outline"
                    className="rounded-xl border-border/60 transition-colors"
                  >
                    <ListTodo className="mr-1.5 h-4 w-4" />
                    개선 과제 목록으로 이동
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 점검 입력 폼 */
        <div className="space-y-6">
          {/* 이전 미완료 지적사항 */}
          {previousIssues && previousIssues.unresolved.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-heading4 text-foreground">
                  이전 미완료 지적사항
                </h2>
                <span className="inline-flex items-center rounded-xl bg-amber-100 px-2.5 py-0.5 text-caption font-medium text-amber-700">
                  {previousIssues.unresolved.length}건
                </span>
              </div>
              <p className="mb-3 text-caption text-muted-foreground">
                점검 시 아래 항목의 개선 여부를 확인해주세요.
              </p>
              <div className="space-y-2">
                {previousIssues.unresolved.map((issue) => (
                  <div
                    key={issue.task_id}
                    className="flex items-start gap-3 rounded-xl bg-white p-3 transition-colors"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[#d4a574]/10">
                      <AlertTriangle className="h-3 w-3 text-[#c47833]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-lg bg-[#f5f3ef] px-2 py-0.5 text-tiny font-medium text-muted-foreground">
                          {issue.category}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                            priorityBadge[issue.priority] ||
                              "bg-[#f5f3ef] text-muted-foreground",
                          )}
                        >
                          {issue.priority}
                        </span>
                        {issue.days_overdue > 0 && (
                          <span className="text-tiny text-red-600">
                            {issue.days_overdue}일 경과
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-foreground">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* 점검일시 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">점검일시</Label>
              <Input
                type="datetime-local"
                value={form.inspection_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, inspection_date: e.target.value }))
                }
                className="h-11 rounded-xl border-border"
              />
            </div>

            {/* 품질 상태 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">
                품질 상태 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.quality_status}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, quality_status: v }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-border">
                  <SelectValue placeholder="품질 상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="양호">양호</SelectItem>
                  <SelectItem value="미흡">미흡</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 품질 메모 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">품질 메모</Label>
              <Textarea
                placeholder="품질 관련 메모를 입력하세요..."
                value={form.quality_notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quality_notes: e.target.value }))
                }
                className="min-h-[80px] rounded-xl border-border"
              />
            </div>

            {/* 위생 상태 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">
                위생 상태 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.hygiene_status}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, hygiene_status: v }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-border">
                  <SelectValue placeholder="위생 상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="양호">양호</SelectItem>
                  <SelectItem value="미흡">미흡</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 위생 메모 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">위생 메모</Label>
              <Textarea
                placeholder="위생 관련 메모를 입력하세요..."
                value={form.hygiene_notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, hygiene_notes: e.target.value }))
                }
                className="min-h-[80px] rounded-xl border-border"
              />
            </div>

            {/* 매출 메모 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">매출 관련 메모</Label>
              <Textarea
                placeholder="매출 관련 메모를 입력하세요..."
                value={form.sales_note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sales_note: e.target.value }))
                }
                className="min-h-[80px] rounded-xl border-border"
              />
            </div>

            {/* 점주 의견 */}
            <div className="space-y-2">
              <Label className="text-bodymedium font-medium">점주 의견</Label>
              <Textarea
                placeholder="점주 의견을 입력하세요..."
                value={form.owner_feedback}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, owner_feedback: e.target.value }))
                }
                className="min-h-[80px] rounded-xl border-border"
              />
            </div>
          </div>

          {/* 액션 */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Link href={`/stores/${storeId}`}>
              <Button type="button" variant="outline" className="rounded-xl">
                취소
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
            >
              {createMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}
