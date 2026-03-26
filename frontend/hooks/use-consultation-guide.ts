import { useMutation, useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

// 체크리스트 항목 타입
export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
}

// 상담 피드백 응답 타입
export interface ConsultationFeedback {
  prospect_id: string;
  prospect_name: string;
  score: number;
  strengths: string[];
  improvements: string[];
  missed_items: string[];
  recommended_script: string;
}

// 우수 사례 응답 타입
export interface BestPractices {
  total_contracted: number;
  avg_consultations: number;
  common_patterns: string[];
  tips: string[];
}

// 상담 체크리스트 조회
export function useConsultationChecklist() {
  return useQuery<{ items: ChecklistItem[] }>({
    queryKey: ["consultation-checklist"],
    queryFn: () =>
      api.get("/v1/prospects/consultation-checklist").then((res) => res.data),
  });
}

// 우수 사례 분석
export function useBestPractices() {
  return useQuery<BestPractices>({
    queryKey: ["best-practices"],
    queryFn: () =>
      api.get("/v1/prospects/best-practices").then((res) => res.data),
  });
}

// 상담 피드백 (AI)
export function useConsultationFeedback() {
  return useMutation<ConsultationFeedback, Error, string>({
    mutationFn: (prospectId: string) =>
      api
        .post(`/v1/prospects/${prospectId}/consultation-feedback`)
        .then((res) => res.data),
  });
}
