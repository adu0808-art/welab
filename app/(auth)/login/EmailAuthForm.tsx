'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  next?: string;
};

type Mode = 'signin' | 'signup';

export function EmailAuthForm({ next }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setNotice(null);

    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const nickname = ((formData.get('nickname') as string) ?? '').trim();

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (mode === 'signup' && !nickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: nickname } },
        });
        if (error) {
          setError(error.message);
          return;
        }
        // Supabase 의 "Confirm email" 옵션이 ON 이면 session 이 없음
        if (!data.session) {
          setNotice(
            '확인 메일을 전송했습니다. 메일의 링크를 클릭한 뒤 다시 로그인해주세요. (Dashboard 에서 Confirm email 을 끄면 즉시 가입됩니다)',
          );
          setMode('signin');
          return;
        }
        router.replace(next ?? '/home');
        router.refresh();
        return;
      }

      // signin
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace(next ?? '/home');
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-md bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError(null);
          }}
          className={`flex-1 rounded py-1.5 ${
            mode === 'signin'
              ? 'bg-white font-semibold text-brand-primary shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 rounded py-1.5 ${
            mode === 'signup'
              ? 'bg-white font-semibold text-brand-primary shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          회원가입
        </button>
      </div>

      <form action={submit} className="space-y-3">
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              name="nickname"
              required
              maxLength={20}
              placeholder="예: 위례주민"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete={mode === 'signup' ? 'email' : 'username'}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="최소 6자"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending
            ? mode === 'signup'
              ? '가입 중...'
              : '로그인 중...'
            : mode === 'signup'
              ? '회원가입'
              : '로그인'}
        </Button>
      </form>
    </div>
  );
}
