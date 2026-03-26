"use client";

import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupervisorPerformance } from "@/hooks/use-supervisors";

// 프로그레스 바 색상: 80%+ 녹색, 50-79% 노랑, 50% 미만 빨강
function getProgressColor(value: number): string {
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressBgColor(value: number): string {
  if (value >= 80) return "bg-green-100";
  if (value >= 50) return "bg-amber-100";
  return "bg-red-100";
}

// 인라인 프로그레스 바
function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className={`h-2 w-full rounded-full ${getProgressBgColor(clamped)}`}>
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="min-w-[40px] text-right text-caption2 font-medium text-foreground">
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

// 통계 카드
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-caption text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg" />
            ) : (
              <p className="text-[28px] font-bold leading-none text-foreground">
                {value}
                {suffix && (
                  <span className="ml-1 text-heading4 font-medium text-muted-foreground">
                    {suffix}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a574]/10">
            <Icon className="h-5 w-5 text-[#c47833]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupervisorsPage() {
  const { data, isLoading } = useSupervisorPerformance();
  const router = useRouter();

  const summary = data?.summary;
  const supervisors = data?.supervisors || [];

  // 우수 성과자 기준: 점검률 80% 이상 + 과제 완료율 70% 이상
  const isTopPerformer = (sv: (typeof supervisors)[0]) =>
    sv.inspection_rate >= 80 && sv.task_completion_rate >= 70;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-heading1 text-foreground">SV 성과 대시보드</h1>
        <p className="mt-1 text-caption2 text-muted-foreground">
          슈퍼바이저별 점검 및 과제 처리 성과를 비교합니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="총 슈퍼바이저"
          value={summary?.total_supervisors || 0}
          suffix="명"
          isLoading={isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          label="평균 점검률"
          value={summary?.avg_inspection_rate?.toFixed(1) || "0"}
          suffix="%"
          isLoading={isLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="평균 과제 완료율"
          value={summary?.avg_task_completion_rate?.toFixed(1) || "0"}
          suffix="%"
          isLoading={isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label="미점검 점포"
          value={summary?.total_uninspected_stores || 0}
          suffix="개"
          isLoading={isLoading}
        />
      </div>

      {/* 성과 비교 테이블 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <TrendingUp className="h-5 w-5 text-[#c47833]" />
            슈퍼바이저 성과 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : supervisors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <Users className="h-6 w-6 text-[#c47833]" />
              </div>
              <p className="text-caption text-muted-foreground">
                등록된 슈퍼바이저가 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    이름
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    담당 점포
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    이번달 점검
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground min-w-[160px]">
                    점검률
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground min-w-[160px]">
                    과제 완료율
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    평균 건강도
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    미처리 과제
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map((sv) => (
                  <TableRow
                    key={sv.id}
                    className={`border-border/40 transition-colors cursor-pointer ${
                      isTopPerformer(sv)
                        ? "bg-[#c47833]/5 hover:bg-[#c47833]/10"
                        : "hover:bg-[#faf9f7]"
                    }`}
                    onClick={() => router.push(`/supervisors/${sv.id}`)}
                  >
                    <TableCell className="text-caption2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {sv.name}
                        {isTopPerformer(sv) && (
                          <span className="inline-flex items-center rounded-md bg-[#c47833]/10 px-2 py-0.5 text-tiny font-medium text-[#c47833]">
                            우수
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-caption2 text-foreground">
                      {sv.store_count}개
                    </TableCell>
                    <TableCell className="text-center text-caption2 text-foreground">
                      {sv.inspections_this_month}건
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={sv.inspection_rate} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={sv.task_completion_rate} />
                    </TableCell>
                    <TableCell className="text-center text-caption2 font-medium text-foreground">
                      {sv.avg_health_score > 0 ? `${sv.avg_health_score}점` : "-"}
                    </TableCell>
                    <TableCell className="text-center text-caption2">
                      {sv.overdue_tasks > 0 ? (
                        <span className="font-medium text-red-600">
                          {sv.overdue_tasks}건
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0건</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 레이더 차트 영역 — recharts가 설치되지 않은 경우 바 차트로 대체 */}
      {supervisors.length > 0 && (
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading4 text-foreground">
              성과 비교 차트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supervisors.map((sv) => (
                <div key={sv.id} className="space-y-2">
                  <p className="text-caption2 font-medium text-foreground">
                    {sv.name}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-tiny text-muted-foreground">점검률</p>
                      <div className={`h-3 rounded-full ${getProgressBgColor(sv.inspection_rate)}`}>
                        <div
                          className={`h-3 rounded-full transition-all ${getProgressColor(sv.inspection_rate)}`}
                          style={{ width: `${Math.min(sv.inspection_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-tiny text-muted-foreground">과제 완료율</p>
                      <div className={`h-3 rounded-full ${getProgressBgColor(sv.task_completion_rate)}`}>
                        <div
                          className={`h-3 rounded-full transition-all ${getProgressColor(sv.task_completion_rate)}`}
                          style={{ width: `${Math.min(sv.task_completion_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-tiny text-muted-foreground">건강도</p>
                      <div className={`h-3 rounded-full ${getProgressBgColor(sv.avg_health_score)}`}>
                        <div
                          className={`h-3 rounded-full transition-all ${getProgressColor(sv.avg_health_score)}`}
                          style={{ width: `${Math.min(sv.avg_health_score, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
