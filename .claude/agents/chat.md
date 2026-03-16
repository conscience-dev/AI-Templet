---
name: chat
description: 채팅 UI 전문 에이전트. SSE 스트리밍, 마크다운 렌더링, 코드 복사 등 채팅 필수 컴포넌트 생성.
---

# 채팅 UI 에이전트

## 역할

SPEC.md에 **섹션 9 (에이전트 설정)** 또는 채팅 관련 모델 (`ChatThread`, `ChatMessage`)이 있을 때 실행.
백엔드 SSE 스트리밍이 이미 구현되어 있으므로 프론트엔드 채팅 컴포넌트 구현에 집중하는 전문 에이전트.

- Phase 10.5에서 관리자 에이전트와 함께 실행
- 또는 채팅 UI 개선/추가 시 독립 실행 가능

## 입력

1. `SPEC.md` — 섹션 9 (에이전트 설정: 모델명, 시스템 프롬프트)
2. `backend/app/routers/chat.py` — SSE 스트리밍 엔드포인트, 이벤트 타입 (`user_message`, `stream`, `done`, `error`)
3. `backend/app/schemas/chat.py` — `ThreadOut`, `MessageOut`, `AgentMessageIn`
4. `backend/app/utils/ai_client.py` — SSE 클라이언트 패턴 (`.claude/agents/agent.md` 참조)
5. `.claude/agents/frontend.md` — 컴포넌트 사용 패턴
6. `.claude/rules/design-system.md` — 디자인 토큰

## 디렉토리 구조

```
frontend/app/(authenticated)/chat/
├── layout.tsx              # 채팅 레이아웃 (스레드 사이드바 + 메인 영역)
├── page.tsx                # /chat → 빈 상태 또는 새 대화 시작
└── [id]/
    └── page.tsx            # /chat/:id → 대화 상세 (메시지 + 스트리밍)

frontend/components/chat/
├── thread-list.tsx         # 스레드 목록 사이드바
├── chat-messages.tsx       # 메시지 목록 (스크롤 영역)
├── chat-input.tsx          # 메시지 입력 폼
├── message-bubble.tsx      # 개별 메시지 버블 (사용자/AI)
├── markdown-renderer.tsx   # 마크다운 렌더러 (코드 하이라이팅)
└── code-block.tsx          # 코드 블록 + 복사 버튼

frontend/hooks/
├── use-chat.ts             # 스레드/메시지 CRUD 훅 (TanStack Query)
└── use-chat-stream.ts      # SSE 스트리밍 훅
```

## 필수 패키지

```bash
cd frontend && npm install marked @tailwindcss/typography
```

`tailwind.config.js`의 `plugins`에 추가:
```js
plugins: [require("@tailwindcss/typography")],
```

## 필수 기능 목록

| # | 기능 | 구현 방식 | 필수 |
|---|------|---------|------|
| 1 | 마크다운 파싱 | `marked` (GFM 모드) + `dangerouslySetInnerHTML` | **필수** |
| 2 | 코드 구문 강조 | `marked` 커스텀 renderer (코드 블록 + 복사 버튼) | **필수** |
| 3 | SSE 실시간 스트리밍 | `fetch` + `ReadableStream` (커스텀 훅) | **필수** |
| 4 | 메시지 전체 복사 | `navigator.clipboard.writeText()` + 호버 시 복사 버튼 | **필수** |
| 5 | 코드 블록 개별 복사 | 코드 블록 상단 언어 표시 + 복사 버튼 | **필수** |
| 6 | 사용자/AI 메시지 버블 | 아바타 구분 (User: 우측, AI: 좌측), 배경색 분리 | **필수** |
| 7 | 스트리밍 로딩 표시 | 커서 깜빡임 애니메이션 (`animate-pulse`) | **필수** |
| 8 | 자동 스크롤 | `scrollIntoView({ behavior: "smooth" })` + `useEffect` | **필수** |
| 9 | 스레드 목록 | 검색 + 생성/삭제 + 실시간 업데이트 (TanStack Query) | **필수** |
| 10 | 반응형 레이아웃 | 데스크탑: 사이드바+메인, 모바일: Sheet로 스레드 목록 | **필수** |
| 11 | 에러 처리 + 재시도 | 스트리밍 실패 시 재시도 버튼 + 토스트 알림 | **필수** |

