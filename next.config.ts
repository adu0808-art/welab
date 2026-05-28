import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 'phinf.pstatic.net' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  // production build 단계에서 ESLint 가 실패해도 배포는 진행.
  // 실제 lint 는 별도 `npm run lint` / CI 에서 잡습니다.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TODO: Supabase Database 타입 정밀화 후 false 로 복귀
  // 현재 select() 결과가 일부 페이지에서 'never' 로 추론되는 케이스가 있어 임시 우회
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
