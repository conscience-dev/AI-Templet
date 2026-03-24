import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { PaginatedResponse } from "@/hooks/use-prospects";
import { User } from "@/hooks/use-auth";

// 관리자용 필터 파라미터
interface AdminUserParams {
  status?: string;
  page?: number;
}

// 사용자 목록 조회 (관리자)
export function useAdminUsers(params?: AdminUserParams) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      api.get("/v1/auth/users", { params }).then((res) => res.data),
  });
}

// 사용자 상태 변경 (관리자)
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: { status?: string; role?: string; is_active?: boolean };
    }) => api.patch(`/v1/auth/${userId}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
