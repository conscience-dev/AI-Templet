"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  Terminal,
  KeyRound,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// --- 타입 ---

interface TokenStatus {
  is_registered: boolean;
  is_active: boolean;
  expires_at: string | null;
  last_refreshed_at: string | null;
}

interface TokenPayload {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// --- API 훅 ---

function useTokenStatus() {
  return useQuery<TokenStatus>({
    queryKey: ["claude-token-status"],
    queryFn: () =>
      api.get("/v1/auth/claude-token/status").then((res) => res.data),
    retry: false,
  });
}

function useRegisterToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TokenPayload) =>
      api.post("/v1/auth/claude-token", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["claude-token-status"] }),
  });
}

function useRefreshToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/v1/auth/claude-token/refresh"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["claude-token-status"] }),
  });
}

function useTestToken() {
  return useMutation({
    mutationFn: () =>
      api.post("/v1/auth/claude-token/test").then((res) => res.data),
  });
}

// --- 유틸 ---

function parseClaudeJson(raw: string): TokenPayload {
  const parsed = JSON.parse(raw);
  const oauth = parsed.claudeAiOauth || parsed;

  if (!oauth.accessToken && !oauth.access_token) {
    throw new Error("accessToken 필드를 찾을 수 없습니다.");
  }
  if (!oauth.refreshToken && !oauth.refresh_token) {
    throw new Error("refreshToken 필드를 찾을 수 없습니다.");
  }

  return {
    access_token: oauth.accessToken || oauth.access_token,
    refresh_token: oauth.refreshToken || oauth.refresh_token,
    expires_at: oauth.expiresAt || oauth.expires_at || Date.now() + 3600000,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- 메인 컴포넌트 ---

export function ClaudeTokenSync() {
  const { data: status, isLoading } = useTokenStatus();

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
              <KeyRound className="h-5 w-5 text-[#c47833]" />
            </div>
            <div>
              <CardTitle>Claude OAuth 토큰</CardTitle>
              <CardDescription>로딩 중...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const isRegistered = status?.is_registered ?? false;

  return (
    <Card className="rounded-2xl border-border/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
            <KeyRound className="h-5 w-5 text-[#c47833]" />
          </div>
          <div>
            <CardTitle>Claude OAuth 토큰</CardTitle>
            <CardDescription>
              Claude Code API 인증 토큰을 관리합니다.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isRegistered && status ? (
          <RegisteredView status={status} />
        ) : (
          <UnregisteredView />
        )}
      </CardContent>
    </Card>
  );
}

// --- 토큰 미등록 뷰 ---

function UnregisteredView() {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const registerToken = useRegisterToken();

  const handleSubmit = useCallback(
    async (raw: string) => {
      setMessage(null);
      try {
        const payload = parseClaudeJson(raw);
        await registerToken.mutateAsync(payload);
        setMessage({ type: "success", text: "토큰이 등록되었습니다." });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "토큰 등록에 실패했습니다.";
        setMessage({ type: "error", text: errorMessage });
      }
    },
    [registerToken],
  );

  return (
    <div className="space-y-5">
      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-[#f5f3ef] p-1">
        <button
          onClick={() => setMode("upload")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-caption font-medium transition-colors",
            mode === "upload"
              ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Upload className="h-4 w-4" />
          파일 업로드
        </button>
        <button
          onClick={() => setMode("paste")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-caption font-medium transition-colors",
            mode === "paste"
              ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="h-4 w-4" />
          직접 입력
        </button>
      </div>

      {mode === "upload" ? (
        <FileUploadArea
          onSubmit={handleSubmit}
          isLoading={registerToken.isPending}
        />
      ) : (
        <PasteArea
          onSubmit={handleSubmit}
          isLoading={registerToken.isPending}
        />
      )}

      {/* macOS 명령어 안내 */}
      <CommandHint />

      {/* 메시지 */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-caption font-medium",
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600",
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}

// --- 파일 업로드 ---

function FileUploadArea({
  onSubmit,
  isLoading,
}: {
  onSubmit: (raw: string) => void;
  isLoading: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onSubmit(text);
      };
      reader.readAsText(file);
    },
    [onSubmit],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
        isDragOver
          ? "border-[#c47833]/40 bg-[#d4a574]/5"
          : "border-border/60 hover:border-[#c47833]/30 hover:bg-[#faf9f7]",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
        <Upload className="h-6 w-6 text-[#c47833]" />
      </div>
      <div className="text-center">
        <p className="text-bodymedium font-medium text-foreground">
          {isLoading ? "업로드 중..." : ".claude.json 파일을 드래그하세요"}
        </p>
        <p className="mt-1 text-caption text-muted-foreground">
          또는 클릭하여 파일 선택
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// --- 직접 입력 ---

function PasteArea({
  onSubmit,
  isLoading,
}: {
  onSubmit: (raw: string) => void;
  isLoading: boolean;
}) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"claudeAiOauth": {"accessToken": "...", "refreshToken": "...", "expiresAt": ...}}'
        rows={6}
        className="w-full resize-none rounded-xl border border-border/60 bg-white px-4 py-3 font-mono text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#c47833]/20 focus:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      />
      <Button
        onClick={() => onSubmit(text)}
        disabled={!text.trim() || isLoading}
        className="h-11 w-full rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a] disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        토큰 등록
      </Button>
    </div>
  );
}

// --- macOS 명령어 안내 ---

function CommandHint() {
  const [copied, setCopied] = useState(false);
  const command =
    'security find-generic-password -s "Claude Code-credentials" -w | pbcopy';

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="rounded-xl border border-border/60 bg-[#faf9f7] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-[#c47833]" />
        <span className="text-caption font-medium text-foreground">
          macOS에서 토큰 추출
        </span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg bg-[#1a1915] px-3 py-2 font-mono text-tiny text-[#e8e4dc]">
          {command}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#d4a574]/10 hover:text-[#c47833]"
          title="복사"
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// --- 토큰 등록 완료 뷰 ---

function RegisteredView({ status }: { status: TokenStatus }) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showReplace, setShowReplace] = useState(false);

  const refreshToken = useRefreshToken();
  const testToken = useTestToken();
  const registerToken = useRegisterToken();

  const isActive = status.is_active;
  const expiresAt = status.expires_at;
  const lastRefreshed = status.last_refreshed_at;

  const handleRefresh = async () => {
    setMessage(null);
    try {
      await refreshToken.mutateAsync();
      setMessage({ type: "success", text: "토큰이 갱신되었습니다." });
    } catch {
      setMessage({ type: "error", text: "토큰 갱신에 실패했습니다." });
    }
  };

  const handleTest = async () => {
    setMessage(null);
    try {
      const result = await testToken.mutateAsync();
      setMessage({
        type: "success",
        text: result.message || "API 테스트 성공",
      });
    } catch {
      setMessage({ type: "error", text: "API 테스트에 실패했습니다." });
    }
  };

  const handleReplace = async (raw: string) => {
    setMessage(null);
    try {
      const payload = parseClaudeJson(raw);
      await registerToken.mutateAsync(payload);
      setMessage({ type: "success", text: "토큰이 교체되었습니다." });
      setShowReplace(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "토큰 교체에 실패했습니다.";
      setMessage({ type: "error", text: errorMessage });
    }
  };

  return (
    <div className="space-y-5">
      {/* 상태 정보 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-caption text-muted-foreground">상태</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-tiny font-medium",
              isActive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isActive ? "bg-green-500" : "bg-red-500",
              )}
            />
            {isActive ? "활성" : "만료됨"}
          </span>
        </div>

        <Separator className="border-border/40" />

        <div className="flex items-center justify-between">
          <span className="text-caption text-muted-foreground">만료 일시</span>
          <span className="text-caption font-medium text-foreground">
            {formatDate(expiresAt)}
          </span>
        </div>

        <Separator className="border-border/40" />

        <div className="flex items-center justify-between">
          <span className="text-caption text-muted-foreground">
            마지막 갱신
          </span>
          <span className="text-caption font-medium text-foreground">
            {formatDate(lastRefreshed)}
          </span>
        </div>
      </div>

      <Separator className="border-border/40" />

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleRefresh}
          disabled={refreshToken.isPending}
          className="h-10 rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a] disabled:opacity-50"
        >
          {refreshToken.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          토큰 갱신
        </Button>

        <Button
          onClick={() => setShowReplace(!showReplace)}
          variant="outline"
          className="h-10 rounded-xl border-border/60 transition-colors hover:bg-[#faf9f7]"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          토큰 교체
        </Button>

        <Button
          onClick={handleTest}
          disabled={testToken.isPending}
          variant="outline"
          className="h-10 rounded-xl border-border/60 transition-colors hover:bg-[#faf9f7]"
        >
          {testToken.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          API 테스트
        </Button>
      </div>

      {/* 토큰 교체 영역 */}
      {showReplace && (
        <div className="space-y-3 rounded-xl border border-border/60 bg-[#faf9f7] p-4">
          <p className="text-caption font-medium text-foreground">
            새 토큰 JSON 입력
          </p>
          <ReplaceTokenArea
            onSubmit={handleReplace}
            isLoading={registerToken.isPending}
          />
        </div>
      )}

      {/* 메시지 */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-caption font-medium",
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600",
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}

// --- 토큰 교체 입력 ---

function ReplaceTokenArea({
  onSubmit,
  isLoading,
}: {
  onSubmit: (raw: string) => void;
  isLoading: boolean;
}) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"claudeAiOauth": {"accessToken": "...", ...}}'
        rows={4}
        className="w-full resize-none rounded-xl border border-border/60 bg-white px-4 py-3 font-mono text-caption text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#c47833]/20 focus:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      />
      <Button
        onClick={() => onSubmit(text)}
        disabled={!text.trim() || isLoading}
        className="h-10 rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a] disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRightLeft className="mr-2 h-4 w-4" />
        )}
        교체 확인
      </Button>
    </div>
  );
}
