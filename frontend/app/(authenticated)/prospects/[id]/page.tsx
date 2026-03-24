"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  useProspect,
  useDeleteProspect,
  useProspectConsultations,
} from "@/hooks/use-prospects";

// 상태 배지
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    신규: "bg-blue-50 text-blue-700",
    진행중: "bg-amber-50 text-amber-700",
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
    보류: "bg-amber-50 text-amber-700",
    부정: "bg-red-50 text-red-700",
    계약: "bg-green-50 text-green-700",
    진행: "bg-blue-50 text-blue-700",
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

export default function ProspectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: prospect, isLoading } = useProspect(id);
  const { data: consultations, isLoading: consultationsLoading } =
    useProspectConsultations(id);
  const deleteProspect = useDeleteProspect();
  const [aiExpanded, setAiExpanded] = useState(false);

  const handleDelete = () => {
    deleteProspect.mutate(id, {
      onSuccess: () => {
        toast({
          title: "삭제 완료",
          description: "가맹문의자가 삭제되었습니다.",
        });
        router.push("/prospects");
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { detail?: string } } };
        toast({
          title: "삭제 실패",
          description: err.response?.data?.detail || "다시 시도해주세요.",
          variant: "destructive",
        });
      },
    });
  };

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
            onClick={() =>
              toast({
                title: "준비 중",
                description: "수정 기능은 준비 중입니다.",
              })
            }
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            수정
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-heading3">
                  가맹문의자 삭제
                </AlertDialogTitle>
                <AlertDialogDescription className="text-caption2 text-muted-foreground">
                  &ldquo;{prospect.name}&rdquo; 문의자를 삭제하시겠습니까?
                  <br />이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700"
                >
                  {deleteProspect.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

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
              value={prospect.source}
            />
            <InfoItem
              icon={MapPin}
              label="희망지역"
              value={prospect.desired_location || prospect.region}
            />
            <InfoItem
              icon={Wallet}
              label="창업예산"
              value={
                prospect.budget ? `${prospect.budget.toLocaleString()}만원` : null
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
              router.push(`/consultations/new?prospect_id=${prospect.id}`)
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
                    id: number;
                    type: string;
                    consulted_at: string;
                    consulted_by_name: string;
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
                          {index + 1}
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-caption2 font-medium text-foreground">
                              {consultation.type || `${index + 1}차 상담`}
                            </span>
                            <span className="text-tiny text-muted-foreground">
                              {new Date(
                                consultation.consulted_at,
                              ).toLocaleDateString("ko-KR")}{" "}
                              {new Date(
                                consultation.consulted_at,
                              ).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-tiny text-muted-foreground">
                              &middot; {consultation.consulted_by_name}
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
                      <ResultBadge result={consultation.result || "진행"} />
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 요약 영역 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardContent className="p-6">
          {aiExpanded ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <Sparkles className="h-6 w-6 text-[#c47833]" />
              </div>
              <p className="mb-2 text-heading4 text-foreground">
                AI 분석 준비 중
              </p>
              <p className="text-center text-caption text-muted-foreground">
                상담 기록을 분석하여 인사이트를 제공하는 기능이
                <br />곧 추가될 예정입니다.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setAiExpanded(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 transition-colors hover:bg-[#faf9f7]"
            >
              <Sparkles className="h-4 w-4 text-[#c47833]" />
              <span className="text-caption2 font-medium text-[#c47833]">
                AI 요약을 보려면 클릭하세요
              </span>
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
