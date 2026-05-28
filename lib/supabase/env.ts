/**
 * Supabase 환경변수 설정 여부.
 * .env.local 이 아직 채워지지 않은 상태에서도 앱이 죽지 않도록 가드용 상수.
 */
export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
