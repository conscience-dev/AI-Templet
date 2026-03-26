import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 건강도 점수 타입
export interface HealthScore {
  overall_score: number;
  quality_score: number;
  hygiene_score: number;
  task_completion_rate: number;
  trend: "improving" | "stable" | "declining";
  recent_inspections: {
    date: string;
    quality: number;
    hygiene: number;
  }[];
  task_stats: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
}

// 개선 이력 타입
export interface ImprovementTimeline {
  timeline: {
    inspection_id: string;
    inspection_date: string;
    quality_status: string;
    hygiene_status: string;
    tasks: {
      id: string;
      category: string;
      description: string;
      status: string;
      priority: string;
      created_at: string;
      completed_at: string | null;
    }[];
  }[];
}

// 미완료 지적사항 타입
export interface PreviousIssues {
  unresolved: {
    task_id: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    inspection_date: string;
    days_overdue: number;
  }[];
}

// 건강도 점수 조회
export function useStoreHealthScore(storeId: string | null) {
  return useQuery<HealthScore>({
    queryKey: ["stores", storeId, "health-score"],
    queryFn: () =>
      api.get(`/v1/stores/${storeId}/health-score`).then((res) => res.data),
    enabled: storeId !== null,
  });
}

// 개선 이력 조회
export function useImprovementHistory(storeId: string | null) {
  return useQuery<ImprovementTimeline>({
    queryKey: ["stores", storeId, "improvement-history"],
    queryFn: () =>
      api
        .get(`/v1/stores/${storeId}/improvement-history`)
        .then((res) => res.data),
    enabled: storeId !== null,
  });
}

// 미완료 지적사항 조회
export function usePreviousIssues(storeId: string | null) {
  return useQuery<PreviousIssues>({
    queryKey: ["stores", storeId, "previous-issues"],
    queryFn: () =>
      api
        .get(`/v1/stores/${storeId}/previous-issues`)
        .then((res) => res.data),
    enabled: storeId !== null,
  });
}
