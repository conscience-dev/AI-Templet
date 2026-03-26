"use client";

import { useMemo } from "react";
import {
  Store,
  ClipboardCheck,
  ListTodo,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupervisorSummary } from "@/hooks/use-dashboard";
import { StatCard } from "./stat-card";

const HEALTH_COLORS: Record<string, string> = {
  good: "#009E03",
  warning: "#F57F17",
  bad: "#F0635C",
  unknown: "#949494",
};

function getHealthColor(score: number): string {
  if (score < 0) return HEALTH_COLORS.unknown;
  if (score >= 80) return HEALTH_COLORS.good;
  if (score >= 50) return HEALTH_COLORS.warning;
  return HEALTH_COLORS.bad;
}

interface HealthTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { store_name: string; score: number };
  }>;
}

function HealthTooltip({ active, payload }: HealthTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {d.store_name}: {d.score < 0 ? "미점검" : `${d.score}점`}
      </p>
    </div>
  );
}

export function SupervisorDashboard() {
  const { data, isLoading } = useSupervisorSummary();

  const healthData = useMemo(() => {
    if (!data?.store_health) return [];
    return data.store_health.map((s) => ({
      ...s,
      displayScore: s.score < 0 ? 0 : s.score,
      fill: getHealthColor(s.score),
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Store}
          label="내 담당 점포"
          value={data?.my_stores ?? 0}
          suffix="개"
          isLoading={isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          label="이번달 점검"
          value={data?.inspections_this_month ?? 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={ListTodo}
          label="미처리 과제"
          value={data?.pending_tasks ?? 0}
          suffix="건"
          isLoading={isLoading}
        />
      </div>

      {/* 방문 필요 + 긴급 과제 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 방문 필요 점포 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c47833]" />
              <CardTitle className="text-heading4 text-foreground">
                방문 필요 점포
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : !data?.stores_needing_visit?.length ? (
              <p className="py-6 text-center text-caption text-muted-foreground">
                방문이 필요한 점포가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {data.stores_needing_visit.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[#faf9f7]"
                  >
                    <div>
                      <p className="text-caption font-medium text-foreground">
                        {s.store_name}
                      </p>
                      <p className="text-tiny text-muted-foreground">
                        {s.last_inspection
                          ? `마지막 점검: ${new Date(s.last_inspection).toLocaleDateString("ko-KR")}`
                          : "점검 기록 없음"}
                      </p>
                    </div>
                    <Badge
                      className={`rounded-xl ${
                        s.days_since >= 30
                          ? "bg-red-50 text-red-700 hover:bg-red-50"
                          : s.days_since >= 14
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                            : "bg-green-50 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {s.days_since >= 999 ? "미방문" : `${s.days_since}일 전`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 긴급 과제 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#c47833]" />
              <CardTitle className="text-heading4 text-foreground">
                긴급 과제
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : !data?.urgent_tasks?.length ? (
              <p className="py-6 text-center text-caption text-muted-foreground">
                긴급 과제가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {data.urgent_tasks.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-2.5 transition-colors hover:bg-[#faf9f7]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-caption font-medium text-foreground">
                          {t.store_name}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-tiny text-muted-foreground">
                          {t.task_description}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-col items-end gap-1">
                        <Badge
                          className={`rounded-xl ${
                            t.priority === "높음"
                              ? "bg-red-50 text-red-700 hover:bg-red-50"
                              : t.priority === "중간"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                : "bg-[#f5f3ef] text-muted-foreground hover:bg-[#f5f3ef]"
                          }`}
                        >
                          {t.priority}
                        </Badge>
                        {t.is_overdue && (
                          <span className="text-tiny font-medium text-red-700">
                            기한 초과
                          </span>
                        )}
                      </div>
                    </div>
                    {t.due_date && (
                      <p className="mt-1 text-tiny text-muted-foreground">
                        기한: {new Date(t.due_date).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 점포별 건강도 차트 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-heading4 text-foreground">
            점포별 건강도
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="w-full space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            </div>
          ) : healthData.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                <Store className="h-5 w-5 text-[#c47833]" />
              </div>
              <p className="text-caption text-muted-foreground">
                담당 점포가 없습니다.
              </p>
            </div>
          ) : (
            <div
              className="w-full"
              style={{ height: Math.max(200, healthData.length * 40 + 40) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={healthData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8e4dc"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#949494" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="store_name"
                    width={100}
                    tick={{ fontSize: 12, fill: "#6B6B6B" }}
                  />
                  <Tooltip
                    content={<HealthTooltip />}
                    cursor={{ fill: "#faf9f7" }}
                  />
                  <Bar
                    dataKey="displayScore"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* 범례 */}
          {healthData.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#009E03]" />
                <span className="text-tiny text-muted-foreground">양호 (80+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#F57F17]" />
                <span className="text-tiny text-muted-foreground">주의 (50-79)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#F0635C]" />
                <span className="text-tiny text-muted-foreground">미흡 (0-49)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#949494]" />
                <span className="text-tiny text-muted-foreground">미점검</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
