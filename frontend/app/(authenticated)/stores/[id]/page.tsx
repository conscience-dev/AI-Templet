"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  MapPin,
  User,
  Plus,
  ClipboardCheck,
  ListTodo,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  useStore,
  useStoreInspections,
  useStoreImprovementTasks,
  useUpdateStore,
} from "@/hooks/use-stores";
import {
  useStoreHealthScore,
  useImprovementHistory,
  usePreviousIssues,
} from "@/hooks/use-store-health";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

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

const priorityBadge: Record<string, string> = {
  높음: "bg-red-50 text-red-700",
  중간: "bg-amber-50 text-amber-700",
  낮음: "bg-blue-50 text-blue-700",
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreRingColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

// 원형 게이지 컴포넌트
function CircularGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreRingColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0ede8"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-tiny text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// 수정 다이얼로그
function EditStoreDialog({
  store,
  open,
  onOpenChange,
}: {
  store: {
    id: string;
    store_name: string;
    region: string;
    address: string | null;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateStore();

  const [form, setForm] = useState({
    store_name: store.store_name,
    region: store.region,
    address: store.address || "",
    status: store.status,
  });

  useEffect(() => {
    if (open) {
      setForm({
        store_name: store.store_name,
        region: store.region,
        address: store.address || "",
        status: store.status,
      });
    }
  }, [open, store]);

  const handleSave = () => {
    if (!form.store_name.trim()) {
      toast({ variant: "destructive", title: "점포명을 입력해주세요." });
      return;
    }
    if (!form.region.trim()) {
      toast({ variant: "destructive", title: "지역을 입력해주세요." });
      return;
    }

    updateMutation.mutate(
      {
        id: store.id,
        data: {
          store_name: form.store_name,
          region: form.region,
          address: form.address || undefined,
          status: form.status,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "수정되었습니다." });
          onOpenChange(false);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "수정에 실패했습니다. 다시 시도해주세요.",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>점포 정보 수정</DialogTitle>
          <DialogDescription>
            정보를 수정한 후 저장 버튼을 눌러주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              점포명 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.store_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, store_name: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="점포명"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">
              지역 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.region}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, region: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="서울 강남, 경기 성남 등"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">주소</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              className="h-11 rounded-xl border-border"
              placeholder="상세 주소를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-bodymedium font-medium">상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, status: v }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border-border">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="운영중">운영중</SelectItem>
                <SelectItem value="휴점">휴점</SelectItem>
                <SelectItem value="폐점">폐점</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl bg-[#c47833] text-white transition-colors hover:bg-[#b06a2a]"
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data: store, isLoading } = useStore(storeId);
  const { data: inspections } = useStoreInspections(storeId);
  const { data: tasks } = useStoreImprovementTasks(storeId);
  const { data: healthScore } = useStoreHealthScore(storeId);
  const { data: improvementHistory } = useImprovementHistory(storeId);
  const { data: previousIssues } = usePreviousIssues(storeId);

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

  const unresolvedCount = previousIssues?.unresolved?.length ?? 0;

  const trendIcon =
    healthScore?.trend === "improving" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : healthScore?.trend === "declining" ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <Minus className="h-4 w-4 text-amber-600" />
    );

  const trendLabel =
    healthScore?.trend === "improving"
      ? "개선중"
      : healthScore?.trend === "declining"
        ? "하락"
        : "유지";

  const trendColor =
    healthScore?.trend === "improving"
      ? "text-green-600"
      : healthScore?.trend === "declining"
        ? "text-red-600"
        : "text-amber-600";

  // 차트 데이터 변환
  const chartData = (healthScore?.recent_inspections ?? []).map((item) => ({
    date: item.date
      ? new Date(item.date).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        })
      : "",
    품질: item.quality * 100,
    위생: item.hygiene * 100,
  }));

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
          <h1 className="text-heading1 text-foreground">{store.store_name}</h1>
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
          <Button
            variant="outline"
            className="rounded-xl"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Edit className="mr-1.5 h-4 w-4" />
            수정
          </Button>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <EditStoreDialog
        store={store}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

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
          </div>
        </div>

        {/* 건강도 스코어 카드 */}
        {healthScore && (
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-heading3 text-foreground">건강도 점수</h2>
              <div className={cn("flex items-center gap-1 text-caption font-medium", trendColor)}>
                {trendIcon}
                {trendLabel}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <CircularGauge score={healthScore.overall_score} />
              <div className="flex-1 space-y-3">
                {/* 품질 점수 */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-caption text-muted-foreground">품질</span>
                    <span className={cn("text-caption font-medium", getScoreColor(healthScore.quality_score))}>
                      {healthScore.quality_score}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0ede8]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", getScoreBarColor(healthScore.quality_score))}
                      style={{ width: `${healthScore.quality_score}%` }}
                    />
                  </div>
                </div>
                {/* 위생 점수 */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-caption text-muted-foreground">위생</span>
                    <span className={cn("text-caption font-medium", getScoreColor(healthScore.hygiene_score))}>
                      {healthScore.hygiene_score}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0ede8]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", getScoreBarColor(healthScore.hygiene_score))}
                      style={{ width: `${healthScore.hygiene_score}%` }}
                    />
                  </div>
                </div>
                {/* 과제 완료율 */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-caption text-muted-foreground">과제 완료율</span>
                    <span className={cn("text-caption font-medium", getScoreColor(healthScore.task_completion_rate))}>
                      {healthScore.task_completion_rate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0ede8]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", getScoreBarColor(healthScore.task_completion_rate))}
                      style={{ width: `${healthScore.task_completion_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* 과제 통계 */}
            <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-[#faf9f7] p-3">
              <div className="text-center">
                <p className="text-tiny text-muted-foreground">전체</p>
                <p className="text-heading4 text-foreground">{healthScore.task_stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-tiny text-muted-foreground">완료</p>
                <p className="text-heading4 text-green-600">{healthScore.task_stats.completed}</p>
              </div>
              <div className="text-center">
                <p className="text-tiny text-muted-foreground">진행중</p>
                <p className="text-heading4 text-amber-600">{healthScore.task_stats.in_progress}</p>
              </div>
              <div className="text-center">
                <p className="text-tiny text-muted-foreground">미처리</p>
                <p className="text-heading4 text-red-600">{healthScore.task_stats.pending}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 점검 추이 차트 */}
      {chartData.length >= 2 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#c47833]" />
            <h2 className="text-heading3 text-foreground">점검 추이</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#8a8580" }}
                  axisLine={{ stroke: "#e8e4dc" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#8a8580" }}
                  axisLine={{ stroke: "#e8e4dc" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e8e4dc",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  formatter={(value) => [`${value}%`]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "13px" }}
                />
                <Line
                  type="monotone"
                  dataKey="품질"
                  stroke="#c47833"
                  strokeWidth={2}
                  dot={{ fill: "#c47833", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="위생"
                  stroke="#d4a574"
                  strokeWidth={2}
                  dot={{ fill: "#d4a574", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 미완료 지적사항 알림 */}
      {unresolvedCount > 0 && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/30 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-heading3 text-foreground">
                미완료 지적사항
              </h2>
              <span className="inline-flex items-center rounded-xl bg-red-100 px-2.5 py-0.5 text-caption font-medium text-red-700">
                {unresolvedCount}건
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {previousIssues?.unresolved.map((issue) => (
              <div
                key={issue.task_id}
                className="flex items-start gap-3 rounded-xl bg-white p-4 transition-colors hover:bg-[#faf9f7]"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#d4a574]/10">
                  <Clock className="h-3.5 w-3.5 text-[#c47833]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-[#f5f3ef] px-2 py-0.5 text-tiny font-medium text-muted-foreground">
                      {issue.category}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                        priorityBadge[issue.priority] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {issue.priority}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                        taskStatusBadge[issue.status] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-caption text-foreground">
                    {issue.description}
                  </p>
                  <p className="mt-1 text-tiny text-muted-foreground">
                    점검일:{" "}
                    {issue.inspection_date
                      ? new Date(issue.inspection_date).toLocaleDateString(
                          "ko-KR",
                        )
                      : "-"}
                    {issue.days_overdue > 0 && (
                      <span className="ml-2 text-red-600">
                        ({issue.days_overdue}일 경과)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 점검 결과 */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-heading3 text-foreground">최근 점검 결과</h2>
          <Link href={`/stores/${storeId}/inspections/new`}>
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
                <TableHead className="text-caption font-medium">품질</TableHead>
                <TableHead className="text-caption font-medium">위생</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInspections.map((insp: Record<string, unknown>) => (
                <TableRow
                  key={insp.id as string}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell className="text-muted-foreground">
                    {new Date(
                      insp.inspection_date as string,
                    ).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell>{(insp.supervisor_name as string) ?? "-"}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium", qualityBadge[insp.quality_status as string] ?? "bg-[#f5f3ef] text-muted-foreground")}>
                      {(insp.quality_status as string)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-xl px-2.5 py-0.5 text-caption font-medium", qualityBadge[insp.hygiene_status as string] ?? "bg-[#f5f3ef] text-muted-foreground")}>
                      {(insp.hygiene_status as string)}
                    </span>
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
                  key={task.id as string}
                  className="border-border/40 transition-colors hover:bg-[#faf9f7]"
                >
                  <TableCell>
                    <span className="inline-flex items-center rounded-xl bg-[#f5f3ef] px-2.5 py-0.5 text-caption font-medium text-muted-foreground">
                      {task.category as string}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {task.task_description as string}
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

      {/* 개선 이력 타임라인 */}
      {improvementHistory && improvementHistory.timeline.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#c47833]" />
            <h2 className="text-heading3 text-foreground">개선 이력 타임라인</h2>
          </div>
          <div className="relative space-y-0">
            {improvementHistory.timeline.map((entry, index) => (
              <div key={entry.inspection_id} className="relative flex gap-4">
                {/* 타임라인 라인 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#c47833] bg-white">
                    <ClipboardCheck className="h-4 w-4 text-[#c47833]" />
                  </div>
                  {index < improvementHistory.timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border/60" />
                  )}
                </div>

                {/* 내용 */}
                <div className="min-w-0 flex-1 pb-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-caption font-medium text-foreground">
                      {entry.inspection_date
                        ? new Date(entry.inspection_date).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "날짜 없음"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                        qualityBadge[entry.quality_status] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      품질: {entry.quality_status}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                        qualityBadge[entry.hygiene_status] ??
                          "bg-[#f5f3ef] text-muted-foreground",
                      )}
                    >
                      위생: {entry.hygiene_status}
                    </span>
                  </div>

                  {entry.tasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {entry.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2 rounded-lg border border-border/40 p-3 transition-colors hover:bg-[#faf9f7]"
                        >
                          {task.status === "완료" ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          ) : task.status === "진행중" ? (
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center rounded-lg bg-[#f5f3ef] px-2 py-0.5 text-tiny font-medium text-muted-foreground">
                                {task.category}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                                  taskStatusBadge[task.status] ??
                                    "bg-[#f5f3ef] text-muted-foreground",
                                )}
                              >
                                {task.status}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-lg px-2 py-0.5 text-tiny font-medium",
                                  priorityBadge[task.priority] ??
                                    "bg-[#f5f3ef] text-muted-foreground",
                                )}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <p className="mt-1 text-caption text-foreground">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      연관된 개선 과제가 없습니다
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
