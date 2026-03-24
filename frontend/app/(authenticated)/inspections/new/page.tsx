"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useCreateInspection } from "@/hooks/use-inspections";
import { useStores } from "@/hooks/use-stores";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const storeIdParam = searchParams.get("store_id");

  const { data: storesData } = useStores({ page: 1 });
  const createMutation = useCreateInspection();
  const stores = storesData?.results ?? [];

  const [form, setForm] = useState({
    store_id: storeIdParam ? Number(storeIdParam) : 0,
    inspection_date: "",
    // 품질
    quality_status: "",
    quality_notes: "",
    // 위생
    hygiene_status: "",
    hygiene_notes: "",
    // 매출
    monthly_sales: "",
    yoy_change: "",
    mom_change: "",
    // 직원
    hall_staff: "",
    kitchen_staff: "",
    // 기타
    market_changes: "",
    owner_feedback: "",
    improvement_requests: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.store_id) {
      toast({ variant: "destructive", title: "점포를 선택해주세요." });
      return;
    }
    if (!form.inspection_date) {
      toast({ variant: "destructive", title: "점검일시를 입력해주세요." });
      return;
    }

    const hygieneScore = form.hygiene_status === "양호" ? 85 : form.hygiene_status === "미흡" ? 40 : undefined;
    const serviceScore = form.quality_status === "준수" ? 85 : form.quality_status === "미흡" ? 40 : undefined;

    createMutation.mutate(
      {
        store_id: form.store_id,
        inspection_date: form.inspection_date,
        hygiene_score: hygieneScore ?? null,
        service_score: serviceScore ?? null,
        findings: [
          form.quality_notes && `[품질] ${form.quality_notes}`,
          form.hygiene_notes && `[위생] ${form.hygiene_notes}`,
          form.market_changes && `[상권변화] ${form.market_changes}`,
          form.owner_feedback && `[점주의견] ${form.owner_feedback}`,
        ]
          .filter(Boolean)
          .join("\n"),
        recommendations: form.improvement_requests || undefined,
      },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "점검 기록이 저장되었습니다." });
          router.push("/inspections");
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
          href="/inspections"
          className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          점검 목록
        </Link>
        <h1 className="text-heading1 text-foreground">신규 점검 등록</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="mb-4 text-heading3 text-foreground">기본 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  점포 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.store_id ? String(form.store_id) : ""}
                  onValueChange={(v) => update("store_id", v)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border">
                    <SelectValue placeholder="점포 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  점검일시 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={form.inspection_date}
                  onChange={(e) => update("inspection_date", e.target.value)}
                  className="h-11 rounded-xl border-border"
                />
              </div>
            </div>
          </div>

          {/* 품질 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="mb-4 text-heading3 text-foreground">품질 점검</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>품질 상태</Label>
                <Select
                  value={form.quality_status}
                  onValueChange={(v) => update("quality_status", v)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="준수">준수</SelectItem>
                    <SelectItem value="미흡">미흡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>품질 점검 내용</Label>
                <Textarea
                  placeholder="품질 관련 점검 내용을 입력하세요..."
                  value={form.quality_notes}
                  onChange={(e) => update("quality_notes", e.target.value)}
                  className="min-h-[80px] rounded-xl border-border"
                />
              </div>
            </div>
          </div>

          {/* 위생 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="mb-4 text-heading3 text-foreground">위생 점검</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>위생 상태</Label>
                <Select
                  value={form.hygiene_status}
                  onValueChange={(v) => update("hygiene_status", v)}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="양호">양호</SelectItem>
                    <SelectItem value="미흡">미흡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>위생 점검 내용</Label>
                <Textarea
                  placeholder="위생 관련 점검 내용을 입력하세요..."
                  value={form.hygiene_notes}
                  onChange={(e) => update("hygiene_notes", e.target.value)}
                  className="min-h-[80px] rounded-xl border-border"
                />
              </div>
            </div>
          </div>

          {/* 매출 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="mb-4 text-heading3 text-foreground">매출 정보</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>월매출 (만원)</Label>
                <Input
                  type="number"
                  value={form.monthly_sales}
                  onChange={(e) => update("monthly_sales", e.target.value)}
                  className="h-11 rounded-xl border-border"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>전년동월대비 (%)</Label>
                <Input
                  type="number"
                  value={form.yoy_change}
                  onChange={(e) => update("yoy_change", e.target.value)}
                  className="h-11 rounded-xl border-border"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>전월대비 (%)</Label>
                <Input
                  type="number"
                  value={form.mom_change}
                  onChange={(e) => update("mom_change", e.target.value)}
                  className="h-11 rounded-xl border-border"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 기타 */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="mb-4 text-heading3 text-foreground">기타 정보</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>홀 직원 수</Label>
                  <Input
                    type="number"
                    value={form.hall_staff}
                    onChange={(e) => update("hall_staff", e.target.value)}
                    className="h-11 rounded-xl border-border"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>주방 직원 수</Label>
                  <Input
                    type="number"
                    value={form.kitchen_staff}
                    onChange={(e) => update("kitchen_staff", e.target.value)}
                    className="h-11 rounded-xl border-border"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>상권 변화</Label>
                <Textarea
                  placeholder="상권 변화 사항을 입력하세요..."
                  value={form.market_changes}
                  onChange={(e) => update("market_changes", e.target.value)}
                  className="min-h-[80px] rounded-xl border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>점주 의견</Label>
                <Textarea
                  placeholder="점주 의견을 입력하세요..."
                  value={form.owner_feedback}
                  onChange={(e) => update("owner_feedback", e.target.value)}
                  className="min-h-[80px] rounded-xl border-border"
                />
              </div>
              <Separator className="border-border/40" />
              <div className="space-y-2">
                <Label>개선 요청 사항</Label>
                <Textarea
                  placeholder="개선이 필요한 사항을 입력하세요..."
                  value={form.improvement_requests}
                  onChange={(e) =>
                    update("improvement_requests", e.target.value)
                  }
                  className="min-h-[80px] rounded-xl border-border"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 액션 */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href="/inspections">
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
