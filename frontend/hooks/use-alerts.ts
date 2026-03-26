import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 경보 타입
export interface Alert {
  id: string;
  store_id: string;
  store_name: string;
  level: "critical" | "warning" | "info";
  type: string;
  message: string;
  created_at: string;
  details?: string;
}

// 경보 요약 타입
export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
}

// 경보 응답 타입
export interface AlertsResponse {
  alerts: Alert[];
  summary: AlertSummary;
}

// 점포별 경보 응답 타입
export interface StoreAlertsResponse {
  alerts: Alert[];
}

// 전체 경보 조회
export function useAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ["alerts"],
    queryFn: () => api.get("/v1/alerts").then((res) => res.data),
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
}

// 특정 점포 경보 조회
export function useStoreAlerts(storeId: string) {
  return useQuery<StoreAlertsResponse>({
    queryKey: ["alerts", "store", storeId],
    queryFn: () =>
      api.get(`/v1/alerts/store/${storeId}`).then((res) => res.data),
    enabled: !!storeId,
  });
}
