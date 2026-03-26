"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  ClipboardCheck,
  ListTodo,
  Calendar,
  AlertTriangle,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupervisorDetail } from "@/hooks/use-supervisors";

// 건강도 색상
function getHealthColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getHealthBg(score: number): string {
  if (score >= 80) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

// 프로그레스 바
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-6 w-full rounded-lg bg-[#f5f3ef]">
      <div
        className={`h-6 rounded-lg transition-all ${color || "bg-[#c47833]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// 통계 카드
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-tiny text-muted-foreground">{label}</p>
            <p className="text-[22px] font-bold leading-none text-foreground">
              {value}
              {suffix && (
                <span className="ml-1 text-caption font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a574]/10">
            <Icon className="h-4 w-4 text-[#c47833]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupervisorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supervisorId = params.id as string;
  const { data, isLoading } = useSupervisorDetail(supervisorId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-caption text-muted-foreground">
          슈퍼바이저 정보를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const { supervisor, stores, monthly_inspections, task_stats, category_stats } =
    data;

  const maxMonthlyCount = Math.max(
    ...monthly_inspections.map((m) => m.count),
    1,
  );

  const taskCompletionRate =
    task_stats.total > 0
      ? ((task_stats.completed / task_stats.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/supervisors")}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-heading1 text-foreground">
            {supervisor.name}
          </h1>
          <p className="mt-1 text-caption2 text-muted-foreground">
            슈퍼바이저 성과 상세
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Store}
          label="담당 점포"
          value={stores.length}
          suffix="개"
        />
        <StatCard
          icon={ListTodo}
          label="전체 과제"
          value={task_stats.total}
          suffix="건"
        />
        <StatCard
          icon={ClipboardCheck}
          label="과제 완료율"
          value={taskCompletionRate}
          suffix="%"
        />
        <StatCard
          icon={AlertTriangle}
          label="미처리 과제"
          value={task_stats.pending}
          suffix="건"
        />
      </div>

      {/* 담당 점포 목록 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
            <Store className="h-5 w-5 text-[#c47833]" />
            담당 점포 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-caption text-muted-foreground">
                담당 점포가 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    점포명
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    지역
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    상태
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    건강도
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    최근 점검일
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-center text-caption text-muted-foreground">
                    미처리 과제
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow
                    key={store.id}
                    className="border-border/40 cursor-pointer transition-colors hover:bg-[#faf9f7]"
                    onClick={() => router.push(`/stores/${store.id}`)}
                  >
                    <TableCell className="text-caption2 font-medium text-foreground">
                      {store.store_name}
                    </TableCell>
                    <TableCell className="text-caption2 text-muted-foreground">
                      {store.region}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-tiny font-medium ${
                          store.status === "운영중"
                            ? "bg-green-50 text-green-700"
                            : store.status === "휴점"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-[#f5f3ef] text-muted-foreground"
                        }`}
                      >
                        {store.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {store.health_score > 0 ? (
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-tiny font-medium ${getHealthBg(store.health_score)} ${getHealthColor(store.health_score)}`}
                        >
                          {store.health_score}점
                        </span>
                      ) : (
                        <span className="text-tiny text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-caption2 text-muted-foreground">
                      {store.last_inspection_date
                        ? new Date(
                            store.last_inspection_date,
                          ).toLocaleDateString("ko-KR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center text-caption2">
                      {store.pending_tasks > 0 ? (
                        <span className="font-medium text-red-600">
                          {store.pending_tasks}건
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

      {/* 하단 2열 레이아웃 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 월별 점검 추이 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
              <Calendar className="h-5 w-5 text-[#c47833]" />
              월별 점검 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthly_inspections.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-caption2 text-muted-foreground">
                    {m.month}
                  </span>
                  <div className="flex-1">
                    <ProgressBar
                      value={m.count}
                      max={maxMonthlyCount}
                    />
                  </div>
                  <span className="w-10 text-right text-caption2 font-medium text-foreground">
                    {m.count}건
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 카테고리별 과제 처리 현황 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-heading4 text-foreground">
              <ListTodo className="h-5 w-5 text-[#c47833]" />
              카테고리별 과제 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category_stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-caption text-muted-foreground">
                  과제 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {category_stats.map((cat) => {
                  const completionPct =
                    cat.total > 0
                      ? Math.round((cat.completed / cat.total) * 100)
                      : 0;
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-caption2 font-medium text-foreground">
                          {cat.category}
                        </span>
                        <span className="text-tiny text-muted-foreground">
                          {cat.completed}/{cat.total}건 완료 ({completionPct}%)
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#f5f3ef]">
                        <div
                          className="h-3 rounded-full bg-[#c47833] transition-all"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* 과제 상태 요약 */}
                <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-[#faf9f7] p-4">
                  <div className="text-center">
                    <p className="text-[18px] font-bold text-green-600">
                      {task_stats.completed}
                    </p>
                    <p className="text-tiny text-muted-foreground">완료</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-bold text-amber-600">
                      {task_stats.in_progress}
                    </p>
                    <p className="text-tiny text-muted-foreground">진행중</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] font-bold text-red-600">
                      {task_stats.pending}
                    </p>
                    <p className="text-tiny text-muted-foreground">미처리</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
