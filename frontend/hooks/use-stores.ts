import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";

// 점포 타입
export interface Store {
  id: number;
  name: string;
  address: string;
  region: string;
  status: string;
  owner_name: string;
  owner_phone: string;
  open_date: string | null;
  supervisor_id: number | null;
  supervisor_name: string | null;
  health_score: number | null;
  last_inspection_date: string | null;
  memo: string;
  created_at: string;
  updated_at: string;
}

// 점포 생성/수정 요청 타입
export interface StoreRequest {
  name: string;
  address: string;
  region?: string;
  status?: string;
  owner_name: string;
  owner_phone: string;
  open_date?: string | null;
  supervisor_id?: number | null;
  memo?: string;
}

// 건강 점수 타입
export interface StoreHealthScore {
  store_id: number;
  overall_score: number;
  hygiene_score: number;
  service_score: number;
  facility_score: number;
  operation_score: number;
  trend: string;
  last_updated: string;
}

// 필터 파라미터 타입
interface StoreParams {
  region?: string;
  status?: string;
  supervisor_id?: number;
  search?: string;
  page?: number;
}

// 점포 목록 조회
export function useStores(params?: StoreParams) {
  return useQuery<PaginatedResponse<Store>>({
    queryKey: ["stores", params],
    queryFn: () =>
      api.get("/v1/stores", { params }).then((res) => res.data),
  });
}

// 점포 상세 조회
export function useStore(id: number | null) {
  return useQuery<Store>({
    queryKey: ["stores", id],
    queryFn: () => api.get(`/v1/stores/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점포 생성
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreRequest) =>
      api.post("/v1/stores", data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

// 점포 수정
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StoreRequest> }) =>
      api.patch(`/v1/stores/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

// 점포 삭제
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/v1/stores/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

// 점포별 점검 기록 조회
export function useStoreInspections(id: number | null) {
  return useQuery({
    queryKey: ["stores", id, "inspections"],
    queryFn: () =>
      api.get(`/v1/stores/${id}/inspections`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점포별 개선 과제 조회
export function useStoreImprovementTasks(id: number | null) {
  return useQuery({
    queryKey: ["stores", id, "improvement-tasks"],
    queryFn: () =>
      api.get(`/v1/stores/${id}/improvement-tasks`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점포 건강 점수 조회
export function useStoreHealthScore(id: number | null) {
  return useQuery<StoreHealthScore>({
    queryKey: ["stores", id, "health-score"],
    queryFn: () =>
      api.get(`/v1/stores/${id}/health-score`).then((res) => res.data),
    enabled: id !== null,
  });
}
