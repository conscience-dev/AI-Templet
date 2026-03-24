import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 경영진 요약 타입
export interface ExecutiveSummary {
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

// 점포개발팀 메트릭스 타입
export interface DevTeamMetrics {
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

// 슈퍼바이저 메트릭스 타입
export interface SupervisorMetrics {
  assigned_stores: number;
  inspections_this_month: number;
  pending_tasks: number;
  overdue_tasks: number;
  average_store_score: number;
  stores_below_threshold: number;
  tasks_by_category: Record<string, number>;
  recent_inspections: Array<{
    id: number;
    store_name: string;
    overall_score: number;
    inspection_date: string;
  }>;
}

// 경영진 요약 조회
export function useExecutiveSummary() {
  return useQuery<ExecutiveSummary>({
    queryKey: ["dashboard", "executive-summary"],
    queryFn: () =>
      api.get("/v1/dashboard/executive-summary").then((res) => res.data),
  });
}

// 점포개발팀 메트릭스 조회
export function useDevTeamMetrics() {
  return useQuery<DevTeamMetrics>({
    queryKey: ["dashboard", "dev-team-metrics"],
    queryFn: () =>
      api.get("/v1/dashboard/dev-team-metrics").then((res) => res.data),
  });
}

// 슈퍼바이저 메트릭스 조회
export function useSupervisorMetrics() {
  return useQuery<SupervisorMetrics>({
    queryKey: ["dashboard", "supervisor-metrics"],
    queryFn: () =>
      api.get("/v1/dashboard/supervisor-metrics").then((res) => res.data),
  });
}
