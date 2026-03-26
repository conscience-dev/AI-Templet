import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 요약 지표 타입
export interface DashboardSummary {
  total_prospects: number;
  new_prospects_this_month: number;
  prospect_conversion_rate: number;
  total_stores: number;
  active_stores: number;
  average_health_score: number;
  pending_improvement_tasks: number;
  overdue_tasks: number;
  monthly_inspections: number;
  consultation_count_this_month: number;
}

// 상담 관련 지표 타입
export interface ProspectMetrics {
  prospects_by_status: Record<string, number>;
  prospects_by_region: Record<string, number>;
  consultations_this_week: number;
  consultations_this_month: number;
  upcoming_contacts: number;
  conversion_funnel: {
    inquiry: number;
    consulting: number;
    site_visit: number;
    contract: number;
    open: number;
  };
}

// 점포/과제 관련 지표 타입
export interface StoreMetrics {
  assigned_stores: number;
  inspections_this_month: number;
  pending_tasks: number;
  overdue_tasks: number;
  average_store_score: number;
  stores_below_threshold: number;
  tasks_by_category: Record<string, number>;
  recent_inspections: Array<{
    id: string;
    store_name: string;
    overall_score: number;
    inspection_date: string;
  }>;
}

// 요약 지표 조회
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: () =>
      api.get("/v1/dashboard/summary").then((res) => res.data),
  });
}

// 상담 관련 지표 조회
export function useProspectMetrics() {
  return useQuery<ProspectMetrics>({
    queryKey: ["dashboard", "prospect-metrics"],
    queryFn: () =>
      api.get("/v1/dashboard/prospect-metrics").then((res) => res.data),
  });
}

// 점포/과제 관련 지표 조회
export function useStoreMetrics() {
  return useQuery<StoreMetrics>({
    queryKey: ["dashboard", "store-metrics"],
    queryFn: () =>
      api.get("/v1/dashboard/store-metrics").then((res) => res.data),
  });
}

// 경영진 대시보드 타입
export interface ExecutiveSummary {
  total_prospects: number;
  total_stores: number;
  total_revenue_estimate: number;
  conversion_rate: number;
  churn_rate: number;
  monthly_comparison: {
    prospects_change: number;
    stores_change: number;
    tasks_change: number;
  };
  channel_performance: Array<{
    channel: string;
    count: number;
    conversion_rate: number;
  }>;
  top_performing_stores: Array<{
    store_name: string;
    health_score: number;
  }>;
  risk_stores: Array<{
    store_name: string;
    risk_level: string;
    reason: string;
  }>;
}

// 점포개발팀 대시보드 타입
export interface DevSummary {
  active_prospects: number;
  consultations_this_month: number;
  conversion_rate: number;
  prospects_by_status: Record<string, number>;
  recent_consultations: Array<{
    prospect_name: string;
    consultant: string;
    date: string;
    result: string;
  }>;
  channel_stats: Array<{
    channel: string;
    count: number;
    conversion_rate: number;
  }>;
  consultant_performance: Array<{
    name: string;
    consultations: number;
    conversions: number;
  }>;
}

// 슈퍼바이저 대시보드 타입
export interface SupervisorSummary {
  my_stores: number;
  inspections_this_month: number;
  pending_tasks: number;
  stores_needing_visit: Array<{
    store_name: string;
    last_inspection: string | null;
    days_since: number;
  }>;
  urgent_tasks: Array<{
    store_name: string;
    task_description: string;
    priority: string;
    due_date: string | null;
    is_overdue: boolean;
  }>;
  store_health: Array<{
    store_name: string;
    score: number;
  }>;
}

// 경영진 대시보드 조회
export function useExecutiveSummary() {
  return useQuery<ExecutiveSummary>({
    queryKey: ["dashboard", "executive-summary"],
    queryFn: () =>
      api.get("/v1/dashboard/executive-summary").then((res) => res.data),
  });
}

// 점포개발팀 대시보드 조회
export function useDevSummary() {
  return useQuery<DevSummary>({
    queryKey: ["dashboard", "dev-summary"],
    queryFn: () =>
      api.get("/v1/dashboard/dev-summary").then((res) => res.data),
  });
}

// 슈퍼바이저 대시보드 조회
export function useSupervisorSummary() {
  return useQuery<SupervisorSummary>({
    queryKey: ["dashboard", "supervisor-summary"],
    queryFn: () =>
      api.get("/v1/dashboard/supervisor-summary").then((res) => res.data),
  });
}
