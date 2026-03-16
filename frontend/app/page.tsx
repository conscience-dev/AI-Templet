import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <Badge variant="secondary" className="text-tiny">
            Next.js 15 + FastAPI
          </Badge>
          <h1 className="text-display text-foreground">
            풀스택 SaaS 템플릿
          </h1>
          <p className="text-bodymedium text-muted-foreground">
            SPEC.md를 작성하고 Claude Code에게 프로젝트 생성을 요청하세요.
            <br />
            백엔드, 프론트엔드, AI 에이전트까지 자동으로 생성됩니다.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg">시작하기</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">
              회원가입
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 pt-8 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-heading4">자동 코드 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                SPEC.md 기반 14단계 자동 생성 워크플로우
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-heading4">AI 에이전트</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Deep Agents + RAG 기반 챗봇 시스템 내장
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-heading4">관리자 대시보드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                사용자 관리, 통계, 자동화 페이지 자동 생성
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
