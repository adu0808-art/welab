import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listVotes } from '@/lib/db/queries/votes';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { VoteStatus } from '@/lib/db/types';

export const preferredRegion = 'hnd1';
export const metadata = { title: '투표' };

const STATUS_LABEL: Record<VoteStatus, string> = {
  upcoming: '예정',
  open: '진행중',
  closed: '종료',
};

const TYPE_LABEL: Record<string, string> = {
  single: '단일 투표',
  multiple: '다중 투표',
  approval: '찬반 투표',
  budget: '예산참여',
  ranking: '순위 투표',
  weighted: '가중치',
};

export default async function VotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const sp = await searchParams;
  const status = (['upcoming', 'open', 'closed'] as VoteStatus[]).includes(
    sp.status as VoteStatus,
  )
    ? (sp.status as VoteStatus)
    : undefined;

  const [items, profile] = await Promise.all([
    listVotes(status),
    getCurrentProfile(),
  ]);
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">투표</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            주민이 함께 결정합니다. 거주확인 후 1인 1표 원칙으로 참여하세요.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/votes/new"
            className={buttonVariants({ variant: 'default' })}
          >
            <Plus className="h-4 w-4" />
            투표 발행
          </Link>
        )}
      </div>

      <nav className="mt-5 flex gap-2 text-sm">
        {[undefined, 'open', 'upcoming', 'closed'].map((s) => {
          const active = (status ?? undefined) === s;
          const href = s ? `/votes?status=${s}` : '/votes';
          return (
            <Link
              key={s ?? 'all'}
              href={href}
              className={
                active
                  ? 'rounded-full bg-brand-primary px-3 py-1 text-white'
                  : 'rounded-full border border-border bg-white px-3 py-1 text-brand-primary hover:bg-brand-light'
              }
            >
              {s ? STATUS_LABEL[s as VoteStatus] : '전체'}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            표시할 투표가 없습니다. 관리자가 발행 후 표시됩니다.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <Link key={v.id} href={`/votes/${v.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{TYPE_LABEL[v.type] ?? v.type}</Badge>
                    <Badge variant={v.status === 'open' ? 'success' : 'muted'}>
                      {STATUS_LABEL[v.status]}
                    </Badge>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold text-brand-primary">
                    {v.title}
                  </h3>
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {v.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDate(v.starts_at)} ~ {formatDate(v.ends_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
