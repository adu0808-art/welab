import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Supabase 키가 채워지지 않았을 때 표시할 안내.
 * 배포 환경(Vercel)과 로컬 환경에서 안내 문구가 달라집니다.
 */
export function SetupNotice() {
  const isVercel = !!process.env.VERCEL;

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
          {isVercel ? <VercelGuide /> : <LocalGuide />}
        </CardContent>
      </Card>
    </div>
  );
}

function VercelGuide() {
  return (
    <>
      <p>
        Vercel Dashboard 에서 환경변수를 등록한 뒤 <strong>Redeploy</strong> 하셔야 합니다.
      </p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline"
          >
            Vercel Dashboard
          </a>{' '}
          → 본 프로젝트 → <strong>Settings → Environment Variables</strong>
        </li>
        <li>
          다음 3개 변수 추가 (Production·Preview·Development 모두 체크)
          <ul className="mt-2 space-y-1 rounded-md bg-white p-3 font-mono text-xs">
            <li>
              <span className="text-brand-primary">NEXT_PUBLIC_SUPABASE_URL</span>{' '}
              = https://&lt;project-ref&gt;.supabase.co
            </li>
            <li>
              <span className="text-brand-primary">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
              = eyJhbGc… (긴 JWT)
            </li>
            <li>
              <span className="text-brand-primary">NEXT_PUBLIC_SITE_URL</span>{' '}
              = (현재 도메인)
            </li>
          </ul>
        </li>
        <li>
          <strong>Deployments → 최신 deployment → ⋯ → Redeploy</strong> 로 재배포
        </li>
      </ol>
      <p className="pt-2 text-muted-foreground">
        Supabase 키는 Dashboard → Settings → API 에서 확인할 수 있습니다.
      </p>
    </>
  );
}

function LocalGuide() {
  return (
    <>
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
    </>
  );
}
