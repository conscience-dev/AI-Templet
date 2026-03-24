"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  User,
  Calendar,
  Ruler,
  Plus,
  ClipboardCheck,
  ListTodo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useStore,
  useDeleteStore,
  useStoreHealthScore,
  useStoreInspections,
  useStoreImprovementTasks,
} from "@/hooks/use-stores";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusBadge: Record<string, string> = {
  운영중: "bg-green-50 text-green-700",
  휴점: "bg-amber-50 text-amber-700",
  폐점: "bg-red-50 text-red-700",
};

const taskStatusBadge: Record<string, string> = {
  완료: "bg-green-50 text-green-700",
  미처리: "bg-red-50 text-red-700",
  진행중: "bg-amber-50 text-amber-700",
  보류: "bg-[#f5f3ef] text-muted-foreground",
};

const qualityBadge: Record<string, string> = {
  준수: "bg-green-50 text-green-700",
  양호: "bg-green-50 text-green-700",
  미흡: "bg-red-50 text-red-700",
};

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const storeId = Number(id);
  const router = useRouter();
  const { toast } = useToast();

  const { data: store, isLoading } = useStore(storeId);
  const { data: healthScore, isLoading: healthLoading } =
    useStoreHealthScore(storeId);
  const { data: inspections } = useStoreInspections(storeId);
  const { data: tasks } = useStoreImprovementTasks(storeId);
  const deleteMutation = useDeleteStore();

  const handleDelete = () => {
    deleteMutation.mutate(storeId, {
      onSuccess: () => {
        toast({ variant: "success", title: "점포가 삭제되었습니다." });
        router.push("/stores");
      },
      onError: () => {
        toast({ variant: "destructive", title: "삭제에 실패했습니다." });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-8">
        <Skeleton className="mb-4 h-6 w-32 rounded" />
        <Skeleton className="mb-6 h-8 w-64 rounded" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-bodymedium text-muted-foreground">
          점포를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const recentInspections = Array.isArray(inspections)
    ? inspections.slice(0, 5)
    : inspections?.results?.slice(0, 5) ?? [];
  const recentTasks = Array.isArray(tasks)
    ? tasks.slice(0, 5)
    : tasks?.results?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* 뒤로가기 */}
      <Link
        href="/stores"
        className="mb-4 inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        점포 목록
      </Link>

      {/* 상단 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-heading1 text-foreground">{store.name}</h1>
          <span
            className={cn(
              "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
              statusBadge[store.status] ?? "bg-[#f5f3ef] text-muted-foreground",
            )}
          >
            {store.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" size="sm">
            <Edit className="mr-1.5 h-4 w-4" />
            수정
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                size="sm"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>점포 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{store.name}&quot; 점포를 삭제하시겠습니까? 이 작업은
                  되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 카드 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading3 text-foreground">기본 정보</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-caption text-muted-foreground">지역 / 주소</p>
                <p className="text-bodymedium">
                  {store.region} · {store.address || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-caption text-muted-foreground">슈퍼바이저</p>
                <p className="text-bodymedium">
                  {store.supervisor_name ?? "미배정"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-caption text-muted-foreground">점주</p>
                <p className="text-bodymedium">
                  {store.owner_name || "-"}{" "}
                  {store.owner_phone && (
                    <span className="text-muted-foreground">
                      ({store.owner_phone})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-caption text-muted-foreground">개점일</p>
                <p className="text-bodymedium">
                  {store.open_date
                    ? new Date(store.open_date).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 건강도 점수 카드 */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-heading3 text-foreground">건강도 점수</h2>
          {healthLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          ) : healthScore ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[#d4a574]/10 p-4">
                <span className="text-heading4 text-foreground">종합 점수</span>
                <span className="text-display text-[#c47833]">
                  {healthScore.overall_score}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "위생", score: healthScore.hygiene_score },
                  { label: "서비스", score: healthScore.service_score },
                  { label: "시설", score: healthScore.facility_score },
                  { label: "운영", score: healthScore.operation_score },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/40 p-3 text-center"
                  >
                    <p className="text-caption text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-heading2 text-foreground">
                      {item.score ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-caption text-muted-foreground">
                최종 업데이트:{" "}
                {new Date(healthScore.last_updated).toLocaleDateString("ko-KR")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <p className="text-caption text-muted-foreground">
                건강도 점수 데이터가 없습니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 최근 점검 결과 */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading3 text-foreground">최근 점검 결과</h2>
          <Link href={`/inspections/new?store_id=${storeId}`}>
            <Button
              size="sm"
              className="rounded-xl bg-[#c47833] text-white hover:bg-[#b06a2a]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              점검 등록
            </Button>
          </Link>
        </div>
        {recentInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
              <ClipboardCheck className="h-5 w-5 text-[#c47833]" />
            </div>
            <p className="text-caption text-muted-foreground">
              점검 기록이 없습니다
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-[#faf9f7]">
                <TableHead className="text-caption font-medium">점검일</TableHead>
                <TableHead className="text-caption font-medium">점검자</TableHead>
                <TableHead className="text-caption font-medium">
                  종합점수
                </TableHead>
                <TableHead className="text-caption font-medium">소견</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInspections.map((insp: Record<string, unknown>) => (
                <TableRow
                  key={insp.id as number}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell className="text-muted-foreground">
                    {new Date(
                      insp.inspection_date as string,
                    ).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>{(insp.inspector_name as string) ?? "-"}</TableCell>
                  <TableCell className="font-medium">
                    {(insp.overall_score as number) ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground">
                    {(insp.findings as string) || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 개선 과제 목록 */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading3 text-foreground">개선 과제</h2>
          <Link href="/improvement-tasks">
            <Button variant="outline" size="sm" className="rounded-xl">
              전체 보기
            </Button>
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
              <ListTodo className="h-5 w-5 text-[#c47833]" />
            </div>
            <p className="text-caption text-muted-foreground">
              개선 과제가 없습니다
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-[#faf9f7]">
                <TableHead className="text-caption font-medium">
                  카테고리
                </TableHead>
                <TableHead className="text-caption font-medium">설명</TableHead>
                <TableHead className="text-caption font-medium">상태</TableHead>
                <TableHead className="text-caption font-medium">
                  완료예정일
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.map((task: Record<string, unknown>) => (
                <TableRow
                  key={task.id as number}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell>
                    <span className="inline-flex items-center rounded-xl bg-[#f5f3ef] px-2.5 py-0.5 text-caption font-medium text-muted-foreground">
                      {task.category as string}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {(task.title as string) || (task.description as string)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium",
                        taskStatusBadge[task.status as string] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {task.status as string}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.due_date
                      ? new Date(task.due_date as string).toLocaleDateString(
                          "ko-KR",
                        )
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
