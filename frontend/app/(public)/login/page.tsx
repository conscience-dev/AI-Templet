"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  BarChart3,
  Users,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { detail?: string } } };
          toast({
            title: "로그인 실패",
            description:
              err.response?.data?.detail ||
              "이메일 또는 비밀번호를 확인해주세요.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const features = [
    {
      icon: BarChart3,
      title: "실시간 데이터 분석",
      description: "가맹문의부터 계약까지 전 과정을 데이터로 관리합니다.",
    },
    {
      icon: Users,
      title: "체계적 상담 관리",
      description: "AI 기반 상담 기록 분석으로 성약률을 높입니다.",
    },
    {
      icon: Shield,
      title: "안전한 데이터 관리",
      description: "역할 기반 접근 제어로 데이터를 안전하게 보호합니다.",
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* 좌측 브랜드 패널 */}
      <div className="hidden flex-col justify-between bg-[#1a1915] p-12 lg:flex lg:w-1/2">
        <div>
          {/* 로고 */}
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/15">
              <UtensilsCrossed className="h-5 w-5 text-[#d4a574]" />
            </div>
            <span className="text-heading3 text-[#e8e4dc]">이비가푸드</span>
          </div>

          {/* 슬로건 */}
          <div className="mb-16">
            <h1 className="mb-4 text-[32px] font-bold leading-tight tracking-tight text-[#e8e4dc]">
              AI 기반
              <br />
              프랜차이즈 점포개발
              <br />
              상담 관리
            </h1>
            <p className="text-bodymedium text-[#a39e93]">
              데이터 기반의 스마트한 가맹사업 운영을 시작하세요.
            </p>
          </div>

          {/* 기능 하이라이트 */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <feature.icon className="h-5 w-5 text-[#d4a574]" />
                </div>
                <div>
                  <h3 className="mb-1 text-heading4 text-[#e8e4dc]">
                    {feature.title}
                  </h3>
                  <p className="text-caption text-[#a39e93]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 저작권 */}
        <p className="text-tiny text-[#a39e93]/60">
          &copy; 2026 이비가푸드. All rights reserved.
        </p>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="flex w-full items-center justify-center bg-background px-6 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* 모바일 로고 */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
              <UtensilsCrossed className="h-5 w-5 text-[#c47833]" />
            </div>
            <span className="text-heading3 text-foreground">이비가푸드</span>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-heading1 text-foreground">로그인</h2>
            <p className="text-bodymedium text-muted-foreground">
              업무 시스템에 로그인하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-caption2 text-foreground">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border bg-white text-bodymedium placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-caption2 text-foreground">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border bg-white pr-10 text-bodymedium placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="h-11 w-full rounded-xl bg-[#c47833] text-bodybtn text-white transition-colors hover:bg-[#b06a2a]"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-caption text-muted-foreground">
            계정이 없으신가요?{" "}
            <span className="text-[#c47833]">관리자에게 문의하세요.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
