import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";

// 점포 타입
export interface Store {
  id: string;
  store_name: string;
  region: string;
  address: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// 점포 생성/수정 요청 타입
export interface StoreRequest {
  store_name: string;
  region: string;
  address?: string;
  supervisor_id?: string | null;
  status?: string;
}

// 필터 파라미터 타입
interface StoreParams {
  region?: string;
  status?: string;
  supervisor_id?: string;
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
export function useStore(id: string | null) {
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
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreRequest> }) =>
      api.patch(`/v1/stores/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

// 점포별 점검 기록 조회
export function useStoreInspections(id: string | null) {
  return useQuery({
    queryKey: ["stores", id, "inspections"],
    queryFn: () =>
      api.get(`/v1/stores/${id}/inspections`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점포별 개선 과제 조회
export function useStoreImprovementTasks(id: string | null) {
  return useQuery({
    queryKey: ["stores", id, "improvement-tasks"],
    queryFn: () =>
      api.get(`/v1/stores/${id}/improvement-tasks`).then((res) => res.data),
    enabled: id !== null,
  });
}
