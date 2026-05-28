import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

export const metadata = { title: 'Admin · 개요' };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [users, proposals, surveys, votes, responses, ballots] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('proposals').select('id', { count: 'exact', head: true }),
    supabase.from('surveys').select('id', { count: 'exact', head: true }),
    supabase.from('votes').select('id', { count: 'exact', head: true }),
    supabase.from('responses').select('id', { count: 'exact', head: true }),
    supabase.from('vote_ballots').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: '누적 가입자', value: users.count ?? 0, href: '/admin/users' },
    { label: '발의된 의제', value: proposals.count ?? 0, href: '/admin/proposals' },
    { label: '발행된 설문', value: surveys.count ?? 0, href: '/admin/surveys' },
    { label: '발행된 투표', value: votes.count ?? 0, href: '/admin/votes' },
    { label: '설문 응답', value: responses.count ?? 0 },
    { label: '투표 참여', value: ballots.count ?? 0 },
  ];

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
        관리자 개요
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        주요 지표 한눈에 보기
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const card = (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-brand-primary">
                  {formatNumber(s.value)}
                </p>
              </CardContent>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
