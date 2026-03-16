import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 인증 리다이렉트 미들웨어
 *
 * - 비인증 사용자 → /login 리다이렉트
 * - 인증된 사용자가 /login, /signup 접근 → / 리다이렉트
 * - 토큰: access_token 쿠키 기반 (JWT Bearer + Cookie fallback)
 */

const PUBLIC_PATHS = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 비인증 사용자가 보호된 경로 접근 시 → /login
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자가 공개 경로 접근 시 → /
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 정적 파일, API, _next 제외한 모든 경로에 적용
     */
    "/((?!api|_next/static|_next/image|favicon.ico|font|images).*)",
  ],
};
