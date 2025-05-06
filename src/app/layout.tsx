/**
 * @作者 阿瑞
 * @功能 应用布局定义，配置元数据和全局样式
 * @版本 2.6.0
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from 'sonner';
import BrowserCompatibilityCheck from "@/components/BrowserCompatibilityCheck";

/* 加载Geist字体 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true
});

/* 站点元数据 */
export const metadata: Metadata = {
  title: "私域管理系统 - 现代团队协作平台",
  description: "基于最新毛玻璃UI设计的SaaS管理平台，为多团队环境打造的高效协作工具",
  keywords: ["SaaS", "团队协作", "项目管理", "毛玻璃UI", "Next.js"],
  authors: [{ name: "阿瑞", url: "https://github.com/arei" }],
  creator: "阿瑞",
  icons: {
    icon: "/favicon.ico",
  }
};

/* 视口配置 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a1128' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/* 根布局组件 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <BrowserCompatibilityCheck />
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            theme="system"
            visibleToasts={3}
            duration={5000}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}