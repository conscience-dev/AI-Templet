import "@/styles/globals.css";
import { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Next.js + FastAPI Template",
    template: `%s - Template`,
  },
  description: "Next.js 15 + FastAPI 풀스택 SaaS 보일러플레이트",
  icons: {
    icon: "/favicon.ico",
  },
};
const pretendard = localFont({
  src: "../public/font/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-Pretendard",
  weight: "45 920",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ko">
      <head />
      <body className={`${pretendard.variable} min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
