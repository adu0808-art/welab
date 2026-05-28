# WeLAB - 위례신도시 리빙랩

> 주민이 만들고 데이터로 진화하는 위례 스마트시티 플랫폼

## 프로젝트 개요

WeLAB(We + Living lab, "우리가 함께 만드는 리빙랩")은 위례신도시 주민이 도시문제를 직접 발굴하고 해결과정에 참여하는 리빙랩 플랫폼입니다. 송파·성남·하남 3개 지자체에 걸친 약 11만 주민을 대상으로 하며, 주민 참여 설문·투표·실증과제 운영을 핵심 기능으로 합니다.

**핵심 사용자**: 위례 거주민 (30~40대 비중 높음, 모바일 사용 70% 이상)
**플랫폼 목표**: 3년 내 누적 가입자 30,000명, MAU 10,000명

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL, Seoul region) |
| Auth | Supabase Auth (카카오/네이버 OAuth) |
| Storage | Supabase Storage (이미지·첨부) |
| Realtime | Supabase Realtime (투표 실시간 집계) |
| Maps | Naver Maps API (위치 기반 신고·표시) |
| Deploy | Vercel (Tokyo region, hnd1) |
| Analytics | Vercel Analytics |

## 디렉토리 구조

```
welab/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 그룹
│   ├── (main)/              # 메인 서비스 그룹
│   │   ├── proposals/       # 의제 제안
│   │   ├── surveys/         # 설문
│   │   ├── votes/           # 투표
│   │   ├── projects/        # 실증과제
│   │   └── dashboard/       # 도시현황 대시보드
│   ├── admin/               # 관리자 콘솔
│   ├── api/                 # Route Handlers (필요한 경우만)
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── features/            # 도메인별 컴포넌트
│   │   ├── survey/
│   │   ├── vote/
│   │   └── proposal/
│   └── shared/              # 공통 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # 브라우저용 클라이언트
│   │   ├── server.ts        # 서버용 클라이언트
│   │   └── middleware.ts    # 미들웨어용
│   ├── db/
│   │   ├── queries/         # DB 쿼리 함수 (이곳에만 DB 접근)
│   │   └── types.ts         # DB 타입 정의
│   ├── actions/             # Server Actions
│   ├── utils.ts
│   └── constants.ts
├── types/                   # 전역 타입
├── public/
├── middleware.ts            # 인증 미들웨어
└── CLAUDE.md
```

## 핵심 컨벤션

### 언어 정책

- **UI 텍스트**: 한국어 (사용자에게 보이는 모든 문구)
- **변수/함수/파일명**: 영문
- **주석**: 한국어 (설명) 또는 영문 (기술적 노트)
- **커밋 메시지**: 한국어 권장 (`feat: 투표 우선순위 정렬 기능 추가`)

### 컴포넌트 작성 규칙

```typescript
// ✅ Server Component를 기본으로
// app/proposals/page.tsx
import { getProposals } from '@/lib/db/queries/proposals';

export default async function ProposalsPage() {
  const proposals = await getProposals();
  return <ProposalList proposals={proposals} />;
}

// ✅ 인터랙션 필요한 경우만 "use client"
// components/features/proposal/ProposalForm.tsx
'use client';

import { useState } from 'react';

export function ProposalForm() {
  const [title, setTitle] = useState('');
  // ...
}
```

**원칙**:
- Server Component를 **기본**으로 사용
- `"use client"`는 다음 경우에만:
  - `useState`, `useEffect` 등 React 훅 사용
  - 이벤트 핸들러(`onClick`, `onChange`) 사용
  - 브라우저 API 사용 (`localStorage`, `window`)
- 클라이언트 컴포넌트도 자식으로 Server Component 받을 수 있음 (`children` prop 활용)

### 데이터 접근 규칙

DB 접근은 **반드시** `/lib/db/queries/*.ts`에서만 합니다.

```typescript
// ✅ lib/db/queries/proposals.ts
import { createClient } from '@/lib/supabase/server';
import type { Proposal } from '@/lib/db/types';

export async function getProposals(category?: string): Promise<Proposal[]> {
  const supabase = await createClient();
  const query = supabase.from('proposals').select('*');
  if (category) query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ❌ 페이지나 컴포넌트에서 직접 Supabase 호출 금지
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('proposals').select('*'); // 금지
}
```

