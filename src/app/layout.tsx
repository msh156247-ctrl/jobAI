import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '집찾기 전략 플래너 KR',
  description: '한국 부동산(매매/전세/월세/전월세) 탐색과 대출 가능성, 서류 체크를 한 번에 정리하는 전략 사이트',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
