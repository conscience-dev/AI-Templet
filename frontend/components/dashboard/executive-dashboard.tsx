"use client";

import { useMemo } from "react";
import {
  Users,
  Store,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutiveSummary } from "@/hooks/use-dashboard";
import { StatCard } from "./stat-card";

const WARM_COLORS = ["#c47833", "#d4a574", "#e8c9a0", "#8B7355", "#A0926B"];

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { channel: string; count: number; conversion_rate: number };
  }>;
}

function ChannelTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {d.channel}: {d.count}건 (전환율 {d.conversion_rate}%)
      </p>
    </div>
  );
}

export function ExecutiveDashboard() {
  const { data, isLoading } = useExecutiveSummary();

  const channelData = useMemo(() => {
    if (!data?.channel_performance) return [];
    return data.channel_performance.map((c, i) => ({
      ...c,
      fill: WARM_COLORS[i % WARM_COLORS.length],
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="총 가맹문의"
          value={data?.total_prospects ?? 0}
          suffix="건"
          isLoading={isLoading}
          change={data?.monthly_comparison.prospects_change}
        />
        <StatCard
          icon={Store}
          label="총 점포 수"
          value={data?.total_stores ?? 0}
          suffix="개"
          isLoading={isLoading}
          change={data?.monthly_comparison.stores_change}
        />
        <StatCard
          icon={TrendingUp}
          label="전환율"
          value={data?.conversion_rate?.toFixed(1) ?? "0"}
          suffix="%"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingDown}
          label="이탈율"
          value={data?.churn_rate?.toFixed(1) ?? "0"}
          suffix="%"
          isLoading={isLoading}
        />
      </div>

      {/* 차트 + 리스트 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 채널별 성과 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">
              채널별 문의 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[260px] items-center justify-center">
                <div className="w-full space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded" />
                  ))}
                </div>
              </div>
            ) : channelData.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <Users className="h-5 w-5 text-[#c47833]" />
                </div>
                <p className="text-caption text-muted-foreground">
                  채널 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={channelData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e8e4dc"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "#949494" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="channel"
                      width={80}
                      tick={{ fontSize: 12, fill: "#6B6B6B" }}
                    />
                    <Tooltip
                      content={<ChannelTooltip />}
                      cursor={{ fill: "#faf9f7" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#c47833"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 전월 대비 변화 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">
              전월 대비 변화
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <MonthlyChangeRow
                  label="신규 문의"
                  change={data?.monthly_comparison.prospects_change ?? 0}
                  unit="건"
                />
                <MonthlyChangeRow
                  label="신규 점포"
                  change={data?.monthly_comparison.stores_change ?? 0}
                  unit="개"
                />
                <MonthlyChangeRow
                  label="개선 과제"
                  change={data?.monthly_comparison.tasks_change ?? 0}
                  unit="건"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 우수 점포 + 위험 점포 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 우수 점포 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#c47833]" />
              <CardTitle className="text-heading4 text-foreground">
                우수 점포
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : !data?.top_performing_stores?.length ? (
              <p className="py-4 text-center text-caption text-muted-foreground">
                점검 데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {data.top_performing_stores.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-[#faf9f7]"
                  >
                    <span className="text-caption font-medium text-foreground">
                      {s.store_name}
                    </span>
                    <Badge className="rounded-xl bg-green-50 text-green-700 hover:bg-green-50">
                      {s.health_score}점
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 위험 점포 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#c47833]" />
              <CardTitle className="text-heading4 text-foreground">
                주의 필요 점포
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : !data?.risk_stores?.length ? (
              <p className="py-4 text-center text-caption text-muted-foreground">
                주의가 필요한 점포가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {data.risk_stores.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-[#faf9f7]"
                  >
                    <div>
                      <span className="text-caption font-medium text-foreground">
                        {s.store_name}
                      </span>
                      <p className="text-tiny text-muted-foreground">
                        {s.reason}
                      </p>
                    </div>
                    <Badge
                      className={`rounded-xl ${
                        s.risk_level === "높음"
                          ? "bg-red-50 text-red-700 hover:bg-red-50"
                          : s.risk_level === "중간"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                            : "bg-[#f5f3ef] text-muted-foreground hover:bg-[#f5f3ef]"
                      }`}
                    >
                      {s.risk_level}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MonthlyChangeRow({
  label,
  change,
  unit,
}: {
  label: string;
  change: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[#faf9f7]">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span
        className={`text-caption font-medium ${
          change > 0
            ? "text-green-700"
            : change < 0
              ? "text-red-700"
              : "text-muted-foreground"
        }`}
      >
        {change > 0 ? "+" : ""}
        {change}
        {unit}
        {change !== 0 && (
          <span className="ml-1">
            {change > 0 ? (
              <TrendingUp className="mb-0.5 inline h-3 w-3" />
            ) : (
              <TrendingDown className="mb-0.5 inline h-3 w-3" />
            )}
          </span>
        )}
      </span>
    </div>
  );
}
