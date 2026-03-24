import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";

// 점검 타입
export interface Inspection {
  id: number;
  store_id: number;
  store_name: string;
  inspector_id: number;
  inspector_name: string;
  inspection_date: string;
  type: string;
  hygiene_score: number | null;
  service_score: number | null;
  facility_score: number | null;
  operation_score: number | null;
  overall_score: number | null;
  findings: string;
  recommendations: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

// 점검 생성/수정 요청 타입
export interface InspectionRequest {
  store_id: number;
  inspection_date: string;
  type?: string;
  hygiene_score?: number | null;
  service_score?: number | null;
  facility_score?: number | null;
  operation_score?: number | null;
  findings?: string;
  recommendations?: string;
}

// 필터 파라미터 타입
interface InspectionParams {
  store_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}

// 점검 목록 조회
export function useInspections(params?: InspectionParams) {
  return useQuery<PaginatedResponse<Inspection>>({
    queryKey: ["inspections", params],
    queryFn: () =>
      api.get("/v1/inspections", { params }).then((res) => res.data),
  });
}

// 점검 상세 조회
export function useInspection(id: number | null) {
  return useQuery<Inspection>({
    queryKey: ["inspections", id],
    queryFn: () =>
      api.get(`/v1/inspections/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점검 생성
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InspectionRequest) =>
      api.post("/v1/inspections", data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({
        queryKey: ["stores", variables.store_id, "inspections"],
      });
    },
  });
}

// 점검 수정
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InspectionRequest>;
    }) => api.patch(`/v1/inspections/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({
        queryKey: ["inspections", variables.id],
      });
    },
  });
}

// 점검 삭제
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/v1/inspections/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}
