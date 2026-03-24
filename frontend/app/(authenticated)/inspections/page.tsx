"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useInspections } from "@/hooks/use-inspections";
import { useStores } from "@/hooks/use-stores";
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

const scoreBadge = (score: number | null, type: "quality" | "hygiene") => {
  if (score === null || score === undefined) return "bg-[#f5f3ef] text-muted-foreground";
  // 점수 기반으로 배지 색상 결정 (70 이상 양호, 미만 미흡)
  if (score >= 70) return "bg-green-50 text-green-700";
  return "bg-red-50 text-red-700";
};

const scoreLabel = (score: number | null) => {
  if (score === null || score === undefined) return "-";
  return score >= 70 ? "양호" : "미흡";
};

export default function InspectionsPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useInspections({
    search: search || undefined,
    store_id: storeFilter ? Number(storeFilter) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
  });

  const { data: storesData } = useStores({ page: 1 });
  const stores = storesData?.results ?? [];

  const inspections = data?.results ?? [];
  const totalPages = data?.page_cnt ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">점포 점검 관리</h1>
        <Link href="/inspections/new">
          <Button className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]">
            <Plus className="mr-2 h-4 w-4" />
            신규 점검 등록
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border-border pl-10"
          />
        </div>
        <Select
          value={storeFilter}
          onValueChange={(v) => {
            setStoreFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-border">
            <SelectValue placeholder="점포 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 점포</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="h-11 w-[150px] rounded-xl border-border"
          placeholder="시작일"
        />
        <span className="text-muted-foreground">~</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="h-11 w-[150px] rounded-xl border-border"
          placeholder="종료일"
        />
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">점포명</TableHead>
              <TableHead className="text-caption font-medium">점검일</TableHead>
              <TableHead className="text-caption font-medium">점검자</TableHead>
              <TableHead className="text-caption font-medium">위생상태</TableHead>
              <TableHead className="text-caption font-medium">서비스</TableHead>
              <TableHead className="text-caption font-medium">종합점수</TableHead>
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
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <ClipboardCheck className="h-6 w-6 text-[#c47833]" />
                    </div>
                    <p className="text-bodymedium text-muted-foreground">
                      점검 기록이 없습니다
                    </p>
                    <Link href="/inspections/new">
                      <Button variant="outline" className="rounded-xl">
                        첫 점검 등록하기
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell className="font-medium">
                    {item.store_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.inspection_date).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>{item.inspector_name}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        scoreBadge(item.hygiene_score, "hygiene"),
                      )}
                    >
                      {scoreLabel(item.hygiene_score)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        scoreBadge(item.service_score, "quality"),
                      )}
                    >
                      {scoreLabel(item.service_score)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.overall_score ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
