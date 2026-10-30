import type { Metadata } from "next";
import { ThemeScript } from "@/components/layout/theme-script";
import "./globals.css";
import { SiteHeader } from "./site-header";

export const metadata: Metadata = {
  title: { default: "SAM UI", template: "%s | SAM UI" },
  description:
    "SAM UI는 대시보드를 위한 React · Tailwind CSS 4 킷입니다. Claude Code / Codex 플러그인이 설치하고 최신으로 유지합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // THEME_SCRIPT may add .dark before hydration, so <html>'s class can differ from the server's.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
