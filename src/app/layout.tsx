import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ToastProvider } from "@/components/Toast";
import MobileTabBar from "@/components/MobileTabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobAI - 구인구직 플랫폼",
  description: "구직자와 기업을 매칭해주는 실시간 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ProfileProvider>
            <ToastProvider>
              {children}
              <MobileTabBar />
            </ToastProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
