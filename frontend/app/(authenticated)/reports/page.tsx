"use client";

import {
  BarChart3,
  TrendingUp,
  Activity,
  ListChecks,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const reportCards = [
  {
    title: "상담 전환율 분석",
    description: "가맹문의자 상담 결과별 전환율 추이를 확인합니다.",
    icon: TrendingUp,
    stats: [
      { label: "이번 달 상담", value: "-" },
      { label: "A가망고객 전환율", value: "-" },
    ],
  },
  {
    title: "점포 건강도 분석",
    description: "전체 점포의 건강도 점수 분포와 추이를 확인합니다.",
    icon: Activity,
    stats: [
      { label: "평균 건강도", value: "-" },
      { label: "주의 필요 점포", value: "-" },
    ],
  },
  {
    title: "개선 과제 진행률",
    description: "개선 과제의 완료율과 미처리 현황을 확인합니다.",
    icon: ListChecks,
    stats: [
      { label: "전체 과제", value: "-" },
      { label: "완료율", value: "-" },
    ],
  },
  {
    title: "매출 분석",
    description: "점포별 매출 추이와 전년 동월 대비 변화를 확인합니다.",
    icon: BarChart3,
    stats: [
      { label: "평균 월매출", value: "-" },
      { label: "전년 대비", value: "-" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading1 text-foreground">분석 리포트</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" disabled>
            <Download className="mr-2 h-4 w-4" />
            CSV 다운로드
          </Button>
          <Button variant="outline" className="rounded-xl" disabled>
            <Download className="mr-2 h-4 w-4" />
            PDF 다운로드
          </Button>
        </div>
      </div>

      {/* 리포트 카드 */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]/10">
                  <Icon className="h-5 w-5 text-[#c47833]" />
                </div>
                <div>
                  <h2 className="text-heading4 text-foreground">{card.title}</h2>
                  <p className="text-caption text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* 통계 */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                {card.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/40 p-3 text-center"
                  >
                    <p className="text-caption text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-heading3 text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* 차트 영역 placeholder */}
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/60 bg-[#faf9f7]">
                <p className="text-caption text-muted-foreground">
                  차트 영역 (준비 중)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
