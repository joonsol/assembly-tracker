import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "한눈에 국회의원",
  description: "우리 지역 국회의원을 빠르게 찾아보세요. 지역구 선택 또는 이름 검색으로 바로 확인하세요.",
  keywords: ["국회의원", "지역구", "국회의원 찾기", "우리동네 국회의원"],
  openGraph: {
    title: "한눈에 국회의원",
    description: "우리 지역 국회의원을 빠르게 찾아보세요.",
    url: "https://assembly-tracker.vercel.app",
    siteName: "한눈에 국회의원",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한눈에 국회의원",
    description: "우리 지역 국회의원을 빠르게 찾아보세요.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
