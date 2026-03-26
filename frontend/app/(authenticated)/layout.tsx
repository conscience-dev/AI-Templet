"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMe } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex h-screen">
        {/* 사이드바 스켈레톤 */}
        <div className="flex w-64 flex-col bg-[#1a1915] p-4">
          <Skeleton className="mb-6 h-8 w-32 rounded-lg bg-white/5" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full rounded-xl bg-white/5"
              />
            ))}
          </div>
        </div>
        {/* 콘텐츠 스켈레톤 */}
        <div className="flex-1 p-8">
          <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // 인증 실패
  if (isError || !user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background px-8 py-8">{children}</main>
    </div>
  );
}
