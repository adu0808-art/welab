'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/constants';

type Provider = 'kakao' | 'naver';

/**
 * OAuth 로그인 시작. provider 별 Supabase URL 로 리다이렉트.
 *
 * 카카오: Supabase 기본 지원.
 * 네이버: 기본 미지원 → 별도 OIDC 설정 또는 자체 OAuth 라우트 필요.
 *         (현재는 카카오와 동일 시그니처로 placeholder)
 */
export async function signInWithProvider(provider: Provider, next?: string) {
  const supabase = await createClient();
  const redirectTo = `${SITE.url}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  // Kakao 동의 항목은 닉네임만 요청. 이메일/프로필 사진은 비즈앱 전환 또는
  // 콘솔에서 별도 활성화가 필요해 일반앱 단계에선 KOE205 를 유발한다.
  const scopes = provider === 'kakao' ? 'profile_nickname' : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider === 'kakao' ? 'kakao' : ('kakao' as const), // TODO: naver
    options: { redirectTo, scopes },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
