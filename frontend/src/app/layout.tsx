import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "我的个人主页",
    template: "%s · 我的个人主页",
  },
  description: "背景音乐 · 健身计时 · 灵感仓库 —— 我的个人主页",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-black/[.08] py-6 dark:border-white/10">
          <p className="mx-auto w-full max-w-3xl px-4 text-center text-sm text-zinc-500">
            © 2026 · 我的个人主页
          </p>
        </footer>
      </body>
    </html>
  );
}