## 백엔드 SSE 이벤트 구조

백엔드 `POST /v1/chat/threads/{thread_id}/agent`가 반환하는 SSE 이벤트:

```
data: {"event": "user_message", "data": {"id": "...", "type": "user", "message": "..."}}

data: {"event": "stream", "data": {"chunk": "텍", "accumulated": "텍스트"}}
data: {"event": "stream", "data": {"chunk": " 내용", "accumulated": "텍스트 내용"}}

data: {"event": "done", "data": {"id": "...", "type": "ai_assistant", "message": "텍스트 내용"}}

data: {"event": "error", "data": {"message": "에러 메시지"}}
```

- `user_message`: 사용자 메시지가 DB에 저장된 직후 발생
- `stream`: AI 응답 텍스트 청크 (chunk: 새 부분, accumulated: 누적 전체)
- `done`: AI 응답 완료, 최종 메시지가 DB에 저장됨
- `error`: 연결 오류 시 발생 (mock 응답과 함께 전송될 수 있음)

## 컴포넌트 패턴

### 마크다운 렌더러 (marked 기반)

> Claude 웹 UI 스타일: 다크 warm 코드 블록, 상단 언어 바

```tsx
// frontend/components/chat/markdown-renderer.tsx
"use client";

import { useMemo } from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
}

marked.setOptions({ gfm: true, breaks: true });

const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    const language = lang || "code";
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
      <div class="code-block-wrapper group relative my-4 overflow-hidden rounded-xl border border-border/40">
        <div class="flex items-center justify-between bg-[#2a2824] px-4 py-2">
          <span class="font-mono text-[12px] text-[#a39e93]">${language}</span>
          <button onclick="(function(btn){var code=btn.closest('.code-block-wrapper').querySelector('code').innerText;navigator.clipboard.writeText(code);btn.textContent='복사됨';setTimeout(function(){btn.textContent='복사'},2000)})(this)" class="rounded px-2 py-1 text-[12px] text-[#a39e93] hover:text-[#e8e4dc] transition-colors">복사</button>
        </div>
        <pre class="overflow-x-auto bg-[#1a1915] p-4 m-0"><code class="text-[13px] leading-relaxed text-[#e8e4dc]">${escaped}</code></pre>
      </div>`;
  },
  link({ href, text }: { href: string; text: string }): string {
    return \`<a href="\${href}" target="_blank" rel="noopener noreferrer" class="text-[#5B8DEF] hover:underline">\${text}</a>\`;
  },
  codespan({ text }: { text: string }): string {
    return \`<code class="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-mono">\${text}</code>\`;
  },
};

marked.use({ renderer });

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content) as string;
    } catch {
      return \`<p class="whitespace-pre-wrap">\${content}</p>\`;
    }
  }, [content]);

  if (!html) return null;

  return (
    <div
      className="prose prose-sm max-w-none prose-headings:text-DG prose-p:text-DG prose-li:text-DG prose-strong:text-DG"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

> **주의**: `code-block.tsx` 파일은 별도 생성하지 않음. 코드 블록 복사 기능은 `marked` 커스텀 renderer에서 인라인 HTML + onclick으로 처리.

### 메시지 버블

> Claude 웹 UI 스타일: 배경 없는 메시지, 좌측 아바타, 중앙 정렬 대화

```tsx
// frontend/components/chat/message-bubble.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  type: "user" | "ai_assistant";
  message: string;
  isStreaming?: boolean;
  createdAt?: string;
  userName?: string;
}

