"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  ChevronRight,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAlerts, Alert } from "@/hooks/use-alerts";

// 레벨별 설정
const levelConfig = {
  critical: {
    label: "위험",
    icon: AlertTriangle,
    cardBg: "bg-red-50",
    cardText: "text-red-700",
    cardBorder: "border-l-4 border-red-500",
    summaryBg: "bg-red-50",
    summaryText: "text-red-700",
    summaryIconBg: "bg-red-100",
    summaryIconColor: "text-red-600",
  },
  warning: {
    label: "경고",
    icon: AlertCircle,
    cardBg: "bg-amber-50",
    cardText: "text-amber-700",
    cardBorder: "border-l-4 border-amber-500",
    summaryBg: "bg-amber-50",
    summaryText: "text-amber-700",
    summaryIconBg: "bg-amber-100",
    summaryIconColor: "text-amber-600",
  },
  info: {
    label: "주의",
    icon: Info,
    cardBg: "bg-blue-50",
    cardText: "text-blue-700",
    cardBorder: "border-l-4 border-blue-500",
    summaryBg: "bg-blue-50",
    summaryText: "text-blue-700",
    summaryIconBg: "bg-blue-100",
    summaryIconColor: "text-blue-600",
  },
};

// 경보 유형 한글 매핑
const typeLabels: Record<string, string> = {
  quality: "품질/위생",
  hygiene: "위생",
  overdue: "과제 지연",
  unvisited: "미점검",
  consecutive_fail: "연속 미흡",
};

// 요약 카드
function SummaryCard({
  level,
  count,
  isLoading,
}: {
  level: "critical" | "warning" | "info";
  count: number;
  isLoading: boolean;
}) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Card className={cn("rounded-2xl border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]", config.summaryBg)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-caption", config.summaryText)}>
              {config.label}
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-16 rounded-lg" />
            ) : (
              <p className={cn("text-[28px] font-bold leading-none", config.summaryText)}>
                {count}
                <span className={cn("ml-1 text-heading4 font-medium", config.summaryText, "opacity-70")}>
                  건
                </span>
              </p>
            )}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", config.summaryIconBg)}>
            <Icon className={cn("h-5 w-5", config.summaryIconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 경보 카드
function AlertCard({ alert }: { alert: Alert }) {
  const config = levelConfig[alert.level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-2xl p-4 transition-colors",
        config.cardBg,
        config.cardBorder,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.cardText)} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-caption font-semibold", config.cardText)}>
                {alert.store_name}
              </span>
              <span className={cn("rounded-lg px-2 py-0.5 text-tiny font-medium", config.cardBg, config.cardText)}>
                {typeLabels[alert.type] || alert.type}
              </span>
            </div>
            <p className={cn("text-caption2", config.cardText)}>
              {alert.message}
            </p>
            {alert.details && (
              <p className={cn("text-tiny opacity-75", config.cardText)}>
                {alert.details}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/stores/${alert.store_id}`}
          className={cn(
            "shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/50",
            config.cardText,
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// 점포 위험도 리스트
function StoreRiskList({ alerts }: { alerts: Alert[] }) {
  // 점포별로 그룹핑하고 위험도 계산
  const storeMap = new Map<string, { name: string; storeId: string; critical: number; warning: number; info: number }>();

  for (const alert of alerts) {
    if (!storeMap.has(alert.store_id)) {
      storeMap.set(alert.store_id, {
        name: alert.store_name,
        storeId: alert.store_id,
        critical: 0,
        warning: 0,
        info: 0,
      });
    }
    const entry = storeMap.get(alert.store_id)!;
    entry[alert.level]++;
  }

  // 위험도 순 정렬 (critical 우선, warning 다음)
  const sortedStores = Array.from(storeMap.values()).sort((a, b) => {
    if (a.critical !== b.critical) return b.critical - a.critical;
    if (a.warning !== b.warning) return b.warning - a.warning;
    return b.info - a.info;
  });

  if (sortedStores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
          <Shield className="h-6 w-6 text-[#c47833]" />
        </div>
        <p className="text-caption text-muted-foreground">
          모든 점포가 양호합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedStores.map((store) => {
        const total = store.critical + store.warning + store.info;
        const riskLevel = store.critical > 0 ? "critical" : store.warning > 0 ? "warning" : "info";

        return (
          <Link
            key={store.storeId}
            href={`/stores/${store.storeId}`}
            className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-[#faf9f7]"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  riskLevel === "critical" && "bg-red-500",
                  riskLevel === "warning" && "bg-amber-500",
                  riskLevel === "info" && "bg-blue-500",
                )}
              />
              <span className="text-caption2 font-medium text-foreground">
                {store.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {store.critical > 0 && (
                <span className="rounded-lg bg-red-50 px-2 py-0.5 text-tiny font-medium text-red-700">
                  위험 {store.critical}
                </span>
              )}
              {store.warning > 0 && (
                <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-tiny font-medium text-amber-700">
                  경고 {store.warning}
                </span>
              )}
              {store.info > 0 && (
                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-tiny font-medium text-blue-700">
                  주의 {store.info}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function AlertsPage() {
  const { data, isLoading } = useAlerts();
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const alerts = data?.alerts || [];
  const summary = data?.summary || { critical: 0, warning: 0, info: 0 };

  const filteredAlerts = filter === "all"
    ? alerts
    : alerts.filter((a) => a.level === filter);

  const filterButtons = [
    { key: "all" as const, label: "전체", count: alerts.length },
    { key: "critical" as const, label: "위험", count: summary.critical },
    { key: "warning" as const, label: "경고", count: summary.warning },
    { key: "info" as const, label: "주의", count: summary.info },
  ];

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-heading1 text-foreground">위기 경보</h1>
        <p className="mt-1 text-caption2 text-muted-foreground">
          점포별 위기 상황을 실시간으로 모니터링합니다.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard level="critical" count={summary.critical} isLoading={isLoading} />
        <SummaryCard level="warning" count={summary.warning} isLoading={isLoading} />
        <SummaryCard level="info" count={summary.info} isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 경보 목록 (2/3 너비) */}
        <div className="lg:col-span-2 space-y-4">
          {/* 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-caption transition-colors",
                  filter === btn.key
                    ? "bg-[#c47833] text-white"
                    : "bg-white text-muted-foreground hover:bg-[#faf9f7]",
                )}
              >
                {btn.label}
                <span className="ml-1 text-tiny">({btn.count})</span>
              </button>
            ))}
          </div>

          {/* 경보 리스트 */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <Shield className="h-6 w-6 text-[#c47833]" />
                </div>
                <p className="text-caption text-muted-foreground">
                  {filter === "all" ? "경보가 없습니다. 모든 점포가 양호합니다." : `${filterButtons.find(b => b.key === filter)?.label} 경보가 없습니다.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* 점포별 위험도 (1/3 너비) */}
        <div>
          <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-heading4 text-foreground">
                점포별 위험도
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <StoreRiskList alerts={alerts} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
