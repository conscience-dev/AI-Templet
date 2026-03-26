import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import api from "@/lib/api";

// 유저 정보 타입
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 로그인 요청 타입
interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 타입
interface LoginResponse {
  status: string;
  access_token: string;
  refresh_token: string;
}

// 현재 유저 정보 조회
export function useMe() {
  return useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/v1/auth/me").then((res) => res.data),
    retry: false,
    enabled:
      typeof window !== "undefined" &&
      !!localStorage.getItem("access_token"),
  });
}

// 로그인
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>("/v1/auth/login", data).then((res) => res.data),
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

// 로그아웃
export function useLogout() {
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    queryClient.clear();
    window.location.href = "/login";
  }, [queryClient]);

  return logout;
}