export function MessageBubble({
  type,
  message,
  isStreaming,
  createdAt,
  userName = "나",
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = type === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex gap-4">
      {/* 아바타 — Claude 스타일: 이니셜 또는 AI 아이콘 */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-medium",
        isUser
          ? "bg-[#d4a574]/15 text-[#c47833]"
          : "bg-[#d4a574]/10 text-[#c47833]"
      )}>
        {isUser ? userName.charAt(0) : <Sparkles className="h-4 w-4" />}
      </div>

      {/* 메시지 본문 — Claude 스타일: 배경 없음, prose 스타일 */}
      <div className="flex-1 space-y-1 pt-1">
        <div>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
              {message}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none
              prose-headings:text-foreground prose-headings:font-semibold
              prose-p:text-foreground prose-p:leading-relaxed
              prose-li:text-foreground
              prose-code:rounded prose-code:bg-[#f5f3ef] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px]
              prose-pre:rounded-xl prose-pre:bg-[#1a1915] prose-pre:text-[#e8e4dc]
              prose-a:text-[#c47833] prose-a:no-underline hover:prose-a:underline">
              <MarkdownRenderer content={message} />
            </div>
          )}
          {/* 스트리밍 커서 */}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-[#c47833]" />
          )}
        </div>

        {/* 복사 버튼 (호버 시 표시) */}
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "복사됨" : "복사"}
          </Button>
          {createdAt && (
            <span className="text-[11px] text-muted-foreground">{createdAt}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 채팅 입력

> Claude 웹 UI 스타일: 둥근 입력 컨테이너, 내부 전송 버튼

```tsx
// frontend/components/chat/chat-input.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onCancel,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setMessage("");
  }, [message, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-end gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-[#c47833]/40 focus-within:ring-1 focus-within:ring-[#c47833]/20 transition-all">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            disabled={disabled}
            className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0"
            rows={1}
          />
          {isStreaming ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 shrink-0 rounded-lg"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="h-8 w-8 shrink-0 rounded-lg bg-[#c47833] hover:bg-[#b06a2a] text-white disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
          AI는 실수를 할 수 있습니다. 중요한 정보는 직접 확인하세요.
        </p>
      </div>
    </div>
  );
}
```

### SSE 스트리밍 훅

```tsx
// frontend/hooks/use-chat-stream.ts
"use client";

import { useState, useCallback, useRef } from "react";

interface StreamState {
  isStreaming: boolean;
  accumulated: string;
  error: string | null;
}

export function useChatStream(threadId: string) {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    accumulated: "",
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      abortRef.current = new AbortController();
      setState({ isStreaming: true, accumulated: "", error: null });

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/chat/threads/${threadId}/agent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({ message }),
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) throw new Error("스트리밍 연결에 실패했습니다.");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.event === "stream") {
                setState((prev) => ({
                  ...prev,
                  accumulated: parsed.data.accumulated,
                }));
              } else if (parsed.event === "done") {
                setState((prev) => ({ ...prev, isStreaming: false }));
              } else if (parsed.event === "error") {
                setState((prev) => ({
                  ...prev,
                  error: parsed.data.message,
                  isStreaming: false,
                }));
              }
            } catch {
              // SSE 파싱 에러 무시
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            error: "메시지 전송에 실패했습니다. 다시 시도해주세요.",
            isStreaming: false,
          }));
        }
      }
    },
    [threadId]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return { ...state, sendMessage, cancel };
}
```

## API 훅 패턴

```tsx
// frontend/hooks/use-chat.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// 스레드 목록
export function useThreads() {
  return useQuery({
    queryKey: ["chat", "threads"],
    queryFn: () => api.get("/v1/chat/threads").then((res) => res.data),
  });
}

// 스레드 상세
export function useThread(threadId: string) {
  return useQuery({
    queryKey: ["chat", "threads", threadId],
    queryFn: () => api.get(`/v1/chat/threads/${threadId}`).then((res) => res.data),
    enabled: !!threadId,
  });
}

// 스레드 생성
export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string }) => api.post("/v1/chat/threads", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "threads"] }),
  });
}

// 스레드 삭제
export function useDeleteThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => api.delete(`/v1/chat/threads/${threadId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "threads"] }),
  });
}

// 메시지 목록
export function useMessages(threadId: string) {
  return useQuery({
    queryKey: ["chat", "threads", threadId, "messages"],
    queryFn: () =>
      api.get(`/v1/chat/threads/${threadId}/messages`).then((res) => res.data),
    enabled: !!threadId,
  });
}
```

## 자동 스크롤 패턴

```tsx
// 채팅 메시지 목록에서 사용
import { useEffect, useRef } from "react";

