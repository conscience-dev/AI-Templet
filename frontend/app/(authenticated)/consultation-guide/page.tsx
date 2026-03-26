"use client";

import { useState } from "react";
import { marked } from "marked";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  Lightbulb,
  Sparkles,
  Loader2,
  MessageSquarePlus,
  ClipboardCheck,
  Target,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  useConsultationChecklist,
  useBestPractices,
  useConsultationFeedback,
  type ConsultationFeedback,
} from "@/hooks/use-consultation-guide";
import { useProspects, type Prospect } from "@/hooks/use-prospects";

// 체크리스트 카테고리별 아이콘
const categoryIcons: Record<string, React.ElementType> = {
  "기본정보": BookOpen,
  "비용안내": Target,
  "상권분석": TrendingUp,
  "교육/운영": ClipboardCheck,
};

// 점수에 따른 색상
function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-700";
  if (score >= 5) return "text-amber-700";
  return "text-red-700";
}

function getScoreBg(score: number): string {
  if (score >= 8) return "bg-green-50";
  if (score >= 5) return "bg-amber-50";
  return "bg-red-50";
}

// 점수 게이지
function ScoreGauge({ score }: { score: number }) {
  const percentage = (score / 10) * 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-border/40"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${percentage * 3.14} ${314 - percentage * 3.14}`}
            strokeLinecap="round"
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-display font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-tiny text-muted-foreground">/10</span>
        </div>
      </div>
      <span
        className={`inline-flex rounded-lg px-3 py-1 text-caption font-medium ${getScoreBg(score)} ${getScoreColor(score)}`}
      >
        {score >= 8 ? "우수" : score >= 5 ? "보통" : "개선 필요"}
      </span>
    </div>
  );
}