이유: 쿼리 재사용성, 타입 일관성, 테스트 용이성, 캐싱 적용 일관성.

### Server Actions 작성

폼 제출·데이터 변경은 Server Actions를 사용합니다.

```typescript
// lib/actions/proposal.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProposalSchema = z.object({
  title: z.string().min(5, '제목은 5자 이상 입력해주세요').max(100),
  body: z.string().min(20, '본문은 20자 이상 입력해주세요'),
  category: z.enum(['traffic', 'environment', 'safety', 'community', 'etc']),
});

export async function createProposal(formData: FormData) {
  const parsed = ProposalSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    category: formData.get('category'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { error } = await supabase.from('proposals').insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/proposals');
  return { success: true };
}
```

**원칙**:
- 입력값은 **반드시** Zod로 검증
- 인증 체크는 액션 내부에서 (미들웨어만 믿지 말 것)
- 성공/실패를 객체로 반환 (`throw` 대신)
- 변경 후 `revalidatePath` 또는 `revalidateTag` 호출

### Vercel 리전 지정

모든 페이지·API 라우트 파일 상단에 도쿄 리전 지정 필수:

```typescript
// app/proposals/page.tsx
export const preferredRegion = 'hnd1';
```

또는 `app/layout.tsx` 최상위에 한 번만 지정해도 됩니다 (현재 방식).

### 스타일링 규칙

- **Tailwind 우선**, 커스텀 CSS 최소화
- shadcn/ui 컴포넌트를 우선 사용, 필요 시 커스터마이징
- **모바일 우선** 디자인: 기본 스타일은 모바일, `sm:`·`md:` 이상은 보조

```tsx
// ✅ 모바일 우선
<div className="p-4 sm:p-6 md:p-8">
  <h1 className="text-xl sm:text-2xl md:text-3xl">...</h1>
</div>

// ❌ 데스크탑 기준 작성 후 모바일 깨짐
<div className="p-8 md:p-4">...</div>
```

### 색상 팔레트 (브랜드)

Tailwind config에 정의:

```javascript
colors: {
  brand: {
    primary: '#1F3A5F',    // 진한 남색 (메인)
    secondary: '#2E5C8A',  // 중간 남색
    accent: '#3A6FA5',     // 밝은 남색
    light: '#E8EEF7',      // 배경
    bg: '#F5F8FC',         // 보조 배경
  }
}
```

UI 텍스트는 `text-brand-primary`, 카드 헤더는 `bg-brand-light` 식으로 일관 사용.

### 폼·접근성

- 모든 인풋에 `<label>` 연결
- 에러 메시지는 인풋 바로 아래, `aria-describedby`로 연결
- 키보드 접근 가능 (`tabIndex` 신경)
- WCAG 2.1 AA 준수 (대비, 폰트 크기)

## 도메인 규칙

### 사용자 권한 등급

```typescript
type UserRole = 'guest' | 'verified' | 'active' | 'leader' | 'admin';
```

- `guest`: 가입만 한 상태, 조회만 가능
- `verified`: 거주확인 완료, 설문·투표 참여 가능
- `active`: 활동 마일리지 500P 이상, 의제 발의 가능
- `leader`: 운영진 위촉, 모더레이션 권한
- `admin`: 사무국, 전체 관리

권한 체크는 항상 Server Action 내부에서.

### 거주 인증

- 가입 시 `verified: false`로 시작
- 카카오/네이버 로그인 후 별도 거주 인증 절차
- 거주확인 방법: DID 또는 OCR 기반 (관리비 고지서·주민등록증)
- **본 등급 도달 전에는 설문 응답·투표 참여 불가**

### 의제 라이프사이클

```
draft → submitted → reviewing → approved → in_progress → completed
                                ↓
                              rejected
```

상태 전이는 트리거 또는 Server Action에서만. 클라이언트에서 직접 상태 변경 금지.

### 투표 유형 (6종)

설계서 11.2 참고:

```typescript
type VoteType =
  | 'single'      // 단일 선택
  | 'multiple'    // N표 다중
  | 'budget'      // 예산 배분
  | 'ranking'     // 순위 매기기
  | 'approval'    // 찬반
  | 'weighted';   // 가중치
```

집계 로직은 `/lib/utils/voting.ts`에 유형별 함수로 분리.