const bottomRef = useRef<HTMLDivElement>(null);
const scrollAreaRef = useRef<HTMLDivElement>(null);

// 새 메시지 또는 스트리밍 업데이트 시 자동 스크롤
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, streamingContent]);

// JSX
<div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
  {messages.map((msg) => (
    <MessageBubble key={msg.id} {...msg} />
  ))}
  {/* 스트리밍 중인 메시지 */}
  {isStreaming && (
    <MessageBubble type="ai_assistant" message={accumulated} isStreaming />
  )}
  <div ref={bottomRef} />
</div>
```

## 반응형 레이아웃 패턴

```tsx
// 데스크탑: 사이드바로 표시 / 모바일: Sheet 사용
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

// 데스크탑
<div className="hidden w-72 border-r border-bordercolor md:block">
  <ThreadList />
</div>

// 모바일
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-72 p-0">
      <ThreadList />
    </SheetContent>
  </Sheet>
</div>
```

## 체크리스트

### 패키지 설치
- [ ] `marked`, `@tailwindcss/typography` 설치
- [ ] `tailwind.config.js`에 `require("@tailwindcss/typography")` 플러그인 추가

### 컴포넌트 생성
- [ ] `frontend/components/chat/markdown-renderer.tsx` 생성 (marked 기반, code-block.tsx 불필요)
- [ ] `frontend/components/chat/message-bubble.tsx` 생성 (사용자/AI 아바타 구분 + 복사)
- [ ] `frontend/components/chat/thread-list.tsx` 생성 (검색 + 생성/삭제)
- [ ] `frontend/components/chat/chat-messages.tsx` 생성 (자동 스크롤 + 스트리밍 표시)
- [ ] `frontend/components/chat/chat-input.tsx` 생성 (Enter 전송, Shift+Enter 줄바꿈, 취소)

### 훅 생성
- [ ] `frontend/hooks/use-chat.ts` 생성 (스레드/메시지 CRUD)
- [ ] `frontend/hooks/use-chat-stream.ts` 생성 (SSE fetch + ReadableStream + 취소)

### 페이지 생성
- [ ] `frontend/app/(authenticated)/chat/layout.tsx` 생성 (스레드 사이드바 + 메인)
- [ ] `frontend/app/(authenticated)/chat/page.tsx` 생성 (빈 상태 / 새 대화)
- [ ] `frontend/app/(authenticated)/chat/[id]/page.tsx` 생성 (대화 상세)

### 기능 검증
- [ ] SSE 스트리밍 동작 확인 (실시간 텍스트 추가)
- [ ] 마크다운 렌더링 확인 (GFM 테이블, 코드 블록, 링크, 인용)
- [ ] 코드 블록 복사 동작 확인
- [ ] 메시지 전체 복사 동작 확인
- [ ] 자동 스크롤 동작 확인
- [ ] 반응형 레이아웃 확인 (모바일 Sheet)
- [ ] 에러 시 재시도 동작 확인
- [ ] `cd frontend && npm run build` — 빌드 성공
- [ ] `cd frontend && npm run lint` — 린트 통과

---

## ⚠️ 주의사항

### 마크다운 라이브러리

- **react-markdown 사용 금지** — v9+ ESM-only → Next.js Turbopack 클라이언트 렌더링 실패. `marked` (CJS 호환) 사용
- `@tailwindcss/typography` 미설치 시 `prose` 클래스 미작동
- marked v13+ renderer API 변경 — 커스텀 renderer 최소화 (코드/링크만), 나머지는 기본 + prose

### 백엔드 API 연동

| 문제 | 원인 | 해결 |
|------|------|------|
| `threads?.map is not a function` | 스레드 목록이 `PaginatedResponse` (results 안에 배열) | `getThreads()`에서 `.results` 추출 |
| SSE 스트리밍 끊김 | agent endpoint에서 에러 시 stream 중단 | `onError` 콜백 + toast 알림 처리 |
