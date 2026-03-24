"use client";

import {
  Users,
  MessageSquare,
  FileCheck,
  TrendingUp,
  Store,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  Building2,
  BarChart3,
  ListTodo,
  Calendar,
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
import { useMe } from "@/hooks/use-auth";
import {
  useDevTeamMetrics,
  useSupervisorMetrics,
  useExecutiveSummary,
} from "@/hooks/use-dashboard";

// 통계 카드 컴포넌트
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

// 상태 배지
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    신규: "bg-blue-50 text-blue-700",
    진행중: "bg-amber-50 text-amber-700",
    성약: "bg-green-50 text-green-700",
    종료: "bg-[#f5f3ef] text-muted-foreground",
    계약: "bg-green-50 text-green-700",
    보류: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-tiny font-medium ${styles[status] || "bg-[#f5f3ef] text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// 점포개발팀 대시보드
function DevTeamDashboard() {
  const { data, isLoading } = useDevTeamMetrics();

  const totalProspects = data
    ? Object.values(data.prospects_by_status).reduce((a, b) => a + b, 0)
    : 0;
  const newCount = data?.prospects_by_status["신규"] || 0;
  const ongoingCount = data?.prospects_by_status["진행중"] || 0;
  const contractCount = data?.conversion_funnel?.contract || 0;
  const conversionRate =
    totalProspects > 0
      ? ((contractCount / totalProspects) * 100).toFixed(1)
      : "0";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="이번 달 신규 문의"
          value={newCount}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={MessageSquare}
          label="진행중 상담"
          value={ongoingCount}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={FileCheck}
          label="성약 건수"
          value={contractCount}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="상담 전환율"
          value={conversionRate}
          suffix="%"
          isLoading={isLoading}
        />
      </div>

      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-heading4 text-foreground">
            상담 현황 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : data?.conversion_funnel ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    단계
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-right text-caption text-muted-foreground">
                    건수
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { label: "문의", value: data.conversion_funnel.inquiry },
                  { label: "상담중", value: data.conversion_funnel.consulting },
                  {
                    label: "현장방문",
                    value: data.conversion_funnel.site_visit,
                  },
                  { label: "계약", value: data.conversion_funnel.contract },
                  { label: "오픈", value: data.conversion_funnel.open },
                ].map((row) => (
                  <TableRow
                    key={row.label}
                    className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                  >
                    <TableCell className="text-caption2 text-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right text-caption2 font-medium text-foreground">
                      {row.value}건
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="상담 데이터가 없습니다." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

// 슈퍼바이저 대시보드
function SupervisorDashboard() {
  const { data, isLoading } = useSupervisorMetrics();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Store}
          label="담당 점포 수"
          value={data?.assigned_stores || 0}
          suffix="개"
          isLoading={isLoading}
        />
        <StatCard
          icon={ClipboardCheck}
          label="이번 달 점검 완료"
          value={data?.inspections_this_month || 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label="미처리 개선과제"
          value={data?.pending_tasks || 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={Activity}
          label="평균 건강도"
          value={data?.average_store_score?.toFixed(1) || "0"}
          suffix="점"
          isLoading={isLoading}
        />
      </div>

      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-heading4 text-foreground">
            최근 점검 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : data?.recent_inspections && data.recent_inspections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    점포명
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-right text-caption text-muted-foreground">
                    종합 점수
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-right text-caption text-muted-foreground">
                    점검일
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_inspections.map((inspection) => (
                  <TableRow
                    key={inspection.id}
                    className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                  >
                    <TableCell className="text-caption2 font-medium text-foreground">
                      {inspection.store_name}
                    </TableCell>
                    <TableCell className="text-right text-caption2 text-foreground">
                      {inspection.overall_score}점
                    </TableCell>
                    <TableCell className="text-right text-caption2 text-muted-foreground">
                      {new Date(inspection.inspection_date).toLocaleDateString(
                        "ko-KR",
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="점검 결과가 없습니다." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

// 경영진 대시보드
function ExecutiveDashboard() {
  const { data, isLoading } = useExecutiveSummary();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="전체 가맹문의"
          value={data?.total_prospects || 0}
          suffix="건"
          isLoading={isLoading}
        />
        <StatCard
          icon={Building2}
          label="전체 가맹점"
          value={data?.total_stores || 0}
          suffix="개"
          isLoading={isLoading}
        />
        <StatCard
          icon={BarChart3}
          label="성약률"
          value={data?.prospect_conversion_rate?.toFixed(1) || "0"}
          suffix="%"
          isLoading={isLoading}
        />
        <StatCard
          icon={ListTodo}
          label="미처리 개선과제"
          value={data?.pending_improvement_tasks || 0}
          suffix="건"
          isLoading={isLoading}
        />
      </div>

      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-heading4 text-foreground">
            주요 지표 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    지표
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-right text-caption text-muted-foreground">
                    값
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    label: "이번 달 신규 문의",
                    value: `${data?.new_prospects_this_month || 0}건`,
                  },
                  {
                    label: "활성 가맹점",
                    value: `${data?.active_stores || 0}개`,
                  },
                  {
                    label: "평균 건강도",
                    value: `${data?.average_health_score?.toFixed(1) || "0"}점`,
                  },
                  {
                    label: "이번 달 점검",
                    value: `${data?.monthly_inspections || 0}건`,
                  },
                  {
                    label: "이번 달 상담",
                    value: `${data?.consultation_count_this_month || 0}건`,
                  },
                  {
                    label: "지연 과제",
                    value: `${data?.overdue_tasks || 0}건`,
                  },
                ].map((row) => (
                  <TableRow
                    key={row.label}
                    className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                  >
                    <TableCell className="text-caption2 text-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right text-caption2 font-medium text-foreground">
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// 빈 상태
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
        <Calendar className="h-6 w-6 text-[#c47833]" />
      </div>
      <p className="text-caption text-muted-foreground">{message}</p>
    </div>
  );
}

// 메인 대시보드 페이지
export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useMe();

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "executive":
        return <ExecutiveDashboard />;
      case "dev_manager":
      case "dev_staff":
        return <DevTeamDashboard />;
      case "supervisor_manager":
      case "supervisor":
        return <SupervisorDashboard />;
      case "admin":
        return <ExecutiveDashboard />;
      default:
        return <DevTeamDashboard />;
    }
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
            <p className="mt-1 text-caption2 text-muted-foreground">{today}</p>
          </>
        )}
      </div>

      {/* 역할별 대시보드 */}
      {userLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-9 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        renderDashboard()
      )}
    </div>
  );
}
