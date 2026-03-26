"use client";

import { Settings } from "lucide-react";

import { ClaudeTokenSync } from "@/components/settings/claude-token-sync";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
          <Settings className="h-5 w-5 text-[#c47833]" />
        </div>
        <div>
          <h1 className="text-heading1 text-foreground">시스템 설정</h1>
          <p className="text-caption text-muted-foreground">
            시스템 연동 및 인증 설정을 관리합니다.
          </p>
        </div>
      </div>

      {/* 설정 섹션 */}
      <div className="max-w-2xl space-y-6">
        <ClaudeTokenSync />
      </div>
    </div>
  );
}
