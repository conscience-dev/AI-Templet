import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 채널별 통계
export interface ChannelStat {
  channel: string;
  total: number;
  consulting: number;
  contracted: number;
  conversion_rate: number;
}

// 지역별 통계
export interface RegionStat {
  region: string;
  total: number;
  contracted: number;
  conversion_rate: number;
  avg_budget: number;
}

// 예산 구간별 통계
export interface BudgetStat {
  range: string;
  total: number;
  contracted: number;
  conversion_rate: number;
}

// 월별 추이
export interface MonthlyTrend {
  month: string;
  total: number;
  contracted: number;
  conversion_rate: number;
}

// 마케팅 요약
export interface MarketingSummary {
  total_prospects: number;
  this_month_prospects: number;
  conversion_rate: number;
  channel_count: number;
  contracted_count: number;
}

// 마케팅 요약 조회
export function useMarketingSummary() {
  return useQuery<MarketingSummary>({
    queryKey: ["marketing", "summary"],
    queryFn: () =>
      api.get("/v1/marketing/summary").then((res) => res.data),
  });
}

// 채널별 통계 조회
export function useChannelStats() {
  return useQuery<{ channels: ChannelStat[] }>({
    queryKey: ["marketing", "channel-stats"],
    queryFn: () =>
      api.get("/v1/marketing/channel-stats").then((res) => res.data),
  });
}

// 지역별 통계 조회
export function useRegionStats() {
  return useQuery<{ regions: RegionStat[] }>({
    queryKey: ["marketing", "region-stats"],
    queryFn: () =>
      api.get("/v1/marketing/region-stats").then((res) => res.data),
  });
}

// 예산 구간별 통계 조회
export function useBudgetStats() {
  return useQuery<{ ranges: BudgetStat[] }>({
    queryKey: ["marketing", "budget-stats"],
    queryFn: () =>
      api.get("/v1/marketing/budget-stats").then((res) => res.data),
  });
}

// 월별 추이 조회
export function useMonthlyTrend() {
  return useQuery<{ months: MonthlyTrend[] }>({
    queryKey: ["marketing", "monthly-trend"],
    queryFn: () =>
      api.get("/v1/marketing/monthly-trend").then((res) => res.data),
  });
}
