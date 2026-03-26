"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  isLoading?: boolean;
  change?: number;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  isLoading,
  change,
}: StatCardProps) {
  return (
    <Card className="rounded-2xl border-border/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-caption text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-[28px] font-bold leading-none text-foreground">
                  {value}
                  {suffix && (
                    <span className="ml-1 text-heading4 font-medium text-muted-foreground">
                      {suffix}
                    </span>
                  )}
                </p>
                {change !== undefined && change !== 0 && (
                  <span
                    className={`text-caption font-medium ${change > 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {change > 0 ? "+" : ""}
                    {change}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a574]/10">
            <Icon className="h-5 w-5 text-[#c47833]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
