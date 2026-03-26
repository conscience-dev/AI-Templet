import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";

// 개선 과제 타입
export interface ImprovementTask {
  id: string;
  store_id: string;
  store_name: string | null;
  inspection_id: string | null;
  category: string;
  task_description: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// 개선 과제 생성/수정 요청 타입
export interface ImprovementTaskRequest {
  store_id: string;
  inspection_id?: string | null;
  category: string;
  task_description: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
}

// 필터 파라미터 타입
interface ImprovementTaskParams {
  store_id?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
}

// 개선 과제 목록 조회
export function useImprovementTasks(params?: ImprovementTaskParams) {
  return useQuery<PaginatedResponse<ImprovementTask>>({
    queryKey: ["improvement-tasks", params],
    queryFn: () =>
      api.get("/v1/improvement-tasks", { params }).then((res) => res.data),
  });
}

// 개선 과제 상세 조회
export function useImprovementTask(id: string | null) {
  return useQuery<ImprovementTask>({
    queryKey: ["improvement-tasks", id],
    queryFn: () =>
      api.get(`/v1/improvement-tasks/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 개선 과제 생성
export function useCreateImprovementTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImprovementTaskRequest) =>
      api.post("/v1/improvement-tasks", data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["improvement-tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["stores", variables.store_id, "improvement-tasks"],
      });
    },
  });
}

// 개선 과제 수정
export function useUpdateImprovementTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ImprovementTaskRequest>;
    }) =>
      api.patch(`/v1/improvement-tasks/${id}`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["improvement-tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["improvement-tasks", variables.id],
      });
    },
  });
}

// 개선 과제 상태 변경
export function useUpdateImprovementTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api
        .patch(`/v1/improvement-tasks/${id}/status`, { status })
        .then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["improvement-tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["improvement-tasks", variables.id],
      });
    },
  });
}
