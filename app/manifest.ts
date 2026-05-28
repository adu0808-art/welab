import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '위례신도시 리빙랩',
    short_name: 'WeLAB',
    description: '주민이 만들고 데이터로 진화하는 위례 스마트시티 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F8FC',
    theme_color: '#1F3A5F',
    lang: 'ko',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['government', 'social', 'productivity'],
  };
}
