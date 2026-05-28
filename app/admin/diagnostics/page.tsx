import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const preferredRegion = 'hnd1';
export const metadata = { title: 'Admin · 진단' };
export const dynamic = 'force-dynamic';

function parseRef(url: string | undefined): string {
  if (!url) return '(미설정)';
  const m = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return m ? m[1] : url;
}

export default async function DiagnosticsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = parseRef(supabaseUrl);
  const isVercel = !!process.env.VERCEL;
  const vercelEnv = process.env.VERCEL_ENV; // production | preview | development
  const vercelUrl = process.env.VERCEL_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonKeyTail = anonKey ? `…${anonKey.slice(-12)}` : '(미설정)';

  // 실제 DB 에 핑 — 연결 + 카운트
  const supabase = await createClient();
  const [
    profilesCount,
    proposalsCount,
    surveysCount,
    votesCount,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('proposals').select('id', { count: 'exact', head: true }),
    supabase.from('surveys').select('id', { count: 'exact', head: true }),
    supabase.from('votes').select('id', { count: 'exact', head: true }),
  ]);

  return (
    <div className="container max-w-3xl py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">환경 진단</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        현재 이 페이지가 어느 환경에서 실행 중이고, 어느 Supabase 프로젝트에 연결돼 있는지 보여줍니다.
        <br />
        로컬과 Vercel 에서 같은 페이지를 열어 <strong>project ref 가 서로 다른지</strong> 확인하세요.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>실행 환경</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="런타임" value={isVercel ? 'Vercel' : '로컬 (next dev)'} />
          {isVercel && (
            <>
              <Row label="VERCEL_ENV" value={vercelEnv ?? '(없음)'} />
              <Row label="VERCEL_URL" value={vercelUrl ?? '(없음)'} />
            </>
          )}
          <Row label="NEXT_PUBLIC_SITE_URL" value={siteUrl ?? '(미설정)'} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Supabase 연결</CardTitle>
          <CardDescription>NEXT_PUBLIC_SUPABASE_URL 에서 자동 추출</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row
            label="Project ref"
            value={projectRef}
            highlight
          />
          <Row label="Project URL" value={supabaseUrl ?? '(미설정)'} mono />
          <Row label="anon key (끝 12자)" value={anonKeyTail} mono />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>DB 핑</CardTitle>
          <CardDescription>실제 응답 카운트 — 빈 값이면 DB 연결은 OK</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="profiles" value={String(profilesCount.count ?? '(error)')} />
          <Row label="proposals" value={String(proposalsCount.count ?? '(error)')} />
          <Row label="surveys" value={String(surveysCount.count ?? '(error)')} />
          <Row label="votes" value={String(votesCount.count ?? '(error)')} />
        </CardContent>
      </Card>

      <Card className="mt-4 border-brand-accent/30 bg-brand-light/40">
        <CardHeader>
          <CardTitle className="text-base">예상 값</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <Badge>로컬</Badge>{' '}
            project ref ={' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              ojynvgtrhsdgttndcfqz
            </code>{' '}
            (dev)
          </div>
          <div>
            <Badge variant="success">Vercel Production</Badge>{' '}
            project ref ={' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              umjywmwvepaxxryjtbeo
            </code>{' '}
            (prod)
          </div>
          <p className="pt-2 text-muted-foreground">
            만약 로컬에서도 prod ref 가 보이면 <code>.env.local</code> 의 키를 dev 값으로 되돌리고 dev 서버를 재시작하세요.
            <br />
            Vercel 에서 dev ref 가 보이면 Settings → Environment Variables 의 Production 슬롯이 비어있거나 잘못 입력된 것입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-right ${mono ? 'font-mono text-xs' : ''} ${
          highlight ? 'font-bold text-brand-primary' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
