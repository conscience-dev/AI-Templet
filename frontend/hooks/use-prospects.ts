import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  results: T[];
  total_cnt: number;
  cur_page: number;
  page_cnt: number;
  count: number;
  next_page: number | null;
  previous_page: number | null;
}

// 가맹문의자 타입
export interface Prospect {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  region: string;
  source: string;
  desired_location: string;
  budget: number | null;
  experience: string;
  memo: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

// 가맹문의자 생성/수정 요청 타입
export interface ProspectRequest {
  name: string;
  phone: string;
  email?: string;
  status?: string;
  region?: string;
  source?: string;
  desired_location?: string;
  budget?: number | null;
  experience?: string;
  memo?: string;
  assigned_to?: number | null;
}

// 필터 파라미터 타입
interface ProspectParams {
  status?: string;
  region?: string;
  search?: string;
  page?: number;
}

// 가맹문의자 목록 조회
export function useProspects(params?: ProspectParams) {
  return useQuery<PaginatedResponse<Prospect>>({
    queryKey: ["prospects", params],
    queryFn: () =>
      api.get("/v1/prospects", { params }).then((res) => res.data),
  });
}

// 가맹문의자 상세 조회
export function useProspect(id: number | null) {
  return useQuery<Prospect>({
    queryKey: ["prospects", id],
    queryFn: () => api.get(`/v1/prospects/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 가맹문의자 생성
export function useCreateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProspectRequest) =>
      api.post("/v1/prospects", data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}

// 가맹문의자 수정
export function useUpdateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProspectRequest> }) =>
      api.patch(`/v1/prospects/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["prospects", variables.id] });
    },
  });
}

// 가맹문의자 삭제
export function useDeleteProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/v1/prospects/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}

// 가맹문의자별 상담 기록 조회
export function useProspectConsultations(id: number | null) {
  return useQuery({
    queryKey: ["prospects", id, "consultations"],
    queryFn: () =>
      api.get(`/v1/prospects/${id}/consultations`).then((res) => res.data),
    enabled: id !== null,
  });
}
