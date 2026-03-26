"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCreateImprovementTask } from "@/hooks/use-improvement-tasks";
import { useStores } from "@/hooks/use-stores";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewImprovementTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateImprovementTask();
  const { data: storesData } = useStores({ page: 1 });
  const stores = storesData?.results ?? [];

  const [form, setForm] = useState({
    store_id: "",
    category: "",
    task_description: "",
    priority: "중간",
    due_date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.store_id) {
      toast({ variant: "destructive", title: "점포를 선택해주세요." });
      return;
    }
    if (!form.category) {
      toast({ variant: "destructive", title: "카테고리를 선택해주세요." });
      return;
    }
    if (!form.task_description.trim()) {
      toast({ variant: "destructive", title: "과제 설명을 입력해주세요." });
      return;
    }

    createMutation.mutate(
      {
        store_id: form.store_id,
        category: form.category,
        task_description: form.task_description,
        priority: form.priority,
        due_date: form.due_date || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "개선 과제가 등록되었습니다." });
          router.push("/improvement-tasks");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "등록에 실패했습니다. 다시 시도해주세요.",
          });
        },
      },
    );
  };

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
        <h1 className="text-heading1 text-foreground">개선 과제 등록</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* 점포 선택 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              점포 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.store_id}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, store_id: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="점포 선택" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              카테고리 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, category: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="카테고리 선택" />
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
            <Label className="text-bodymedium font-medium">
              과제 설명 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="개선 과제 내용을 입력하세요..."
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
        </div>

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href="/improvement-tasks">
            <Button type="button" variant="outline" className="rounded-xl">
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
          >
            {createMutation.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
