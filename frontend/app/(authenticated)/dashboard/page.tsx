"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  MessageSquare,
  FileCheck,
  Store,
  ListTodo,
  Calendar,
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-auth";
import { useDashboardSummary, useProspectMetrics, useStoreMetrics } from "@/hooks/use-dashboard";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { DevDashboard } from "@/components/dashboard/dev-dashboard";
import { SupervisorDashboard } from "@/components/dashboard/supervisor-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";

const WARM_COLORS = ["#c47833", "#d4a574", "#e8c9a0", "#8B7355", "#A0926B"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { name: string; value: number; fill?: string };
  }>;
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {data.name}: {data.value}건
      </p>
    </div>
  );
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {data.payload.name}: {data.value}건
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useMe();

  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
    );
  }, []);

  // 역할별 대시보드 타이틀
  const dashboardTitle = useMemo(() => {
    switch (user?.department) {
      case "executive":
      case "admin":
        return "경영진 대시보드";
      case "dev":
        return "점포개발팀 대시보드";
      case "supervisor":
        return "슈퍼바이저 대시보드";
      default:
        return "대시보드";
    }
  }, [user?.department]);

  // 역할별 대시보드 컴포넌트
  const renderDashboard = () => {
    if (userLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="p-6">
                <Skeleton className="mb-3 h-4 w-24 rounded" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (user?.department === "executive" || user?.department === "admin") {
      return <ExecutiveDashboard />;
    }
    if (user?.department === "dev") {
      return <DevDashboard />;
    }
    if (user?.department === "supervisor") {
      return <SupervisorDashboard />;
    }

    return <DefaultDashboard />;
  };

  return (
    <div className="space-y-6">
      {/* 상단 인사 */}
      <div>
        {userLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-5 w-40 rounded-lg" />
          </div>
        ) : (
          <>
            <h1 className="text-heading1 text-foreground">
              안녕하세요, {user?.name || "사용자"}님
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-caption text-muted-foreground">{today}</p>
              {user?.department && (
                <span className="rounded-xl bg-[#d4a574]/10 px-2.5 py-0.5 text-tiny font-medium text-[#c47833]">
                  {dashboardTitle}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {renderDashboard()}
    </div>
  );
}

/** 기본 대시보드 (부서 미지정 사용자용) */
function DefaultDashboard() {
  const { data, isLoading } = useDashboardSummary();
  const { data: prospectMetrics, isLoading: prospectLoading } = useProspectMetrics();
  const { data: storeMetrics, isLoading: storeLoading } = useStoreMetrics();

  const consultingCount = data
    ? data.total_prospects - (data.new_prospects_this_month || 0)
    : 0;

  const prospectPieData = useMemo(() => {
    if (!prospectMetrics?.prospects_by_status) return [];
    const statusMap = prospectMetrics.prospects_by_status;
    return Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [prospectMetrics]);

  const monthlyBarData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "신규 문의", value: data.new_prospects_this_month || 0 },
      { name: "상담", value: data.consultation_count_this_month || 0 },
      { name: "점검", value: data.monthly_inspections || 0 },
      { name: "미처리 과제", value: data.pending_improvement_tasks || 0 },
    ];
  }, [data]);

  const chartsLoading = prospectLoading || storeLoading || isLoading;

  return (
    <>
      {/* 핵심 지표 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Users}
          label="총 가맹문의"
          value={data?.total_prospects || 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={MessageSquare}
          label="상담중"
          value={consultingCount > 0 ? consultingCount : 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={FileCheck}
          label="성약"
          value={data?.prospect_conversion_rate ? Math.round(data.prospect_conversion_rate) : 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={Store}
          label="점포 수"
          value={data?.total_stores || 0}
          suffix="개"
          isLoading={isLoading}
        />
        <StatCard
          icon={ListTodo}
          label="미처리 과제"
          value={data?.pending_improvement_tasks || 0}
          suffix="건"
          isLoading={isLoading}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 상태별 문의 분포 PieChart */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">상태별 문의 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="flex h-[260px] items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : prospectPieData.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <Users className="h-5 w-5 text-[#c47833]" />
                </div>
                <p className="text-caption text-muted-foreground">
                  등록된 문의 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prospectPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {prospectPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={WARM_COLORS[index % WARM_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-caption text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이번 달 현황 BarChart */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">이번 달 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="flex h-[260px] items-center justify-center">
                <div className="space-y-3 w-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded" />
                  ))}
                </div>
              </div>
            ) : monthlyBarData.every((d) => d.value === 0) ? (
              <div className="flex h-[260px] flex-col items-center justify-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <Calendar className="h-5 w-5 text-[#c47833]" />
                </div>
                <p className="text-caption text-muted-foreground">
                  이번 달 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e8e4dc"
                      horizontal={false}
                    />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#949494" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 12, fill: "#6B6B6B" }}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#faf9f7" }} />
                    <Bar dataKey="value" fill="#c47833" radius={[0, 6, 6, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 추가 지표 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">이번 달 상세</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">신규 문의</span>
                  <span className="text-caption font-medium text-foreground">{data?.new_prospects_this_month || 0}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">상담 건수</span>
                  <span className="text-caption font-medium text-foreground">{data?.consultation_count_this_month || 0}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">점검 완료</span>
                  <span className="text-caption font-medium text-foreground">{data?.monthly_inspections || 0}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">지연 과제</span>
                  <span className="text-caption font-medium text-foreground">{data?.overdue_tasks || 0}건</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">점포 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">전체 점포</span>
                  <span className="text-caption font-medium text-foreground">{data?.total_stores || 0}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">운영중</span>
                  <span className="text-caption font-medium text-foreground">{data?.active_stores || 0}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">성약률</span>
                  <span className="text-caption font-medium text-foreground">{data?.prospect_conversion_rate?.toFixed(1) || "0"}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">개선 과제</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">미처리</span>
                  <span className="text-caption font-medium text-foreground">{data?.pending_improvement_tasks || 0}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground">지연</span>
                  <span className="text-caption font-medium text-foreground">{data?.overdue_tasks || 0}건</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 빈 상태를 위한 안내 */}
      {!isLoading && data && data.total_prospects === 0 && data.total_stores === 0 && (
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
              <Calendar className="h-6 w-6 text-[#c47833]" />
            </div>
            <p className="text-caption text-muted-foreground">
              아직 등록된 데이터가 없습니다. 가맹문의자나 점포를 등록해보세요.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
