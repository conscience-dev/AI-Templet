"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Store as StoreIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useStores, useCreateStore } from "@/hooks/use-stores";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const statusBadge: Record<string, string> = {
  운영중: "bg-green-50 text-green-700",
  휴점: "bg-amber-50 text-amber-700",
  폐점: "bg-red-50 text-red-700",
};

export default function StoresPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useStores({
    search: search || undefined,
    region: regionFilter || undefined,
    status: statusFilter || undefined,
    page,
  });

  const createMutation = useCreateStore();

  const stores = data?.results ?? [];
  const totalPages = data?.page_cnt ?? 1;

  // 신규 등록 폼
  const [newStore, setNewStore] = useState({
    store_name: "",
    region: "",
    address: "",
  });

  const handleCreate = () => {
    if (!newStore.store_name || !newStore.region) {
      toast({ variant: "destructive", title: "점포명과 지역은 필수입니다." });
      return;
    }
    createMutation.mutate(
      {
        store_name: newStore.store_name,
        region: newStore.region,
        address: newStore.address || undefined,
      },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "점포가 등록되었습니다." });
          setDialogOpen(false);
          setNewStore({
            store_name: "",
            region: "",
            address: "",
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "등록에 실패했습니다." });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">점포</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]">
              <Plus className="mr-2 h-4 w-4" />
              신규 점포 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-heading3">신규 점포 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>
                  점포명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newStore.store_name}
                  onChange={(e) =>
                    setNewStore((p) => ({ ...p, store_name: e.target.value }))
                  }
                  className="h-11 rounded-xl border-border"
                  placeholder="점포명 입력"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  지역 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newStore.region}
                  onChange={(e) =>
                    setNewStore((p) => ({ ...p, region: e.target.value }))
                  }
                  className="h-11 rounded-xl border-border"
                  placeholder="예: 서울, 경기"
                />
              </div>
              <div className="space-y-2">
                <Label>주소</Label>
                <Input
                  value={newStore.address}
                  onChange={(e) =>
                    setNewStore((p) => ({ ...p, address: e.target.value }))
                  }
                  className="h-11 rounded-xl border-border"
                  placeholder="상세 주소 입력"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]"
              >
                {createMutation.isPending ? "등록 중..." : "등록"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="점포명 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border-border pl-10"
          />
        </div>
        <Select
          value={regionFilter}
          onValueChange={(v) => {
            setRegionFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[130px] rounded-xl border-border">
            <SelectValue placeholder="지역" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 지역</SelectItem>
            <SelectItem value="서울">서울</SelectItem>
            <SelectItem value="경기">경기</SelectItem>
            <SelectItem value="인천">인천</SelectItem>
            <SelectItem value="부산">부산</SelectItem>
            <SelectItem value="대구">대구</SelectItem>
            <SelectItem value="기타">기타</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-[130px] rounded-xl border-border">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="운영중">운영중</SelectItem>
            <SelectItem value="휴점">휴점</SelectItem>
            <SelectItem value="폐점">폐점</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-[#faf9f7]">
              <TableHead className="text-caption font-medium">점포명</TableHead>
              <TableHead className="text-caption font-medium">지역</TableHead>
              <TableHead className="text-caption font-medium">슈퍼바이저</TableHead>
              <TableHead className="text-caption font-medium">상태</TableHead>
              <TableHead className="text-caption font-medium">최근 점검일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a574]/10">
                      <StoreIcon className="h-6 w-6 text-[#c47833]" />
                    </div>
                    <p className="text-bodymedium text-muted-foreground">
                      등록된 점포가 없습니다
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setDialogOpen(true)}
                    >
                      첫 점포 등록하기
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow
                  key={store.id}
                  className="cursor-pointer border-border/40 transition-colors hover:bg-[#faf9f7]"
                  onClick={() => router.push(`/stores/${store.id}`)}
                >
                  <TableCell className="font-medium">{store.store_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {store.region}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {store.supervisor_name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        statusBadge[store.status] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {store.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    -
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
