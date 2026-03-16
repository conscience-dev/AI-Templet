"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="mb-2 text-heading2 text-foreground">
          문제가 발생했습니다
        </h2>
        <p className="mb-8 max-w-[400px] text-bodymedium text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <Button
          onClick={reset}
          className="rounded-xl bg-[#c47833] hover:bg-[#b06a2a] text-white px-5"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
