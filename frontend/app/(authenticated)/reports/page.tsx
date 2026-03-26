"use client";

import { useCallback, useMemo } from "react";
import {
  BarChart3,
  PieChartIcon,
  Download,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProspectMetrics, useStoreMetrics, useDashboardSummary } from "@/hooks/use-dashboard";
import { useProspects } from "@/hooks/use-prospects";
import { useImprovementTasks } from "@/hooks/use-improvement-tasks";

const WARM_COLORS = ["#c47833", "#d4a574", "#e8c9a0", "#8B7355", "#A0926B"];

// --- 공통 커스텀 Tooltip ---

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; fill?: string };
}

function ChartTooltip({
  active,
  payload,
  unit = "건",
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {data.payload.name || data.name}: {data.value}{unit}
      </p>
    </div>
  );
}

// --- 빈 상태 ---

function EmptyChart({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
        <Icon className="h-5 w-5 text-[#c47833]" />
      </div>
      <p className="text-caption text-muted-foreground">{message}</p>
    </div>
  );
}

// --- 로딩 ---

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <Skeleton className="h-40 w-40 rounded-full" />
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <div className="w-full space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

// --- 커스텀 Legend 렌더러 ---

function renderLegendText(value: string) {
  return <span className="text-caption text-muted-foreground">{value}</span>;
}

