# WeLAB — 위례신도시 리빙랩

> 주민이 만들고 데이터로 진화하는 위례 스마트시티 플랫폼

송파·성남·하남 3개 지자체 약 11만 주민이 도시문제를 직접 발굴·해결하는 리빙랩 웹 플랫폼입니다. Next.js 15 + Supabase + Vercel(도쿄 hnd1) 구성으로 동작합니다.

자세한 기획·설계는 `위례신도시_리빙랩_기획설계서.docx`, 코드 컨벤션은 `CLAUDE.md` 참고.

---

## 빠른 시작

### 1) 의존성 설치

```powershell
npm install
```

> Node.js 20 이상이 필요합니다.

### 2) 환경변수 설정

```powershell
Copy-Item .env.local.example .env.local
```

`.env.local` 을 열어 Supabase 키 등을 채웁니다.

### 3) Supabase 프로젝트 준비

1. https://supabase.com → 새 프로젝트 생성 (Region: **Seoul**)
2. 프로젝트 설정 → API → URL/anon key/service_role key 복사 → `.env.local`
3. SQL Editor 또는 CLI 로 마이그레이션 실행:

```powershell
# Supabase CLI 가 있을 때
supabase link --project-ref <project-ref>
supabase db push
```

CLI 가 없다면 `supabase/migrations/0001_init.sql` 과 `0002_rls.sql` 내용을
SQL Editor 에 차례로 붙여넣어 실행하세요.

### 4) 카카오 로그인 설정 (선택)

1. https://developers.kakao.com 앱 생성
2. Redirect URI 에 `https://<project-ref>.supabase.co/auth/v1/callback` 등록
3. Supabase 대시보드 → Authentication → Providers → Kakao 활성화 후 Client ID/Secret 입력
4. Site URL 에 `http://localhost:3000` (개발), 프로덕션 URL 추가

> 네이버 로그인은 Supabase가 기본 지원하지 않습니다. Custom OIDC 또는 자체 OAuth Route Handler 가 필요합니다 (`lib/actions/auth.ts` 의 TODO 참조).

### 5) 개발 서버

```powershell
npm run dev
```

http://localhost:3000 접속.

---

## 디렉토리 구조

```
welab/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # 로그인
│   ├── (main)/home/        # 로그인 후 홈
│   ├── (main)/mypage/      # 마이페이지
│   ├── auth/callback/      # Supabase OAuth 콜백
│   ├── layout.tsx          # 루트 레이아웃 (preferredRegion=hnd1)
│   └── page.tsx            # 랜딩
├── components/
│   ├── ui/                 # 디자인 시스템 (Button, Card, Input, Label)
│   └── shared/             # Header/Footer/BottomNav
├── lib/
│   ├── supabase/           # browser/server/middleware 클라이언트
│   ├── db/queries/         # DB 접근 함수 (DB 호출은 여기에서만!)
│   ├── db/types.ts         # Database 타입 (자동 생성 권장)
│   ├── actions/            # Server Actions (auth 등)
│   ├── utils.ts            # cn / format 헬퍼
│   └── constants.ts        # 라벨 / 사이트 정보
├── supabase/
│   └── migrations/         # 0001_init.sql, 0002_rls.sql
├── middleware.ts           # 인증 세션 갱신 + 보호 경로 리디렉트
├── tailwind.config.ts
├── next.config.ts
├── vercel.json             # Tokyo(hnd1) 리전 지정
└── CLAUDE.md               # 코드 컨벤션 (Claude Code 가 자동 로드)
```

---

## Vercel 배포

1. GitHub 등 원격 저장소에 push
2. Vercel → New Project → 저장소 선택
3. Environment Variables: `.env.local` 의 키를 모두 입력
   - `SUPABASE_SERVICE_ROLE_KEY` 는 **Sensitive** 로 표시
4. `vercel.json` 에 의해 자동으로 도쿄(`hnd1`) 리전에 배포됩니다.
5. Supabase Dashboard → Authentication → URL Configuration 의 Site URL 에
   프로덕션 도메인을 추가합니다.

> Vercel CLI 로 로컬 .env 동기화: `vercel env pull .env.local`

---

## 스크립트

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 검사 |
| `npm run db:types` | Supabase 스키마로부터 TS 타입 자동 생성 |

---

## 구현 완료 기능

### 사용자 화면
- 홈 / 랜딩 / 로그인 (이메일·비밀번호 + 카카오·네이버 OAuth)
- 거주확인 mock
- 의제 제안 CRUD + 추천 + 댓글·답글·좋아요
- 설문 9종 응답 (single/multiple/scale/ranking/short_text/long_text/image/location/slider)
- 투표 6종 (single/multiple/approval/budget/ranking/weighted) + 실시간 진행률
- 실증과제 5단계 + 참여 + 댓글
- 오프라인 행사 신청
- 공지·뉴스·FAQ 열람
- 도시현황 대시보드 (참여 지표 + 환경 카드 + 지도 영역)
- 마이페이지 (마일리지, 뱃지, 알림 인박스)

### 관리자 (`/admin`)
- 개요 (6종 카운터)
- 사용자 권한 변경
- 의제 모더레이션 (상태 변경)
- 설문 발행 + 결과 집계 (유형별 차트)
- 투표 발행 (6종 모두)
- 실증과제 등록 + 단계 변경
- 행사 등록
- 공지/뉴스/FAQ CMS

### 시스템
- Supabase RLS 6 마이그레이션 (init/rls/triggers/comments/admin/full)
- 자동 마일리지·뱃지 부여 트리거 (가입/거주확인/의제/투표/설문/댓글/행사)
- Server Action + Zod 검증 일관 적용
- 거주확인(verified) 가드 모든 작성 액션
- PWA manifest

## 외부 의존 (key/계약 후 활성화)
- 카카오·네이버 OAuth → 비즈앱 전환 후 동의항목 활성화
- DID / OCR 거주확인 → 외부 인증 서비스 연동 자리는 `lib/actions/verify.ts` 의 mockVerify
- Naver Maps → `components/shared/NaverMapStub.tsx` 를 실제 SDK 로 교체
- 공공데이터 / IoT 센서 → `lib/db/queries/...` 패턴으로 fetcher 추가
- 카카오톡 알림 → notifications 테이블 + 워커 (별도 구현)

## 컨벤션
`CLAUDE.md` 참고: Server Component 우선, DB 호출은 `lib/db/queries/*` 만, 변경은 Server Action + Zod + RLS.
