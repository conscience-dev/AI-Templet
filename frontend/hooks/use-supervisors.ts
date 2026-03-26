import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 슈퍼바이저 목록 아이템
export interface SupervisorItem {
  id: string;
  name: string;
  role: string | null;
  store_count: number;
  inspection_count_this_month: number;
}

// 성과 비교 아이템
export interface SupervisorPerformanceItem {
  id: string;
  name: string;
  store_count: number;
  inspections_this_month: number;
  inspection_rate: number;
  task_completion_rate: number;
  avg_health_score: number;
  overdue_tasks: number;
}

// 성과 요약
export interface PerformanceSummary {
  total_supervisors: number;
  avg_inspection_rate: number;
  avg_task_completion_rate: number;
  total_uninspected_stores: number;
}

// 성과 비교 응답
export interface SupervisorPerformanceResponse {
  summary: PerformanceSummary;
  supervisors: SupervisorPerformanceItem[];
}

// 슈퍼바이저 상세 - 점포 정보
export interface SupervisorStoreItem {
  id: string;
  store_name: string;
  region: string;
  status: string;
  last_inspection_date: string | null;
  health_score: number;
  pending_tasks: number;
}

// 월별 점검 데이터
export interface MonthlyInspection {
  month: string;
  count: number;
}

// 카테고리별 과제 통계
export interface CategoryStat {
  category: string;
  total: number;
  completed: number;
}

// 과제 통계
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
}

// 슈퍼바이저 상세 응답
export interface SupervisorDetailResponse {
  supervisor: {
    id: string;
    name: string;
    role: string | null;
  };
  stores: SupervisorStoreItem[];
  monthly_inspections: MonthlyInspection[];
  task_stats: TaskStats;
  category_stats: CategoryStat[];
}

// 슈퍼바이저 목록 조회
export function useSupervisors() {
  return useQuery<SupervisorItem[]>({
    queryKey: ["supervisors"],
    queryFn: () =>
      api.get("/v1/supervisors").then((res) => res.data),
  });
}

// 슈퍼바이저 성과 비교
export function useSupervisorPerformance() {
  return useQuery<SupervisorPerformanceResponse>({
    queryKey: ["supervisors", "performance"],
    queryFn: () =>
      api.get("/v1/supervisors/performance").then((res) => res.data),
  });
}

// 슈퍼바이저 상세
export function useSupervisorDetail(id: string) {
  return useQuery<SupervisorDetailResponse>({
    queryKey: ["supervisors", id, "detail"],
    queryFn: () =>
      api.get(`/v1/supervisors/${id}/detail`).then((res) => res.data),
    enabled: !!id,
  });
}
