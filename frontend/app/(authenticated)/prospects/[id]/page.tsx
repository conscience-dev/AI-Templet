"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { marked } from "marked";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  CircleDot,
  MessageSquare,
  Plus,
  Sparkles,
  Loader2,
  Lightbulb,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  MessageSquarePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  useProspect,
  useProspectConsultations,
  useUpdateProspect,
  useProspectAiSummary,
  useProspectNextAction,
} from "@/hooks/use-prospects";
import {
  useConsultationFeedback,
  type ConsultationFeedback,
} from "@/hooks/use-consultation-guide";

// 상태 배지
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    신규: "bg-blue-50 text-blue-700",
    상담중: "bg-amber-50 text-amber-700",
    보류: "bg-[#f5f3ef] text-muted-foreground",
    성약: "bg-green-50 text-green-700",
    종료: "bg-[#f5f3ef] text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-caption font-medium ${styles[status] || "bg-[#f5f3ef] text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// 결과 배지
function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    긍정: "bg-green-50 text-green-700",
    보통: "bg-amber-50 text-amber-700",
    부정: "bg-red-50 text-red-700",
    종료: "bg-[#f5f3ef] text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-tiny font-medium ${styles[result] || "bg-[#f5f3ef] text-muted-foreground"}`}
    >
      {result}
    </span>
  );
}

// 정보 항목 컴포넌트
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d4a574]/10">
        <Icon className="h-4 w-4 text-[#c47833]" />
      </div>
      <div className="min-w-0">
        <p className="text-tiny text-muted-foreground">{label}</p>
        <p className="text-caption2 text-foreground">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

