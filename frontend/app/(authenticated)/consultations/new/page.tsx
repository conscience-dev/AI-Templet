"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCreateConsultation } from "@/hooks/use-consultations";
import { useProspects } from "@/hooks/use-prospects";
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

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const prospectIdParam = searchParams.get("prospect_id");

  const { data: prospectsData } = useProspects({ page: 1 });
  const createMutation = useCreateConsultation();

  const [form, setForm] = useState({
    prospect_id: prospectIdParam ? Number(prospectIdParam) : 0,
    type: "1차",
    consulted_at: "",
    content: "",
    result: "",
    next_action: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.prospect_id) {
      toast({ variant: "destructive", title: "가맹문의자를 선택해주세요." });
      return;
    }
    if (!form.content) {
      toast({ variant: "destructive", title: "상담 내용을 입력해주세요." });
      return;
    }

    createMutation.mutate(
      {
        prospect_id: form.prospect_id,
        type: form.type,
        content: form.content,
        result: form.result || undefined,
        next_action: form.next_action || undefined,
        next_contact_date: null,
      },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "상담 기록이 저장되었습니다." });
          router.push("/consultations");
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

  const prospects = prospectsData?.results ?? [];

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/consultations"
          className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          상담 기록 목록
        </Link>
        <h1 className="text-heading1 text-foreground">신규 상담 등록</h1>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* 가맹문의자 선택 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              가맹문의자 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.prospect_id ? String(form.prospect_id) : ""}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, prospect_id: Number(v) }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="가맹문의자 선택" />
              </SelectTrigger>
              <SelectContent>
                {prospects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상담 차수 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">상담 차수</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, type: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1차">1차</SelectItem>
                <SelectItem value="2차">2차</SelectItem>
                <SelectItem value="3차">3차</SelectItem>
                <SelectItem value="4차">4차</SelectItem>
                <SelectItem value="5차 이상">5차 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 상담일시 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">상담일시</Label>
            <Input
              type="datetime-local"
              value={form.consulted_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consulted_at: e.target.value }))
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

          {/* 결과 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">결과</Label>
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
                <SelectItem value="A가망고객">A 가망고객</SelectItem>
                <SelectItem value="B지속고객">B 지속고객</SelectItem>
                <SelectItem value="C종료의지없음">C 종료의지없음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 다음 조치 */}
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">다음 조치</Label>
            <Textarea
              placeholder="다음 조치 사항을 입력하세요..."
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
          <Link href="/consultations">
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
