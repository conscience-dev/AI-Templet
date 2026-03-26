"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  useProspects,
  useCreateProspect,
  type ProspectRequest,
} from "@/hooks/use-prospects";

// 상태 배지
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    신규: "bg-blue-50 text-blue-700",
    상담중: "bg-amber-50 text-amber-700",
    보류: "bg-[#f5f3ef] text-muted-foreground",
    성약: "bg-green-50 text-green-700",
    종료: "bg-[#f5f3ef] text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-tiny font-medium ${styles[status] || "bg-[#f5f3ef] text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#d4a574]/10">
        <Users className="h-7 w-7 text-[#c47833]" />
      </div>
      <p className="mb-1 text-heading4 text-foreground">
        등록된 가맹문의자가 없습니다
      </p>
      <p className="text-caption text-muted-foreground">
        새 가맹문의자를 등록해보세요.
      </p>
    </div>
  );
}

// 신규 등록 폼 초기값
const initialForm: ProspectRequest = {
  name: "",
  phone: "",
  email: "",
  inquiry_path: "",
  hope_region: "",
  startup_budget: null,
  memo: "",
};

export default function ProspectsPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ProspectRequest>(initialForm);

  const params = {
    ...(statusFilter !== "전체" && { status: statusFilter }),
    ...(search && { search }),
    ...(regionFilter && { region: regionFilter }),
    page,
  };

  const { data, isLoading } = useProspects(params);
  const createProspect = useCreateProspect();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({
        title: "입력 오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!form.phone.trim()) {
      toast({
        title: "입력 오류",
        description: "연락처를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    createProspect.mutate(form, {
      onSuccess: () => {
        toast({
          title: "등록 완료",
          description: "가맹문의자가 등록되었습니다.",
        });
        setDialogOpen(false);
        setForm(initialForm);
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { detail?: string } } };
        toast({
          title: "등록 실패",
          description: err.response?.data?.detail || "다시 시도해주세요.",
          variant: "destructive",
        });
      },
    });
  };

  const totalPages = data ? Math.ceil(data.total_cnt / (data.count || 10)) : 1;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">가맹문의자 관리</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
        >
          <Plus className="mr-2 h-4 w-4" />
          신규 등록
        </Button>
      </div>

      {/* 상태 필터 탭 */}
      <Tabs value={statusFilter} onValueChange={handleStatusChange}>
        <TabsList className="h-10 rounded-xl bg-[#faf9f7] p-1">
          {["전체", "신규", "상담중", "보류", "성약", "종료"].map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="rounded-lg px-4 text-caption2 data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 검색 + 필터 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="이름, 연락처, 지역으로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 rounded-xl border-border bg-white pl-10 text-bodymedium placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
          />
        </div>
        <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-border bg-white text-caption2">
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 지역</SelectItem>
            <SelectItem value="서울">서울</SelectItem>
            <SelectItem value="경기">경기</SelectItem>
            <SelectItem value="인천">인천</SelectItem>
            <SelectItem value="부산">부산</SelectItem>
            <SelectItem value="대구">대구</SelectItem>
            <SelectItem value="대전">대전</SelectItem>
            <SelectItem value="광주">광주</SelectItem>
            <SelectItem value="울산">울산</SelectItem>
            <SelectItem value="세종">세종</SelectItem>
            <SelectItem value="강원">강원</SelectItem>
            <SelectItem value="충북">충북</SelectItem>
            <SelectItem value="충남">충남</SelectItem>
            <SelectItem value="전북">전북</SelectItem>
            <SelectItem value="전남">전남</SelectItem>
            <SelectItem value="경북">경북</SelectItem>
            <SelectItem value="경남">경남</SelectItem>
            <SelectItem value="제주">제주</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {/* 헤더 스켈레톤 */}
              <div className="flex gap-4 border-b border-border/40 bg-[#faf9f7] px-6 py-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1 rounded" />
                ))}
              </div>
              {/* 행 스켈레톤 */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 border-b border-border/40 px-6 py-4"
                >
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1 rounded" />
                  ))}
                </div>
              ))}
            </div>
          ) : !data?.results || data.results.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    이름
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    연락처
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    문의경로
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    희망지역
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    상태
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-caption text-muted-foreground">
                    담당자
                  </TableHead>
                  <TableHead className="bg-[#faf9f7] text-right text-caption text-muted-foreground">
                    등록일
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((prospect) => (
                  <TableRow
                    key={prospect.id}
                    onClick={() => router.push(`/prospects/${prospect.id}`)}
                    className="cursor-pointer border-border/40 transition-colors hover:bg-[#faf9f7]"
                  >
                    <TableCell className="text-caption2 font-medium text-foreground">
                      {prospect.name}
                    </TableCell>
                    <TableCell className="text-caption2 text-muted-foreground">
                      {prospect.phone}
                    </TableCell>
                    <TableCell className="text-caption2 text-muted-foreground">
                      {prospect.inquiry_path || "-"}
                    </TableCell>
                    <TableCell className="text-caption2 text-muted-foreground">
                      {prospect.hope_region || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={prospect.status} />
                    </TableCell>
                    <TableCell className="text-caption2 text-muted-foreground">
                      {prospect.assigned_user_name || "-"}
                    </TableCell>
                    <TableCell className="text-right text-caption2 text-muted-foreground">
                      {new Date(prospect.created_at).toLocaleDateString(
                        "ko-KR",
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {data && data.total_cnt > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-caption text-muted-foreground">
            총 {data.total_cnt}건 중 {(page - 1) * (data.count || 10) + 1}-
            {Math.min(page * (data.count || 10), data.total_cnt)}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="h-9 rounded-xl border-border/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-caption2 text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="h-9 rounded-xl border-border/60"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 신규 등록 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-heading3 text-foreground">
              가맹문의자 등록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 이름 */}
            <div className="space-y-1.5">
              <Label className="text-caption2 text-foreground">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="이름을 입력하세요"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
              />
            </div>

            {/* 연락처 */}
            <div className="space-y-1.5">
              <Label className="text-caption2 text-foreground">
                연락처 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-11 rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
              />
            </div>

            {/* 이메일 */}
            <div className="space-y-1.5">
              <Label className="text-caption2 text-foreground">이메일</Label>
              <Input
                placeholder="email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
              />
            </div>

            {/* 문의경로 */}
            <div className="space-y-1.5">
              <Label className="text-caption2 text-foreground">문의경로</Label>
              <Select
                value={form.inquiry_path}
                onValueChange={(v) => setForm({ ...form, inquiry_path: v })}
              >
                <SelectTrigger className="h-11 rounded-xl border-border bg-white text-bodymedium">
                  <SelectValue placeholder="문의경로를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="매장방문">매장방문</SelectItem>
                  <SelectItem value="매체광고">매체광고</SelectItem>
                  <SelectItem value="인터넷검색">인터넷검색</SelectItem>
                  <SelectItem value="소개추천">소개추천</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 희망지역 + 예산 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-caption2 text-foreground">
                  희망지역
                </Label>
                <Input
                  placeholder="예: 서울 강남"
                  value={form.hope_region}
                  onChange={(e) =>
                    setForm({ ...form, hope_region: e.target.value })
                  }
                  className="h-11 rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-caption2 text-foreground">
                  창업예산 (만원)
                </Label>
                <Input
                  placeholder="예: 5000"
                  type="number"
                  value={form.startup_budget ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startup_budget: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="h-11 rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
                />
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-1.5">
              <Label className="text-caption2 text-foreground">메모</Label>
              <Textarea
                placeholder="추가 메모를 입력하세요"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                rows={3}
                className="rounded-xl border-border bg-white text-bodymedium focus-visible:ring-1 focus-visible:ring-[#c47833]/20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(initialForm);
              }}
              className="rounded-xl border-border/60"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProspect.isPending}
              className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
            >
              {createProspect.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
