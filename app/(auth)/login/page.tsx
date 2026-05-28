import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { LoginButtons } from './LoginButtons';
import { EmailAuthForm } from './EmailAuthForm';

export const preferredRegion = 'hnd1';

export const metadata = { title: '로그인' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  if (!supabaseConfigured) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next ?? '/home');

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">위례 리빙랩 로그인</CardTitle>
          <CardDescription>
            카카오 또는 네이버 계정으로 30초 안에 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              로그인에 실패했습니다. ({error})
            </p>
          )}

          <EmailAuthForm next={next} />

          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <LoginButtons next={next} />

          <p className="pt-2 text-center text-xs text-muted-foreground">
            계속 진행 시{' '}
            <Link href="/terms" className="underline">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="underline">
              개인정보 처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
