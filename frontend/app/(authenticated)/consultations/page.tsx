"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useConsultations } from "@/hooks/use-consultations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// 결과 배지 스타일
const resultBadgeStyles: Record<string, string> = {
  A가망고객: "bg-green-50 text-green-700",
  B지속고객: "bg-amber-50 text-amber-700",
  C종료의지없음: "bg-red-50 text-red-700",
};

export default function ConsultationsPage() {
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useConsultations({
    search: search || undefined,
    order: orderFilter || undefined,
    page,
  });

  const consultations = data?.results ?? [];
  const totalPages = data?.page_cnt ?? 1;

  // 클라이언트 사이드 결과 필터링
  const filtered = resultFilter
    ? consultations.filter((c) => c.result === resultFilter)
    : consultations;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">상담 기록 관리</h1>
        <Link href="/consultations/new">
          <Button className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]">
            <Plus className="mr-2 h-4 w-4" />
            신규 상담 등록
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="가맹문의자 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border-border pl-10"
          />
        </div>
        <Select
          value={orderFilter}
          onValueChange={(v) => {
            setOrderFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[140px] rounded-xl border-border">
            <SelectValue placeholder="상담 차수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 차수</SelectItem>
            <SelectItem value="1차">1차</SelectItem>
            <SelectItem value="2차">2차</SelectItem>
            <SelectItem value="3차">3차</SelectItem>
            <SelectItem value="4차이상">4차 이상</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={resultFilter}
          onValueChange={(v) => {
            setResultFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-border">
            <SelectValue placeholder="결과" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 결과</SelectItem>
            <SelectItem value="A가망고객">A 가망고객</SelectItem>
            <SelectItem value="B지속고객">B 지속고객</SelectItem>
            <SelectItem value="C종료의지없음">C 종료의지없음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">가맹문의자</TableHead>
              <TableHead className="text-caption font-medium">상담차수</TableHead>
              <TableHead className="text-caption font-medium">상담일</TableHead>
              <TableHead className="text-caption font-medium">상담자</TableHead>
              <TableHead className="text-caption font-medium">결과</TableHead>
              <TableHead className="text-caption font-medium">다음조치</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <MessageSquare className="h-6 w-6 text-[#c47833]" />
                    </div>
                    <p className="text-bodymedium text-muted-foreground">
                      상담 기록이 없습니다
                    </p>
                    <Link href="/consultations/new">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                      >
                        첫 상담 등록하기
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell className="font-medium">{item.prospect_name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.consulted_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>{item.consulted_by_name}</TableCell>
                  <TableCell>
                    {item.result && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                          resultBadgeStyles[item.result] ??
                            "bg-[#f5f3ef] text-muted-foreground",
                        )}
                      >
                        {item.result}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {item.next_action}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border/40 px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <span className="text-caption text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
