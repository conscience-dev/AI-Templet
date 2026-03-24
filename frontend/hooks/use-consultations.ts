import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";

// 상담 기록 타입
export interface Consultation {
  id: number;
  prospect_id: number;
  prospect_name: string;
  type: string;
  content: string;
  result: string;
  next_action: string;
  next_contact_date: string | null;
  consulted_by: number;
  consulted_by_name: string;
  consulted_at: string;
  created_at: string;
  updated_at: string;
}

// 상담 기록 생성/수정 요청 타입
export interface ConsultationRequest {
  prospect_id: number;
  type: string;
  content: string;
  result?: string;
  next_action?: string;
  next_contact_date?: string | null;
}

// 필터 파라미터 타입
interface ConsultationParams {
  prospect_id?: number;
  order?: string;
  search?: string;
  page?: number;
}

// 상담 기록 목록 조회
export function useConsultations(params?: ConsultationParams) {
  return useQuery<PaginatedResponse<Consultation>>({
    queryKey: ["consultations", params],
    queryFn: () =>
      api.get("/v1/consultations", { params }).then((res) => res.data),
  });
}

// 상담 기록 상세 조회
export function useConsultation(id: number | null) {
  return useQuery<Consultation>({
    queryKey: ["consultations", id],
    queryFn: () =>
      api.get(`/v1/consultations/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 상담 기록 생성
export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConsultationRequest) =>
      api.post("/v1/consultations", data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({
        queryKey: ["prospects", variables.prospect_id, "consultations"],
      });
    },
  });
}

// 상담 기록 수정
export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ConsultationRequest>;
    }) => api.patch(`/v1/consultations/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({
        queryKey: ["consultations", variables.id],
      });
    },
  });
}

// 상담 기록 삭제
export function useDeleteConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/v1/consultations/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
