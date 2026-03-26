"use client";

import { useMemo } from "react";
import { Users, MessageSquare, TrendingUp, UserCheck } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDevSummary } from "@/hooks/use-dashboard";
import { StatCard } from "./stat-card";

const WARM_COLORS = ["#c47833", "#d4a574", "#e8c9a0", "#8B7355", "#A0926B"];

const RESULT_BADGE_MAP: Record<string, string> = {
  "긍정": "bg-green-50 text-green-700 hover:bg-green-50",
  "보통": "bg-blue-50 text-blue-700 hover:bg-blue-50",
  "부정": "bg-red-50 text-red-700 hover:bg-red-50",
  "종료": "bg-[#f5f3ef] text-muted-foreground hover:bg-[#f5f3ef]",
};

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
  }>;
}

function StatusPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-caption font-medium text-foreground">
        {payload[0].name}: {payload[0].value}건
      </p>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { channel: string; count: number; conversion_rate: number };
  }>;
}

function ChannelBarTooltip({ active, payload }: BarTooltipProps) {
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

export function DevDashboard() {
  const { data, isLoading } = useDevSummary();

  const statusPieData = useMemo(() => {
    if (!data?.prospects_by_status) return [];
    return Object.entries(data.prospects_by_status)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [data]);

  const channelData = useMemo(() => {
    if (!data?.channel_stats) return [];
    return data.channel_stats;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="활성 문의자"
          value={data?.active_prospects ?? 0}
          suffix="명"
          isLoading={isLoading}
        />
        <StatCard
          icon={MessageSquare}
          label="이번달 상담"
          value={data?.consultations_this_month ?? 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="전환율"
          value={data?.conversion_rate?.toFixed(1) ?? "0"}
          suffix="%"
          isLoading={isLoading}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 상태별 문의 파이차트 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">
              상태별 문의 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[260px] items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : statusPieData.length === 0 ? (
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
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={WARM_COLORS[index % WARM_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-caption text-muted-foreground">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 채널별 전환율 */}
        <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading4 text-foreground">
              채널별 전환율
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
                      content={<ChannelBarTooltip />}
                      cursor={{ fill: "#faf9f7" }}
                    />
                    <Bar
                      dataKey="conversion_rate"
                      fill="#c47833"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                      name="전환율(%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 상담 목록 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-heading4 text-foreground">
            최근 상담 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : !data?.recent_consultations?.length ? (
            <p className="py-6 text-center text-caption text-muted-foreground">
              상담 내역이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-caption">문의자</TableHead>
                  <TableHead className="text-caption">상담자</TableHead>
                  <TableHead className="text-caption">일자</TableHead>
                  <TableHead className="text-caption">결과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_consultations.map((c, i) => (
                  <TableRow key={i} className="transition-colors hover:bg-[#faf9f7]">
                    <TableCell className="text-caption font-medium text-foreground">
                      {c.prospect_name}
                    </TableCell>
                    <TableCell className="text-caption text-muted-foreground">
                      {c.consultant}
                    </TableCell>
                    <TableCell className="text-caption text-muted-foreground">
                      {c.date ? new Date(c.date).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-xl ${RESULT_BADGE_MAP[c.result] || "bg-[#f5f3ef] text-muted-foreground hover:bg-[#f5f3ef]"}`}
                      >
                        {c.result}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 상담자별 성과 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#c47833]" />
            <CardTitle className="text-heading4 text-foreground">
              상담자별 성과
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : !data?.consultant_performance?.length ? (
            <p className="py-6 text-center text-caption text-muted-foreground">
              상담 데이터가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-caption">상담자</TableHead>
                  <TableHead className="text-caption text-right">상담 수</TableHead>
                  <TableHead className="text-caption text-right">성약 수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.consultant_performance.map((cp, i) => (
                  <TableRow key={i} className="transition-colors hover:bg-[#faf9f7]">
                    <TableCell className="text-caption font-medium text-foreground">
                      {cp.name || "-"}
                    </TableCell>
                    <TableCell className="text-caption text-right text-muted-foreground">
                      {cp.consultations}건
                    </TableCell>
                    <TableCell className="text-caption text-right text-muted-foreground">
                      {cp.conversions}건
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
