import type { District, ProposalCategory } from '@/lib/db/types';

export const SITE = {
  name: 'WeLAB',
  fullName: '위례신도시 리빙랩',
  description: '주민이 만들고 데이터로 진화하는 위례 스마트시티 플랫폼',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

export const DISTRICT_LABEL: Record<District, string> = {
  songpa: '서울 송파구',
  seongnam: '경기 성남시',
  hanam: '경기 하남시',
};

export const CATEGORY_LABEL: Record<ProposalCategory, string> = {
  traffic: '교통',
  environment: '환경',
  safety: '안전',
  community: '커뮤니티',
  parenting: '육아',
  etc: '기타',
};

export const REWARD_POINTS = {
  signup: 100,
  verify: 200,
  proposal: 30,
  survey: 50,
  vote: 30,
  comment: 5,
} as const;
