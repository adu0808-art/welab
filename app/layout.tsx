import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE } from '@/lib/constants';

export const preferredRegion = 'hnd1';

export const metadata: Metadata = {
  title: { default: SITE.fullName, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: SITE.fullName,
    description: SITE.description,
    locale: 'ko_KR',
    type: 'website',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1F3A5F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
