"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Droplets,
  Hexagon,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Thermometer,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BeeIcon } from "@/components/icons/bee-icon";
import { useSendMessage, type ChatMessage } from "@/hooks/use-chat";
import { useAlerts, useDismissAlert, useResolveAlert } from "@/hooks/use-alert";
import { useHiveSummary, type HiveLatest } from "@/hooks/use-hive";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(text: string): string {
  return marked.parse(text) as string;
}

/** 마크다운/HTML 태그 + 이모지를 제거하고 순수 텍스트만 추출 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[_~]/g, "")
    .replace(/[-*] /g, "")
    .replace(new RegExp("[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{FE00}-\\u{FE0F}\\u{1F900}-\\u{1F9FF}\\u{1FA00}-\\u{1FA6F}\\u{1FA70}-\\u{1FAFF}\\u{200D}\\u{20E3}]", "gu"), "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function MainChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [assistantBuffer, setAssistantBuffer] = useState("");
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const assistantBufferRef = useRef("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [prevSensorData, setPrevSensorData] = useState<
    Record<string, { temp: number; humidity: number }>
  >({});
  const [changedHiveIds, setChangedHiveIds] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [koVoices, setKoVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pendingSendRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { send, isStreaming } = useSendMessage();
  const { data: alertsData } = useAlerts({ resolved: false });
  const alerts = alertsData?.results ?? [];
  const { data: hiveSummary } = useHiveSummary();
  const dismissAlert = useDismissAlert();
  const resolveAlert = useResolveAlert();

  const unresolvedCount = alerts.length;

  // 한국어 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      const all = window.speechSynthesis?.getVoices() ?? [];
      const ko = all.filter((v) => v.lang.startsWith("ko"));
      if (ko.length > 0) setKoVoices(ko);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // TTS 음성 출력
  const speak = useCallback((text: string, msgId?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const plain = stripMarkdown(text);
    if (!plain) return;

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = "ko-KR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (koVoices.length > 0) {
      utterance.voice = koVoices[selectedVoiceIdx] ?? koVoices[0];
    }

    if (msgId) {
      setSpeakingMsgId(msgId);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
    }

    window.speechSynthesis.speak(utterance);
  }, [koVoices, selectedVoiceIdx]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  }, []);

  // 음성 인식 초기화
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    setSpeechSupported(true);
    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 음성 감지될 때마다 무음 타이머 리셋
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInputValue(finalTranscript || interimTranscript);

      // final result 받으면 즉시 종료
      if (finalTranscript) {
        recognition.stop();
        return;
      }

      // interim만 있으면 3초 무음 후 자동 종료
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("마이크 권한이 차단되어 있습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
      } else if (event.error === "no-speech") {
        // 음성이 감지되지 않음 - 무시
      } else {
        // eslint-disable-next-line no-console
        console.error("음성 인식 오류:", event.error, event.message);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
        // 5초간 아무 음성 없으면 자동 종료
        silenceTimerRef.current = setTimeout(() => {
          recognitionRef.current?.stop();
        }, 5000);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("음성 인식 시작 실패:", err);
        alert("음성 인식을 시작할 수 없습니다. 마이크 권한을 확인해주세요.");
      }
    }
  }, [isListening]);

  // 음성 인식 끝나면 자동 전송
  useEffect(() => {
    if (!isListening && inputValue.trim() && pendingSendRef.current) {
      pendingSendRef.current = false;
      const timer = setTimeout(() => {
        if (inputValue.trim() && !isStreaming) {
          handleSend(inputValue);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    if (isListening) {
      pendingSendRef.current = true;
    }
  }, [isListening]);

  // 센서 데이터 변동 감지
  useEffect(() => {
    if (!hiveSummary?.hives) return;
    const changed = new Set<string>();
    const newData: Record<string, { temp: number; humidity: number }> = {};

    for (const hive of hiveSummary.hives) {
      if (hive.temperature === null) continue;
      newData[hive.hive_id] = {
        temp: hive.temperature,
        humidity: hive.humidity ?? 0,
      };
      const prev = prevSensorData[hive.hive_id];
      if (
        prev &&
        (prev.temp !== hive.temperature || prev.humidity !== (hive.humidity ?? 0))
      ) {
        changed.add(hive.hive_id);
      }
    }

    if (changed.size > 0) {
      setChangedHiveIds(changed);
      const timer = setTimeout(() => setChangedHiveIds(new Set()), 1200);
      return () => clearTimeout(timer);
    }
    setPrevSensorData(newData);
  }, [hiveSummary]);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, assistantBuffer]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isStreaming) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      session_id: currentSessionId ?? "",
      role: "user",
      content: message.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    assistantBufferRef.current = "";
    setAssistantBuffer("");
    setThinkingLabel(null);

    await send(
      { message: message.trim(), session_id: currentSessionId ?? undefined },
      {
        onThinking: (toolLabel) => {
          setThinkingLabel(toolLabel);
        },
        onChunk: (content) => {
          setThinkingLabel(null);
          assistantBufferRef.current += content;
          setAssistantBuffer(assistantBufferRef.current);
        },
        onDone: (sessionId) => {
          setThinkingLabel(null);
          const finalContent = assistantBufferRef.current;
          setCurrentSessionId(sessionId);
          if (finalContent) {
            const msgId = `assistant-${Date.now()}`;
            const assistantMsg: ChatMessage = {
              id: msgId,
              session_id: sessionId,
              role: "assistant",
              content: finalContent,
              created_at: new Date().toISOString(),
            };
            setMessages((msgs) => [...msgs, assistantMsg]);
            // 자동 음성 출력
            if (ttsEnabled) {
              speak(finalContent, msgId);
            }
          }
          assistantBufferRef.current = "";
          setAssistantBuffer("");
        },
        onError: () => {
          setThinkingLabel(null);
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              session_id: currentSessionId ?? "",
              role: "assistant",
              content:
                "죄송합니다. 응답을 받는 중 오류가 발생했습니다. 다시 시도해 주세요.",
              created_at: new Date().toISOString(),
            },
          ]);
          assistantBufferRef.current = "";
          setAssistantBuffer("");
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissingIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        dismissAlert.mutate(id);
        setDismissingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 250);
    },
    [dismissAlert]
  );

  const handleResolve = useCallback(
    (id: string) => {
      setDismissingIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        resolveAlert.mutate({ id, is_resolved: true });
        setDismissingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 250);
    },
    [resolveAlert]
  );

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setAssistantBuffer("");
    inputRef.current?.focus();
  };

  const quickQuestions = ["전체 상태 요약", "문제 있는 벌통 보기", "오늘 경고 내역"];

  const statusConfig: Record<string, { dot: string; pulse: boolean }> = {
    정상: { dot: "bg-green-500", pulse: false },
    주의: { dot: "bg-yellow-500", pulse: true },
    경고: { dot: "bg-rd-500", pulse: true },
    데이터없음: { dot: "bg-paper-400", pulse: false },
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* ── 좌측: 채팅 영역 ── */}
      <div className="flex flex-col flex-1">
        {/* 대화 메시지 */}
        <div ref={scrollRef} className="flex-1 px-4 py-4 space-y-4 overflow-y-auto md:px-8">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center pt-24 text-center animate-fade-in">
                <div
                  className="flex items-center justify-center w-16 h-16 mb-5 rounded-full animate-scale-in"
                  style={{ backgroundColor: "hsl(36, 25%, 93%)" }}
                >
                  <BeeIcon className="h-9 w-9" />
                </div>
                <h2
                  className="mb-2 animate-slide-up text-heading1 text-foreground"
                  style={{ animationDelay: "100ms", animationFillMode: "both" }}
                >
                  안녕하세요!
                </h2>
                <p
                  className="animate-slide-up text-bodylarge text-muted-foreground"
                  style={{ animationDelay: "200ms", animationFillMode: "both" }}
                >
                  포비에게 벌통 상태를 물어보세요.
                </p>
                <p
                  className="mt-1 animate-slide-up text-bodymedium text-muted-foreground"
                  style={{ animationDelay: "300ms", animationFillMode: "both" }}
                >
                  아래 버튼을 눌러 빠르게 질문할 수도 있습니다.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "mb-4 flex",
                  msg.role === "user" ? "animate-slide-in-right justify-end" : "animate-slide-up justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div
                    className="flex items-center justify-center w-8 h-8 mt-1 mr-3 rounded-full shrink-0 animate-scale-in"
                    style={{ backgroundColor: "hsl(36, 25%, 93%)" }}
                  >
                    <BeeIcon className="w-6 h-6" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-3 text-bodymedium leading-relaxed",
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md text-white"
                      : "rounded-2xl rounded-bl-md border shadow-paper text-foreground"
                  )}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: "hsl(24, 9%, 28%)" }
                      : { backgroundColor: "hsl(36, 25%, 95%)", borderColor: "hsl(30, 18%, 88%)" }
                  }
                >
                  {msg.role === "assistant" ? (
                    <>
                      <div
                        className="prose-sm prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                      <button
                        onClick={() =>
                          speakingMsgId === msg.id
                            ? stopSpeaking()
                            : speak(msg.content, msg.id)
                        }
                        className="flex items-center gap-1 px-2 py-1 mt-2 transition-colors rounded-md text-tiny text-muted-foreground hover:bg-paper-200 hover:text-foreground"
                        aria-label={speakingMsgId === msg.id ? "음성 중지" : "음성으로 듣기"}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>중지</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>듣기</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start mb-4 animate-slide-up">
                <div
                  className="flex items-center justify-center w-8 h-8 mt-1 mr-3 rounded-full shrink-0 animate-scale-in"
                  style={{ backgroundColor: "hsl(36, 25%, 93%)" }}
                >
                  <Hexagon className="w-4 h-4" strokeWidth={1.5} style={{ color: "hsl(24, 9%, 28%)" }} />
                </div>
                <div
                  className="max-w-[80%] rounded-2xl rounded-bl-md border px-4 py-3 text-bodymedium leading-relaxed shadow-paper"
                  style={{ backgroundColor: "hsl(36, 25%, 95%)", borderColor: "hsl(30, 18%, 88%)" }}
                >
                  {assistantBuffer ? (
                    <div
                      className="prose-sm prose streaming-cursor max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(assistantBuffer) }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      {[0, 200, 400].map((delay) => (
                        <span
                          key={delay}
                          className="inline-block w-2 h-2 rounded-full animate-pulse-dot bg-paper-400"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                      {thinkingLabel && (
                        <span className="ml-1 text-caption text-muted-foreground">
                          {thinkingLabel} 중...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 입력 영역 */}
        <div className="px-4 pt-3 pb-4 border-t md:px-8" style={{ borderColor: "hsl(30, 15%, 89%)" }}>
          <div className="max-w-3xl mx-auto">
            {/* 빠른 질문 */}
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {quickQuestions.map((q, idx) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(q)}
                  disabled={isStreaming}
                  className="px-4 py-2 transition-all duration-200 rounded-full animate-slide-up border-border bg-secondary text-bodybtn text-foreground hover:scale-105 hover:bg-paper-200 active:scale-95"
                  style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
                >
                  {q}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                disabled={isStreaming}
                className="px-4 py-2 transition-all duration-200 rounded-full animate-slide-up border-border text-bodybtn text-muted-foreground hover:scale-105 hover:bg-paper-200 active:scale-95"
                style={{ animationDelay: "180ms", animationFillMode: "both" }}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                새 대화
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTtsEnabled((v) => !v);
                  if (ttsEnabled) stopSpeaking();
                }}
                className={cn(
                  "animate-slide-up rounded-full border-border px-4 py-2 text-bodybtn transition-all duration-200 hover:scale-105 hover:bg-paper-200 active:scale-95",
                  ttsEnabled ? "text-foreground" : "text-muted-foreground"
                )}
                style={{ animationDelay: "240ms", animationFillMode: "both" }}
              >
                {ttsEnabled ? (
                  <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="mr-1.5 h-3.5 w-3.5" />
                )}
                {ttsEnabled ? "음성 켜짐" : "음성 꺼짐"}
              </Button>
              {ttsEnabled && koVoices.length > 1 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoicePicker((v) => !v)}
                    className="px-3 py-2 transition-all duration-200 rounded-full animate-slide-up border-border text-bodybtn text-muted-foreground hover:scale-105 hover:bg-paper-200 active:scale-95"
                    style={{ animationDelay: "300ms", animationFillMode: "both" }}
                  >
                    {koVoices[selectedVoiceIdx]?.name.replace("com.apple.voice.compact.", "").replace("com.apple.speech.synthesis.voice.", "") ?? "음성"}
                  </Button>
                  {showVoicePicker && (
                    <div className="absolute left-0 w-48 p-1 mb-2 bg-white border bottom-full rounded-xl shadow-paper-md" style={{ borderColor: "hsl(30, 18%, 88%)" }}>
                      {koVoices.map((v, idx) => (
                        <button
                          key={v.name}
                          onClick={() => {
                            setSelectedVoiceIdx(idx);
                            setShowVoicePicker(false);
                            // 미리듣기
                            window.speechSynthesis?.cancel();
                            const u = new SpeechSynthesisUtterance("안녕하세요");
                            u.voice = v;
                            u.lang = "ko-KR";
                            u.rate = 1.05;
                            window.speechSynthesis?.speak(u);
                          }}
                          className={cn(
                            "flex w-full items-center rounded-lg px-3 py-2 text-caption transition-colors hover:bg-paper-100",
                            idx === selectedVoiceIdx ? "bg-paper-200 font-semibold text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {v.name.replace("com.apple.voice.compact.", "").replace("com.apple.speech.synthesis.voice.", "")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 음성 + 입력 */}
            <div className="flex items-center gap-2">
              <button
                onClick={speechSupported ? toggleListening : () => alert("이 브라우저에서는 음성 인식을 지원하지 않습니다.")}
                disabled={isStreaming}
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200",
                  "hover:brightness-90 hover:scale-105 active:scale-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isListening && "mic-recording"
                )}
                style={{ backgroundColor: isListening ? "hsl(0, 70%, 55%)" : "hsl(24, 9%, 28%)" }}
                aria-label={isListening ? "음성 인식 중지" : "음성으로 질문하기"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <form onSubmit={handleSubmit} className="flex items-center flex-1 gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? "듣고 있어요..." : "포비에게 물어보세요"}
                    disabled={isStreaming}
                    className={cn(
                      "h-12 w-full rounded-xl border-border bg-white text-bodymedium transition-all duration-200 placeholder:text-muted-foreground focus-visible:shadow-paper-md focus-visible:ring-accent",
                      isListening && "border-rd ring-2 ring-rd/20"
                    )}
                  />
                  {isListening && (
                    <span className="absolute -translate-y-1/2 right-3 top-1/2">
                      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-rd" />
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="w-12 h-12 p-0 transition-all duration-200 shrink-0 rounded-xl bg-primary text-primary-foreground hover:brightness-90 hover:scale-105 active:scale-90"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── 우측: 모니터링 패널 ── */}
      <div
        className={cn(
          "hidden h-full flex-col border-l transition-all duration-300 md:flex",
          panelOpen ? "w-72 lg:w-80" : "w-12"
        )}
        style={{ borderColor: "hsl(30, 15%, 89%)" }}
      >
        {panelOpen ? (
          <div className="flex flex-col h-full overflow-hidden animate-fade-in">
            {/* 패널 헤더 */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "hsl(30, 15%, 89%)" }}
            >
              <span className="text-heading4 text-foreground">모니터링</span>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 transition-colors rounded-md text-muted-foreground hover:bg-paper-200 hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 벌통 현황 */}
            {hiveSummary && hiveSummary.hives.length > 0 && (
              <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(30, 15%, 89%)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-caption text-foreground">벌통 현황</span>
                  <div className="flex items-center gap-2 text-tiny text-muted-foreground">
                    <span>{hiveSummary.total_hives}개</span>
                    {hiveSummary.warning_hives + hiveSummary.critical_hives > 0 && (
                      <span className="flex items-center gap-0.5 text-rd">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="animate-number-tick">
                          {hiveSummary.warning_hives + hiveSummary.critical_hives}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {hiveSummary.hives.map((hive: HiveLatest, idx: number) => {
                    const cfg = statusConfig[hive.status] ?? statusConfig["데이터없음"];
                    const isChanged = changedHiveIds.has(hive.hive_id);
                    return (
                      <div
                        key={hive.hive_id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300",
                          isChanged && "ring-1 ring-accent/30",
                          cfg.pulse && "animate-hive-pulse"
                        )}
                        style={{
                          backgroundColor: "hsl(36, 33%, 97%)",
                          borderColor: isChanged ? "hsl(24, 60%, 52%)" : "hsl(30, 18%, 88%)",
                          animationDelay: `${idx * 150}ms`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                              cfg.dot,
                              cfg.pulse && "status-dot-warning"
                            )}
                          />
                          <span className="font-semibold text-caption text-foreground">{hive.hive_no}</span>
                        </div>
                        {hive.temperature !== null ? (
                          <div className="flex items-center gap-2 text-tiny text-muted-foreground">
                            <span className={cn("flex items-center gap-0.5 sensor-value", isChanged && "sensor-value-changed")}>
                              <Thermometer className="h-2.5 w-2.5" />
                              {hive.temperature.toFixed(1)}&deg;
                            </span>
                            <span className={cn("flex items-center gap-0.5 sensor-value", isChanged && "sensor-value-changed")}>
                              <Droplets className="h-2.5 w-2.5" />
                              {hive.humidity?.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-tiny text-muted-foreground">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 알림 목록 */}
            <div className="flex-1 px-4 py-3 overflow-y-auto">
              <div className="mb-2 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-caption text-foreground">알림</span>
                {unresolvedCount > 0 && (
                  <span className="flex h-4 min-w-4 animate-scale-in items-center justify-center rounded-full bg-rd px-1 text-[10px] font-bold text-white">
                    {unresolvedCount}
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-green-8">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-caption text-muted-foreground">알림이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {alerts.map((a, idx) => {
                    const isCritical = a.severity === "critical";
                    const isDismissing = dismissingIds.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "group rounded-lg border px-3 py-2.5",
                          isCritical ? "border-rd-200 bg-rd-4" : "border-yellow-200 bg-yellow-50",
                          isDismissing ? "animate-alert-exit" : "animate-alert-enter"
                        )}
                        style={{
                          animationDelay: isDismissing ? "0ms" : `${idx * 60}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <AlertTriangle
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              isCritical ? "text-rd animate-pulse" : "text-yellow-600"
                            )}
                          />
                          <span
                            className={cn("flex-1 text-caption leading-snug", isCritical ? "text-rd-800" : "text-yellow-800")}
                          >
                            <span className="font-semibold">{a.hive_no}</span> — {a.message}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="rounded-md px-2 py-0.5 text-tiny font-medium text-green-700 transition-all hover:bg-green-8"
                          >
                            해결
                          </button>
                          <button
                            onClick={() => handleDismiss(a.id)}
                            className="rounded-md px-2 py-0.5 text-tiny font-medium text-muted-foreground transition-all hover:bg-rd-8 hover:text-rd"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 접힌 상태 */
          <div className="flex flex-col items-center h-full gap-2 pt-3">
            <button
              onClick={() => setPanelOpen(true)}
              className="relative p-2 transition-colors rounded-lg text-muted-foreground hover:bg-paper-200 hover:text-foreground"
              title="모니터링 패널 열기"
            >
              <Hexagon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPanelOpen(true)}
              className="relative p-2 transition-colors rounded-lg text-muted-foreground hover:bg-paper-200 hover:text-foreground"
              title="알림 열기"
            >
              <Bell className="w-5 h-5" />
              {unresolvedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 animate-scale-in items-center justify-center rounded-full bg-rd px-0.5 text-[9px] font-bold text-white">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