// 수정 다이얼로그
function EditProspectDialog({
  prospect,
  open,
  onOpenChange,
}: {
  prospect: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    inquiry_path: string;
    hope_region: string | null;
    startup_budget: number | null;
    status: string;
    memo: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateProspect();

  const [form, setForm] = useState({
    name: prospect.name,
    phone: prospect.phone,
    email: prospect.email || "",
    inquiry_path: prospect.inquiry_path,
    hope_region: prospect.hope_region || "",
    startup_budget: prospect.startup_budget?.toString() || "",
    status: prospect.status,
    memo: prospect.memo || "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email || "",
        inquiry_path: prospect.inquiry_path,
        hope_region: prospect.hope_region || "",
        startup_budget: prospect.startup_budget?.toString() || "",
        status: prospect.status,
        memo: prospect.memo || "",
      });
    }
  }, [open, prospect]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "이름을 입력해주세요." });
      return;
    }
    if (!form.phone.trim()) {
      toast({ variant: "destructive", title: "연락처를 입력해주세요." });
      return;
    }

    const data: Record<string, unknown> = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      inquiry_path: form.inquiry_path,
      hope_region: form.hope_region || undefined,
      startup_budget: form.startup_budget
        ? Number(form.startup_budget)
        : null,
      status: form.status,
      memo: form.memo || undefined,
    };

    updateMutation.mutate(
      { id: prospect.id, data },
      {
        onSuccess: () => {
          toast({ title: "수정되었습니다." });
          onOpenChange(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "수정에 실패했습니다. 다시 시도해주세요.",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>가맹문의자 수정</DialogTitle>
          <DialogDescription>
            정보를 수정한 후 저장 버튼을 눌러주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="이름"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              연락처 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">이메일</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">문의경로</Label>
            <Input
              value={form.inquiry_path}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, inquiry_path: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="홈페이지, 전화, 지인소개 등"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">희망지역</Label>
            <Input
              value={form.hope_region}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hope_region: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="서울 강남, 경기 성남 등"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              창업예산 (만원)
            </Label>
            <Input
              type="number"
              value={form.startup_budget}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  startup_budget: e.target.value,
                }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="5000"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, status: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="신규">신규</SelectItem>
                <SelectItem value="상담중">상담중</SelectItem>
                <SelectItem value="보류">보류</SelectItem>
                <SelectItem value="성약">성약</SelectItem>
                <SelectItem value="종료">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, memo: e.target.value }))
              }
              className="min-h-[80px] rounded-xl border-border"
              placeholder="메모를 입력하세요..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: prospect, isLoading } = useProspect(id);
  const { data: consultations, isLoading: consultationsLoading } =
    useProspectConsultations(id);

  const [editOpen, setEditOpen] = useState(false);

  // AI 상태
  const aiSummaryMutation = useProspectAiSummary();
  const nextActionMutation = useProspectNextAction();
  const feedbackMutation = useConsultationFeedback();
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [nextActionResult, setNextActionResult] = useState<string | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<ConsultationFeedback | null>(null);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터 없음
  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-heading4 text-foreground">
          가맹문의자를 찾을 수 없습니다
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/prospects")}
          className="mt-4 rounded-xl border-border/60"
        >
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const consultationList = Array.isArray(consultations?.results)
    ? consultations.results
    : Array.isArray(consultations)
      ? consultations
      : [];

  const handleAiSummary = () => {
    aiSummaryMutation.mutate(id, {
      onSuccess: (data) => {
        setSummaryResult(data.summary || "요약 결과가 없습니다.");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "AI 요약에 실패했습니다. 다시 시도해주세요.",
        });
      },
    });
  };

  const handleNextAction = () => {
    nextActionMutation.mutate(id, {
      onSuccess: (data) => {
        setNextActionResult(data.recommendation || "추천 결과가 없습니다.");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "다음 액션 추천에 실패했습니다. 다시 시도해주세요.",
        });
      },
    });
  };

  const handleFeedback = () => {
    feedbackMutation.mutate(id, {
      onSuccess: (data) => {
        setFeedbackResult(data);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "상담 피드백 생성에 실패했습니다. 다시 시도해주세요.",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/prospects")}
            className="h-9 w-9 rounded-xl border-border/60"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-heading1 text-foreground">{prospect.name}</h1>
          <StatusBadge status={prospect.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border/60"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            수정
          </Button>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <EditProspectDialog
        prospect={prospect}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* 기본 정보 카드 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-heading4 text-foreground">
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem icon={Phone} label="연락처" value={prospect.phone} />
            <InfoItem icon={Mail} label="이메일" value={prospect.email} />
            <InfoItem
              icon={CircleDot}
              label="문의경로"
              value={prospect.inquiry_path}
            />
            <InfoItem
              icon={MapPin}
              label="희망지역"
              value={prospect.hope_region}
            />
            <InfoItem
              icon={Wallet}
              label="창업예산"
              value={
                prospect.startup_budget ? `${prospect.startup_budget.toLocaleString()}만원` : null
              }
            />
            <InfoItem
              icon={Calendar}
              label="등록일"
              value={new Date(prospect.created_at).toLocaleDateString("ko-KR")}
            />
          </div>
          {prospect.memo && (
            <>
              <Separator className="my-5 border-border/40" />
              <div>
                <p className="mb-1 text-tiny text-muted-foreground">메모</p>
                <p className="text-caption2 leading-relaxed text-foreground">
                  {prospect.memo}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 상담 이력 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-heading4 text-foreground">
            상담 이력
          </CardTitle>
          <Button
            size="sm"
            onClick={() =>
              router.push(`/prospects/${prospect.id}/consultations/new`)
            }
            className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            상담 기록 추가
          </Button>
        </CardHeader>
        <CardContent>
          {consultationsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : consultationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <MessageSquare className="h-6 w-6 text-[#c47833]" />
              </div>
              <p className="mb-1 text-caption2 font-medium text-foreground">
                상담 기록이 없습니다
              </p>
              <p className="text-caption text-muted-foreground">
                첫 상담 기록을 추가해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultationList.map(
                (
                  consultation: {
                    id: string;
                    consultation_order: number;
                    consultation_date: string;
                    consultant_name: string;
                    result: string;
                    content: string;
                    next_action: string;
                  },
                  index: number,
                ) => (
                  <div
                    key={consultation.id}
                    className="relative rounded-xl border border-border/40 p-5 transition-colors hover:bg-[#faf9f7]"
                  >
                    {/* 타임라인 연결선 */}
                    {index < consultationList.length - 1 && (
                      <div className="absolute -bottom-4 left-8 h-4 w-px bg-border/40" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* 차수 배지 */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4a574]/10 text-caption font-semibold text-[#c47833]">
                          {consultation.consultation_order}
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-caption2 font-medium text-foreground">
                              {consultation.consultation_order}차 상담
                            </span>
                            <span className="text-tiny text-muted-foreground">
                              {new Date(
                                consultation.consultation_date,
                              ).toLocaleDateString("ko-KR")}{" "}
                              {new Date(
                                consultation.consultation_date,
                              ).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-tiny text-muted-foreground">
                              &middot; {consultation.consultant_name}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-caption text-muted-foreground">
                            {consultation.content}
                          </p>
                          {consultation.next_action && (
                            <p className="text-tiny text-[#c47833]">
                              다음 조치: {consultation.next_action}
                            </p>
                          )}
                        </div>
                      </div>
                      <ResultBadge result={consultation.result || "보통"} />
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 분석 영역 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a574]/10">
              <Sparkles className="h-4 w-4 text-[#c47833]" />
            </div>
            AI 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI 상담 요약 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-caption2 font-medium text-foreground">
                AI 상담 요약
              </h3>
              <Button
                size="sm"
                onClick={handleAiSummary}
                disabled={aiSummaryMutation.isPending}
                className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
              >
                {aiSummaryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    AI 상담 요약
                  </>
                )}
              </Button>
            </div>

            {aiSummaryMutation.isPending && (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-[#faf9f7] py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#c47833]" />
                <span className="text-caption text-muted-foreground">
                  AI가 분석 중입니다...
                </span>
              </div>
            )}

            {summaryResult && !aiSummaryMutation.isPending && (
              <div className="rounded-xl border border-border/40 bg-[#faf9f7] p-5">
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: marked(summaryResult) as string,
                  }}
                />
              </div>
            )}
          </div>

          <Separator className="border-border/40" />

          {/* 다음 상담 제안 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-caption2 font-medium text-foreground">
                다음 상담 제안
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextAction}
                disabled={nextActionMutation.isPending}
                className="rounded-xl border-border/60 transition-colors"
              >
                {nextActionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-3.5 w-3.5" />
                    다음 상담 제안
                  </>
                )}
              </Button>
            </div>

            {nextActionMutation.isPending && (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-[#faf9f7] py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#c47833]" />
                <span className="text-caption text-muted-foreground">
                  AI가 분석 중입니다...
                </span>
              </div>
            )}

            {nextActionResult && !nextActionMutation.isPending && (
              <div className="rounded-xl border border-border/40 bg-[#faf9f7] p-5">
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: marked(nextActionResult) as string,
                  }}
                />
              </div>
            )}
          </div>

          <Separator className="border-border/40" />

          {/* 상담 피드백 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-caption2 font-medium text-foreground">
                상담 피드백
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFeedback}
                disabled={feedbackMutation.isPending}
                className="rounded-xl border-border/60 transition-colors"
              >
                {feedbackMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
                    상담 피드백
                  </>
                )}
              </Button>
            </div>

            {feedbackMutation.isPending && (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-[#faf9f7] py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#c47833]" />
                <span className="text-caption text-muted-foreground">
                  AI가 상담 품질을 분석 중입니다...
                </span>
              </div>
            )}

            {feedbackResult && !feedbackMutation.isPending && (
              <div className="space-y-4 rounded-xl border border-border/40 bg-[#faf9f7] p-5">
                {/* 점수 */}
                <div className="flex items-center gap-3">
                  <span className="text-caption font-medium text-foreground">품질 점수:</span>
                  <span
                    className={`inline-flex rounded-lg px-3 py-1 text-caption font-semibold ${
                      feedbackResult.score >= 8
                        ? "bg-green-50 text-green-700"
                        : feedbackResult.score >= 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {feedbackResult.score}/10
                  </span>
                </div>

                {/* 잘한 점 */}
                {feedbackResult.strengths.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-tiny font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      잘한 점
                    </p>
                    <ul className="space-y-1">
                      {feedbackResult.strengths.map((s, i) => (
                        <li key={i} className="text-caption text-green-700">
                          - {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 개선할 점 */}
                {feedbackResult.improvements.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-tiny font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      개선할 점
                    </p>
                    <ul className="space-y-1">
                      {feedbackResult.improvements.map((s, i) => (
                        <li key={i} className="text-caption text-amber-700">
                          - {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 빠트린 항목 */}
                {feedbackResult.missed_items.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-tiny font-semibold text-red-700">
                      <Circle className="h-3.5 w-3.5" />
                      빠트린 항목
                    </p>
                    <ul className="space-y-1">
                      {feedbackResult.missed_items.map((s, i) => (
                        <li key={i} className="text-caption text-red-700">
                          - {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 추천 스크립트 */}
                {feedbackResult.recommended_script && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-tiny font-semibold text-[#c47833]">
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      추천 응대 스크립트
                    </p>
                    <div
                      className="prose prose-sm max-w-none rounded-lg bg-white p-3 text-foreground"
                      dangerouslySetInnerHTML={{
                        __html: marked(feedbackResult.recommended_script) as string,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
