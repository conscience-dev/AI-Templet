import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";

// 점검 타입
export interface Inspection {
  id: string;
  store_id: string;
  store_name: string | null;
  supervisor_id: string;
  supervisor_name: string | null;
  inspection_date: string;
  quality_status: string;
  quality_notes: string | null;
  hygiene_status: string;
  hygiene_notes: string | null;
  sales_note: string | null;
  owner_feedback: string | null;
  created_at: string;
  updated_at: string;
}

// 점검 생성 요청 타입
export interface InspectionCreateRequest {
  inspection_date: string;
  quality_status: string;
  quality_notes?: string;
  hygiene_status: string;
  hygiene_notes?: string;
  sales_note?: string;
  owner_feedback?: string;
}

// 점검 상세 조회
export function useInspection(id: string | null) {
  return useQuery<Inspection>({
    queryKey: ["inspections", id],
    queryFn: () =>
      api.get(`/v1/inspections/${id}`).then((res) => res.data),
    enabled: id !== null,
  });
}

// 점검 생성 (store nested)
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: InspectionCreateRequest }) =>
      api.post(`/v1/stores/${storeId}/inspections`, data).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stores", variables.storeId, "inspections"],
      });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

// AI 개선 과제 생성
export function useGenerateInspectionTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inspectionId: string) =>
      api.post(`/v1/inspections/${inspectionId}/generate-tasks`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["improvement-tasks"] });
    },
  });
}