export default function ReportsPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: prospectMetrics, isLoading: prospectMetricsLoading } = useProspectMetrics();
  const { data: storeMetrics, isLoading: storeMetricsLoading } = useStoreMetrics();
  const { data: prospectsData, isLoading: prospectsLoading } = useProspects({ page: 1 });
  const { data: tasksData, isLoading: tasksLoading } = useImprovementTasks({ page: 1 });

  // 1. 월별 상담 건수 (현재 API는 월별 데이터를 반환하지 않으므로 전환 퍼널 데이터 활용)
  const funnelBarData = useMemo(() => {
    if (!prospectMetrics?.conversion_funnel) return [];
    const funnel = prospectMetrics.conversion_funnel;
    return [
      { name: "신규 문의", value: funnel.inquiry },
      { name: "상담중", value: funnel.consulting },
      { name: "현장방문", value: funnel.site_visit },
      { name: "성약", value: funnel.contract },
    ].filter((item) => item.value > 0 || true); // 0인 항목도 표시
  }, [prospectMetrics]);

  // 2. 상태별 문의 분포 PieChart
  const prospectPieData = useMemo(() => {
    if (!prospectMetrics?.prospects_by_status) return [];
    return Object.entries(prospectMetrics.prospects_by_status)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [prospectMetrics]);

  // 3. 점포별 미처리 과제 수 (tasks에서 store_name별 집계)
  const tasksByStoreData = useMemo(() => {
    if (!tasksData?.results) return [];
    const storeMap: Record<string, number> = {};
    for (const task of tasksData.results) {
      if (task.status === "미처리" || task.status === "진행중") {
        const storeName = task.store_name || "미지정";
        storeMap[storeName] = (storeMap[storeName] || 0) + 1;
      }
    }
    return Object.entries(storeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tasksData]);

  // 4. 카테고리별 개선 과제 분포 PieChart
  const tasksByCategoryData = useMemo(() => {
    if (!storeMetrics?.tasks_by_category) return [];
    return Object.entries(storeMetrics.tasks_by_category)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [storeMetrics]);

  const anyLoading =
    summaryLoading || prospectMetricsLoading || storeMetricsLoading || prospectsLoading || tasksLoading;

  const handleDownloadCSV = useCallback(() => {
    const rows: string[][] = [];

    rows.push(["=== 요약 ===", ""]);
    rows.push(["총 가맹문의", String(summary?.total_prospects || 0)]);
    rows.push(["이번 달 상담", String(summary?.consultation_count_this_month || 0)]);
    rows.push(["운영 점포", String(summary?.active_stores || 0)]);
    rows.push(["미처리 과제", String(summary?.pending_improvement_tasks || 0)]);
    rows.push([]);

    rows.push(["=== 상담 전환 퍼널 ===", ""]);
    rows.push(["단계", "건수"]);
    for (const item of funnelBarData) {
      rows.push([item.name, String(item.value)]);
    }
    rows.push([]);

    rows.push(["=== 상태별 문의 분포 ===", ""]);
    rows.push(["상태", "건수"]);
    for (const item of prospectPieData) {
      rows.push([item.name, String(item.value)]);
    }
    rows.push([]);

    rows.push(["=== 점포별 미처리 과제 ===", ""]);
    rows.push(["점포", "건수"]);
    for (const item of tasksByStoreData) {
      rows.push([item.name, String(item.value)]);
    }
    rows.push([]);

    rows.push(["=== 카테고리별 과제 분포 ===", ""]);
    rows.push(["카테고리", "건수"]);
    for (const item of tasksByCategoryData) {
      rows.push([item.name, String(item.value)]);
    }

    const bom = "\uFEFF";
    const csvContent = bom + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `리포트_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary, funnelBarData, prospectPieData, tasksByStoreData, tasksByCategoryData]);

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading1 text-foreground">분석 리포트</h1>
          <p className="mt-1 text-caption text-muted-foreground">
            가맹문의, 점포, 개선 과제의 현황을 한눈에 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl"
            disabled={anyLoading}
            variant="outline"
            onClick={handleDownloadCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV 다운로드
          </Button>
          <Button
            className="rounded-xl"
            disabled={anyLoading}
            variant="outline"
            onClick={handleDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF 다운로드
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-caption text-muted-foreground">총 가맹문의</p>
          {summaryLoading ? (
            <Skeleton className="mt-1 h-7 w-16 rounded" />
          ) : (
            <p className="mt-1 text-heading2 text-foreground">{summary?.total_prospects || 0}건</p>
          )}
        </div>
        <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-caption text-muted-foreground">이번 달 상담</p>
          {summaryLoading ? (
            <Skeleton className="mt-1 h-7 w-16 rounded" />
          ) : (
            <p className="mt-1 text-heading2 text-foreground">{summary?.consultation_count_this_month || 0}건</p>
          )}
        </div>
        <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-caption text-muted-foreground">운영 점포</p>
          {summaryLoading ? (
            <Skeleton className="mt-1 h-7 w-16 rounded" />
          ) : (
            <p className="mt-1 text-heading2 text-foreground">{summary?.active_stores || 0}개</p>
          )}
        </div>
        <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-caption text-muted-foreground">미처리 과제</p>
          {summaryLoading ? (
            <Skeleton className="mt-1 h-7 w-16 rounded" />
          ) : (
            <p className="mt-1 text-heading2 text-foreground">{summary?.pending_improvement_tasks || 0}건</p>
          )}
        </div>
      </div>

      {/* 차트 그리드 2x2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. 상담 전환 퍼널 (BarChart) */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <BarChart3 className="h-4 w-4 text-[#c47833]" />
              </div>
              <CardTitle className="text-heading3 text-foreground">상담 전환 퍼널</CardTitle>
            </div>
            <p className="text-caption text-muted-foreground">
              가맹문의 단계별 전환 현황
            </p>
          </CardHeader>
          <CardContent>
            {prospectMetricsLoading ? (
              <BarChartSkeleton />
            ) : funnelBarData.length === 0 ? (
              <EmptyChart icon={MessageSquare} message="문의 데이터가 없습니다." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelBarData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#6B6B6B" }}
                      axisLine={{ stroke: "#e8e4dc" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#949494" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#faf9f7" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {funnelBarData.map((_, index) => (
                        <Cell
                          key={`funnel-${index}`}
                          fill={WARM_COLORS[index % WARM_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 상태별 문의 분포 (PieChart) */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <PieChartIcon className="h-4 w-4 text-[#c47833]" />
              </div>
              <CardTitle className="text-heading3 text-foreground">상태별 문의 분포</CardTitle>
            </div>
            <p className="text-caption text-muted-foreground">
              가맹문의자 상태(신규/상담중/보류/성약/종료)별 비율
            </p>
          </CardHeader>
          <CardContent>
            {prospectMetricsLoading ? (
              <ChartSkeleton />
            ) : prospectPieData.length === 0 ? (
              <EmptyChart icon={MessageSquare} message="문의 데이터가 없습니다." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prospectPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {prospectPieData.map((_, index) => (
                        <Cell
                          key={`prospect-pie-${index}`}
                          fill={WARM_COLORS[index % WARM_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={renderLegendText}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. 점포별 미처리 과제 수 (BarChart) */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <ListChecks className="h-4 w-4 text-[#c47833]" />
              </div>
              <CardTitle className="text-heading3 text-foreground">점포별 미처리 과제</CardTitle>
            </div>
            <p className="text-caption text-muted-foreground">
              점포별 미처리/진행중 개선 과제 현황
            </p>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <BarChartSkeleton />
            ) : tasksByStoreData.length === 0 ? (
              <EmptyChart icon={ListChecks} message="미처리 과제가 없습니다." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tasksByStoreData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "#949494" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 12, fill: "#6B6B6B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#faf9f7" }} />
                    <Bar dataKey="value" fill="#8B7355" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. 카테고리별 개선 과제 분포 (PieChart) */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <PieChartIcon className="h-4 w-4 text-[#c47833]" />
              </div>
              <CardTitle className="text-heading3 text-foreground">카테고리별 과제 분포</CardTitle>
            </div>
            <p className="text-caption text-muted-foreground">
              개선 과제 카테고리(품질/위생/매출/운영/기타)별 비율
            </p>
          </CardHeader>
          <CardContent>
            {storeMetricsLoading ? (
              <ChartSkeleton />
            ) : tasksByCategoryData.length === 0 ? (
              <EmptyChart icon={ListChecks} message="개선 과제 데이터가 없습니다." />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksByCategoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {tasksByCategoryData.map((_, index) => (
                        <Cell
                          key={`category-pie-${index}`}
                          fill={WARM_COLORS[index % WARM_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={renderLegendText}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
