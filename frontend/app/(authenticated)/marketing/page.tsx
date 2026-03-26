"use client";

import {
  TrendingUp,
  Users,
  Target,
  Radio,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

import {
  useMarketingSummary,
  useChannelStats,
  useRegionStats,
  useBudgetStats,
  useMonthlyTrend,
} from "@/hooks/use-marketing";

// 테라코타 계열 + 시맨틱 컬러
const CHART_COLORS = [
  "#c47833",
  "#d4a574",
  "#8B6914",
  "#b06a2a",
  "#a0845c",
  "#d4956b",
];

const FUNNEL_COLORS = {
  total: "#d4a574",
  consulting: "#c47833",
  contracted: "#009E03",
};

export default function MarketingPage() {
  const { data: summary, isLoading: summaryLoading } = useMarketingSummary();
  const { data: channelData, isLoading: channelLoading } = useChannelStats();
  const { data: regionData, isLoading: regionLoading } = useRegionStats();
  const { data: budgetData, isLoading: budgetLoading } = useBudgetStats();
  const { data: trendData, isLoading: trendLoading } = useMonthlyTrend();

  const isLoading =
    summaryLoading || channelLoading || regionLoading || budgetLoading || trendLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c47833]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-heading1 text-foreground">마케팅 성과 분석</h1>
        <p className="mt-1 text-bodymedium text-muted-foreground">
          채널별 유입 고객 추적 및 전환율 분석
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Users}
          label="총 유입"
          value={summary?.total_prospects ?? 0}
          suffix="명"
        />
        <SummaryCard
          icon={TrendingUp}
          label="이번달 유입"
          value={summary?.this_month_prospects ?? 0}
          suffix="명"
        />
        <SummaryCard
          icon={Target}
          label="전체 전환율"
          value={summary?.conversion_rate ?? 0}
          suffix="%"
        />
        <SummaryCard
          icon={Radio}
          label="유입 채널"
          value={summary?.channel_count ?? 0}
          suffix="개"
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 채널별 전환 퍼널 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading4 text-foreground">채널별 전환 퍼널</h2>
          <div className="h-[300px]">
            {channelData?.channels && channelData.channels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={channelData.channels}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" />
                  <XAxis type="number" tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                  <YAxis
                    dataKey="channel"
                    type="category"
                    tick={{ fill: "#3D3D3D", fontSize: 13 }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E4E4E4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="유입" fill={FUNNEL_COLORS.total} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="consulting" name="상담" fill={FUNNEL_COLORS.consulting} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="contracted" name="성약" fill={FUNNEL_COLORS.contracted} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 채널별 전환율 도넛 차트 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading4 text-foreground">채널별 유입 비율</h2>
          <div className="h-[300px]">
            {channelData?.channels && channelData.channels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData.channels}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="total"
                    nameKey="channel"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={((props: any) =>
                      `${props.channel} ${((props.percent as number) * 100).toFixed(0)}%`
                    ) as any}
                    labelLine={{ stroke: "#949494" }}
                  >
                    {channelData.channels.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E4E4E4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [`${value}명`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 지역별 분포 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading4 text-foreground">지역별 유입 분포</h2>
          <div className="h-[300px]">
            {regionData?.regions && regionData.regions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionData.regions}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" />
                  <XAxis type="number" tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                  <YAxis
                    dataKey="region"
                    type="category"
                    tick={{ fill: "#3D3D3D", fontSize: 13 }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E4E4E4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      if (name === "avg_budget") return [`${Number(value).toLocaleString()}만원`, "평균 예산"];
                      return [`${value}명`, name === "total" ? "유입" : "성약"];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="유입" fill="#d4a574" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="contracted" name="성약" fill="#009E03" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 예산 구간별 분포 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading4 text-foreground">예산 구간별 분포</h2>
          <div className="h-[300px]">
            {budgetData?.ranges && budgetData.ranges.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetData.ranges}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "#3D3D3D", fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E4E4E4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `${value}명`,
                      name === "total" ? "유입" : "성약",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="total" name="유입" fill="#c47833" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="contracted" name="성약" fill="#009E03" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 월별 추이 — 전체 너비 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2">
          <h2 className="mb-4 text-heading4 text-foreground">월별 유입/전환 추이</h2>
          <div className="h-[300px]">
            {trendData?.months && trendData.months.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData.months}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#3D3D3D", fontSize: 12 }}
                    tickFormatter={(value) => {
                      const parts = value.split("-");
                      return `${parts[1]}월`;
                    }}
                  />
                  <YAxis tick={{ fill: "#6B6B6B", fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#5B8DEF", fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E4E4E4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    labelFormatter={(label) => {
                      const parts = label.split("-");
                      return `${parts[0]}년 ${parts[1]}월`;
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      if (name === "전환율") return [`${value}%`, "전환율"];
                      return [`${value}명`, name === "유입" ? "유입" : "성약"];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="유입"
                    stroke="#c47833"
                    strokeWidth={2}
                    dot={{ fill: "#c47833", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="contracted"
                    name="성약"
                    stroke="#009E03"
                    strokeWidth={2}
                    dot={{ fill: "#009E03", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversion_rate"
                    name="전환율"
                    stroke="#5B8DEF"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#5B8DEF", r: 3 }}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* 채널별 전환율 상세 테이블 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2">
          <h2 className="mb-4 text-heading4 text-foreground">채널별 성과 상세</h2>
          {channelData?.channels && channelData.channels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-3 text-caption font-semibold text-muted-foreground">
                      채널
                    </th>
                    <th className="pb-3 text-right text-caption font-semibold text-muted-foreground">
                      유입
                    </th>
                    <th className="pb-3 text-right text-caption font-semibold text-muted-foreground">
                      상담
                    </th>
                    <th className="pb-3 text-right text-caption font-semibold text-muted-foreground">
                      성약
                    </th>
                    <th className="pb-3 text-right text-caption font-semibold text-muted-foreground">
                      전환율
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.channels.map((ch) => (
                    <tr
                      key={ch.channel}
                      className="border-b border-border/20 transition-colors hover:bg-[#faf9f7]"
                    >
                      <td className="py-3 text-bodymedium text-foreground">
                        {ch.channel}
                      </td>
                      <td className="py-3 text-right text-bodymedium text-foreground">
                        {ch.total}명
                      </td>
                      <td className="py-3 text-right text-bodymedium text-foreground">
                        {ch.consulting}명
                      </td>
                      <td className="py-3 text-right text-bodymedium text-foreground">
                        {ch.contracted}명
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={
                            ch.conversion_rate > 0
                              ? "font-semibold text-green-700"
                              : "text-muted-foreground"
                          }
                        >
                          {ch.conversion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-caption text-muted-foreground">
              데이터가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 요약 카드 컴포넌트
function SummaryCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
          <Icon className="h-5 w-5 text-[#c47833]" />
        </div>
        <span className="text-caption text-muted-foreground">{label}</span>
      </div>
      <p className="text-heading1 text-foreground">
        {value.toLocaleString()}
        <span className="ml-1 text-bodymedium text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}

// 빈 차트 플레이스홀더
function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-[#faf9f7]">
      <p className="text-caption text-muted-foreground">데이터가 없습니다.</p>
    </div>
  );
}
