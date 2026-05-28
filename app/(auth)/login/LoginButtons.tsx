'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  next?: string;
};

export function LoginButtons({ next }: Props) {
  const [pending, setPending] = useState<null | 'kakao' | 'naver'>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: 'kakao' | 'naver') {
    setError(null);
    setPending(provider);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ''
      }`;

      // 카카오: 일반앱은 닉네임만 안전. 이메일·프로필 사진은 비즈앱 또는 콘솔 설정 필요.
      // 네이버는 Supabase 기본 미지원이라 'kakao' 로 폴백.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'kakao' ? 'kakao' : 'kakao',
        options: {
          redirectTo,
          scopes: 'profile_nickname',
          queryParams: { prompt: 'login' },
        },
      });

      if (error) {
        setError(error.message);
        setPending(null);
      }
      // 성공 시 SDK 가 window.location 을 카카오로 이동시킴.
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => signIn('kakao')}
        disabled={pending !== null}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-base font-medium text-[#191600] hover:brightness-95 disabled:opacity-60"
      >
        {pending === 'kakao' ? '카카오로 이동 중...' : '카카오로 시작하기'}
      </button>

      <button
        type="button"
        onClick={() => signIn('naver')}
        disabled={pending !== null}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#03C75A] text-base font-medium text-white hover:brightness-95 disabled:opacity-60"
      >
        {pending === 'naver' ? '이동 중...' : '네이버로 시작하기'}
      </button>
    </div>
  );
}
