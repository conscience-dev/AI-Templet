import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

// 상담 기록 타입
export interface Consultation {
  id: string;
  prospect_id: string;
  prospect_name: string | null;
  consultation_order: number;
  consultant_id: string;
  consultant_name: string | null;
  consultation_date: string;
  content: string;
  result: string;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

// 상담 기록 생성 요청 타입
export interface ConsultationCreateRequest {
  consultation_order: number;
  consultation_date: string;
  content: string;
  result: string;
  next_action?: string;
}

// 상담 기록 상세 조회
export function useConsultation(id: string | null) {
  return useQuery<Consultation>({
    queryKey: ["consultations", id],
    queryFn: () =>
      api.get(`/v1/consultations/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 상담 기록 생성 (prospect nested)
export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prospectId, data }: { prospectId: string; data: ConsultationCreateRequest }) =>
      api.post(`/v1/prospects/${prospectId}/consultations`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["prospects", variables.prospectId, "consultations"],
      });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}
