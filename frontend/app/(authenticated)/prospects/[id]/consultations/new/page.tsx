"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCreateConsultation } from "@/hooks/use-consultations";
import { useProspect } from "@/hooks/use-prospects";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: prospectId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const { data: prospect, isLoading: prospectLoading } = useProspect(prospectId);
  const createMutation = useCreateConsultation();

  const [form, setForm] = useState({
    consultation_order: 1,
    consultation_date: "",
    content: "",
    result: "",
    next_action: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.content) {
      toast({ variant: "destructive", title: "상담 내용을 입력해주세요." });
      return;
    }
    if (!form.result) {
      toast({ variant: "destructive", title: "상담 결과를 선택해주세요." });
      return;
    }

    createMutation.mutate(
      {
        prospectId,
        data: {
          consultation_order: form.consultation_order,
          consultation_date: form.consultation_date || new Date().toISOString(),
          content: form.content,
          result: form.result,
          next_action: form.next_action || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "상담 기록이 저장되었습니다." });
          router.push(`/prospects/${prospectId}`);
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

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/prospects/${prospectId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          문의자 상세로 돌아가기
        </Link>
        {prospectLoading ? (
          <Skeleton className="h-8 w-48 rounded-lg" />
        ) : (
          <h1 className="text-heading1 text-foreground">
            {prospect?.name} - 상담 등록
          </h1>
        )}
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* 상담 차수 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              상담 차수 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={String(form.consultation_order)}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, consultation_order: Number(v) }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1차</SelectItem>
                <SelectItem value="2">2차</SelectItem>
                <SelectItem value="3">3차</SelectItem>
                <SelectItem value="4">4차</SelectItem>
                <SelectItem value="5">5차 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 상담일시 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">상담일시</Label>
            <Input
              type="datetime-local"
              value={form.consultation_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consultation_date: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
            />
          </div>

          {/* 상담 내용 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              상담 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="상담 내용을 입력하세요..."
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              className="min-h-[120px] rounded-xl border-border"
            />
          </div>

          {/* 상담 결과 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              상담 결과 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.result}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, result: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="결과 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="긍정">긍정</SelectItem>
                <SelectItem value="보통">보통</SelectItem>
                <SelectItem value="부정">부정</SelectItem>
                <SelectItem value="종료">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 다음 액션 메모 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">다음 액션 메모</Label>
            <Textarea
              placeholder="다음 액션 사항을 입력하세요..."
              value={form.next_action}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  next_action: e.target.value,
                }))
              }
              className="min-h-[80px] rounded-xl border-border"
            />
          </div>
        </div>

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href={`/prospects/${prospectId}`}>
            <Button type="button" variant="outline" className="rounded-xl">
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]"
          >
            {createMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
