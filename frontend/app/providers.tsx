"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // React Query Client 설정
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스시 자동 refetch 비활성화
            refetchOnWindowFocus: false,
            // 마운트시 자동 refetch 비활성화
            refetchOnMount: false,
            // 재연결시 자동 refetch 비활성화
            refetchOnReconnect: false,
            // 5분간 캐시 유지
            staleTime: 5 * 60 * 1000,
            // 10분 후 가비지 컬렉션
            gcTime: 10 * 60 * 1000,
          },
        },
      })
  );
  // React Query DevTools 동적 로드
  const [ReactQueryDevtools, setReactQueryDevtools] = React.useState<any>(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@tanstack/react-query-devtools").then((mod) => {
        setReactQueryDevtools(() => mod.ReactQueryDevtools);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