### 익명성 처리

- 설문 응답: 익명/실명 사용자 선택 가능 (DB에는 user_id 저장, 응답 조회 시 마스킹)
- 투표: 항상 실명 기록(중복방지용), 결과 공개 시 익명화
- 댓글: 실명(닉네임) 기본
- 의제 제안: 실명/익명 선택 가능

## 보안 규칙

### 절대 금지

- ❌ `service_role` 키를 클라이언트에 노출 (`NEXT_PUBLIC_` 접두사 금지)
- ❌ Supabase RLS(Row Level Security) 미적용 테이블 운영
- ❌ 사용자 입력을 검증 없이 DB에 저장
- ❌ 비밀번호·주민번호·결제정보 평문 저장
- ❌ 위치 정보를 정확한 좌표로 공개 (의제 위치는 50m 단위로 라운딩)

### 필수 적용

- ✅ 모든 테이블에 RLS 정책 설정
- ✅ Server Action에서 인증·권한 재검증
- ✅ Zod로 모든 입력 검증
- ✅ 파일 업로드 시 확장자·크기·MIME 검증
- ✅ Rate limit 적용 (API 라우트당 분당 60회 기준)

## 성능 가이드

- 이미지는 `next/image` 사용, 적절한 `sizes` 지정
- 리스트는 페이지네이션 또는 무한 스크롤 (기본 페이지당 20개)
- 자주 조회되는 데이터는 `unstable_cache` 또는 React `cache()` 활용
- 클라이언트 번들 크기 주의 (heavy 라이브러리는 dynamic import)
- 한국 사용자 대상이므로 도쿄 리전 고정 (`hnd1`)

## Claude Code 작업 지침

### 작업 시작 전

1. 관련 파일 먼저 읽기 (이미 있는 코드 패턴 파악)
2. DB 스키마 확인 (`/lib/db/types.ts`)
3. 기존 Server Action 패턴 따르기

### 코드 작성 시

- 새 컴포넌트는 비슷한 기존 컴포넌트의 패턴을 따른다
- 타입은 최대한 추론 활용하되, 함수 시그니처는 명시
- `any` 사용 금지 (`unknown` 후 좁히기)
- 한 파일당 너무 길어지면 분리 (컴포넌트 200줄, 유틸 300줄 가이드)

### PR/커밋

- 한 PR당 하나의 기능
- 커밋 메시지 형식: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- 예: `feat: 의제 카테고리 필터 추가`

### 테스트

- 핵심 비즈니스 로직(투표 집계, 권한 체크)은 단위 테스트 필수
- E2E는 주요 사용자 플로우(가입→인증→첫 참여)에 한정
- 테스트 파일은 `*.test.ts` 또는 `__tests__/` 폴더

### 모르겠으면

- 추측해서 새 패턴 만들지 말고 사용자에게 물어볼 것
- 특히 도메인 용어(거주확인, 의제 단계, 투표 유형 등) 모호 시 확인
- 외부 API/라이브러리 추가는 사전 합의 후

## 환경변수 목록

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 서버 전용, 절대 NEXT_PUBLIC_ 붙이지 말 것

# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# 네이버 OAuth
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 네이버 지도
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=

# 기타
NEXT_PUBLIC_SITE_URL=https://welab.kr
```

로컬 개발 시 `vercel env pull`로 동기화.

## 참고 문서

- 사업 기획·설계서: `/docs/welab-design.docx` (16개 장)
- DB 스키마: `/lib/db/types.ts`
- API 명세: `/docs/api.md` (추후 작성)
- 디자인 시스템: Figma 링크 (추후 첨부)

## 핵심 KPI (개발 우선순위 판단 기준)

기능 추가·개선 우선순위는 다음 지표 영향도로 판단합니다:

1. **누적 가입자** - 온보딩 마찰 최소화
2. **MAU** - 재방문 유도 (알림, 개인화)
3. **설문·투표 응답률** - 참여 마찰 최소화 (3-Tap 원칙)
4. **실증과제 추진** - 의제→과제 연계 흐름
5. **주민 만족도** - 접근성, 응답속도

기능 제안 시 "이 기능이 어떤 KPI에 어떻게 기여하는가?"를 항상 함께 답변.

---

**마지막 업데이트**: 2026년 5월
**문서 관리**: WeLAB 사무국