export default function ConsultationGuidePage() {
  const { data: checklistData, isLoading: checklistLoading } =
    useConsultationChecklist();
  const { data: bestPracticesData, isLoading: bestPracticesLoading } =
    useBestPractices();
  const { data: prospectsData } = useProspects({ page: 1 });
  const feedbackMutation = useConsultationFeedback();

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedProspectId, setSelectedProspectId] = useState<string>("");
  const [feedbackResult, setFeedbackResult] =
    useState<ConsultationFeedback | null>(null);

  const prospects = prospectsData?.results || [];

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 카테고리별 그룹핑
  const groupedChecklist: Record<
    string,
    { id: string; category: string; description: string; required: boolean }[]
  > = {};
  if (checklistData?.items) {
    for (const item of checklistData.items) {
      if (!groupedChecklist[item.category]) {
        groupedChecklist[item.category] = [];
      }
      groupedChecklist[item.category].push(item);
    }
  }

  const handleFeedback = () => {
    if (!selectedProspectId) {
      toast({
        variant: "destructive",
        title: "가맹문의자를 선택해주세요.",
      });
      return;
    }

    feedbackMutation.mutate(selectedProspectId, {
      onSuccess: (data) => {
        setFeedbackResult(data);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "AI 피드백 생성에 실패했습니다. 다시 시도해주세요.",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-heading1 text-foreground">상담 가이드</h1>
        <p className="mt-1 text-caption text-muted-foreground">
          상담 체크리스트, 우수 사례 분석, AI 피드백을 통해 상담 품질을
          향상시키세요.
        </p>
      </div>

      {/* 상담 체크리스트 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a574]/10">
              <ClipboardCheck className="h-4 w-4 text-[#c47833]" />
            </div>
            상담 체크리스트
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklistLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedChecklist).map(
                ([category, items]) => {
                  const CategoryIcon = categoryIcons[category] || BookOpen;
                  const checked = items.filter((item) =>
                    checkedItems.has(item.id),
                  ).length;

                  return (
                    <div key={category}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4 text-[#c47833]" />
                          <h3 className="text-caption font-semibold text-foreground">
                            {category}
                          </h3>
                        </div>
                        <span className="text-tiny text-muted-foreground">
                          {checked}/{items.length} 완료
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const isChecked = checkedItems.has(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleCheck(item.id)}
                              className="flex w-full items-center gap-3 rounded-xl border border-border/40 px-4 py-3 text-left transition-colors hover:bg-[#faf9f7]"
                            >
                              {isChecked ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#c47833]" />
                              ) : (
                                <Circle className="h-5 w-5 shrink-0 text-border" />
                              )}
                              <span
                                className={`flex-1 text-caption ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}
                              >
                                {item.description}
                              </span>
                              {item.required && (
                                <span className="shrink-0 rounded-lg bg-red-50 px-2 py-0.5 text-tiny font-medium text-red-700">
                                  필수
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 우수 사례 분석 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a574]/10">
              <Award className="h-4 w-4 text-[#c47833]" />
            </div>
            우수 사례 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bestPracticesLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : bestPracticesData ? (
            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                      <TrendingUp className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-tiny text-muted-foreground">
                        총 성약 건수
                      </p>
                      <p className="text-heading3 font-bold text-foreground">
                        {bestPracticesData.total_contracted}건
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <MessageSquarePlus className="h-5 w-5 text-[#c47833]" />
                    </div>
                    <div>
                      <p className="text-tiny text-muted-foreground">
                        평균 상담 횟수
                      </p>
                      <p className="text-heading3 font-bold text-foreground">
                        {bestPracticesData.avg_consultations}회
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 공통 패턴 */}
              <div>
                <h3 className="mb-3 text-caption font-semibold text-foreground">
                  성약 성공 패턴
                </h3>
                <div className="space-y-2">
                  {bestPracticesData.common_patterns.map((pattern, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border/40 px-4 py-3"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-tiny font-semibold text-green-700">
                        {i + 1}
                      </div>
                      <p className="text-caption text-foreground">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="border-border/40" />

              {/* 팁 목록 */}
              <div>
                <h3 className="mb-3 text-caption font-semibold text-foreground">
                  상담 팁
                </h3>
                <div className="space-y-2">
                  {bestPracticesData.tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-[#faf9f7] px-4 py-3"
                    >
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#c47833]" />
                      <p className="text-caption text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 상담 피드백 (AI) */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a574]/10">
              <Sparkles className="h-4 w-4 text-[#c47833]" />
            </div>
            AI 상담 피드백
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 문의자 선택 */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label htmlFor="prospect-select" className="text-caption font-medium text-foreground">
                가맹문의자 선택
              </label>
              <Select
                value={selectedProspectId}
                onValueChange={setSelectedProspectId}
              >
                <SelectTrigger id="prospect-select" className="h-11 rounded-xl border-border">
                  <SelectValue placeholder="피드백 받을 가맹문의자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {prospects.map((p: Prospect) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleFeedback}
              disabled={feedbackMutation.isPending || !selectedProspectId}
              className="h-11 rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
            >
              {feedbackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 피드백
                </>
              )}
            </Button>
          </div>

          {/* 로딩 */}
          {feedbackMutation.isPending && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-[#faf9f7] py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#c47833]" />
              <span className="text-caption text-muted-foreground">
                AI가 상담 내용을 분석 중입니다...
              </span>
            </div>
          )}

          {/* 결과 */}
          {feedbackResult && !feedbackMutation.isPending && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/40 p-6">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-8">
                  {/* 점수 게이지 */}
                  <ScoreGauge score={feedbackResult.score} />

                  {/* 요약 정보 */}
                  <div className="flex-1 space-y-4">
                    <p className="text-center text-heading4 font-semibold text-foreground sm:text-left">
                      {feedbackResult.prospect_name}님 상담 피드백
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="mb-1 text-tiny font-semibold text-green-700">
                          잘한 점 ({feedbackResult.strengths.length})
                        </p>
                        <p className="text-tiny text-green-700">
                          {feedbackResult.strengths.length > 0
                            ? feedbackResult.strengths[0]
                            : "-"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="mb-1 text-tiny font-semibold text-amber-700">
                          개선할 점 ({feedbackResult.improvements.length})
                        </p>
                        <p className="text-tiny text-amber-700">
                          {feedbackResult.improvements.length > 0
                            ? feedbackResult.improvements[0]
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 잘한 점 */}
              {feedbackResult.strengths.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-caption font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                    잘한 점
                  </h3>
                  <div className="space-y-2">
                    {feedbackResult.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3"
                      >
                        <span className="mt-0.5 text-tiny font-semibold text-green-700">
                          {i + 1}.
                        </span>
                        <p className="text-caption text-green-700">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개선할 점 */}
              {feedbackResult.improvements.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-caption font-semibold text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    개선할 점
                  </h3>
                  <div className="space-y-2">
                    {feedbackResult.improvements.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3"
                      >
                        <span className="mt-0.5 text-tiny font-semibold text-amber-700">
                          {i + 1}.
                        </span>
                        <p className="text-caption text-amber-700">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 빠트린 항목 */}
              {feedbackResult.missed_items.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-caption font-semibold text-foreground">
                    <ClipboardCheck className="h-4 w-4 text-red-700" />
                    빠트린 항목
                  </h3>
                  <div className="space-y-2">
                    {feedbackResult.missed_items.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3"
                      >
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                        <p className="text-caption text-red-700">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 추천 스크립트 */}
              {feedbackResult.recommended_script && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-caption font-semibold text-foreground">
                    <MessageSquarePlus className="h-4 w-4 text-[#c47833]" />
                    추천 응대 스크립트
                  </h3>
                  <div className="rounded-xl border border-border/40 bg-[#faf9f7] p-5">
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{
                        __html: marked(
                          feedbackResult.recommended_script,
                        ) as string,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
