import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * .env.local 의 Supabase 키가 채워지지 않았을 때 표시할 안내.
 */
export function SetupNotice() {
  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-xl border-brand-accent/30 bg-brand-light/40">
        <CardHeader>
          <CardTitle>Supabase 환경변수가 설정되지 않았습니다</CardTitle>
          <CardDescription>
            로그인·인증 기능은 Supabase 연결 후 동작합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/80">
          <p>다음 단계를 따라주세요:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                Copy-Item .env.local.example .env.local
              </code>
            </li>
            <li>
              Supabase Dashboard → Settings → API 에서 URL 과 anon key 복사
            </li>
            <li>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">.env.local</code>{' '}
              에 붙여넣고 dev 서버 재시작
            </li>
          </ol>
          <p className="pt-2 text-muted-foreground">
            자세한 안내는 README.md 의 “빠른 시작” 섹션을 참고하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
