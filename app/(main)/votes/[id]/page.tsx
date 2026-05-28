import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getVote, tallyVote } from '@/lib/db/queries/votes';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BallotForm } from '../_components/BallotForm';
import { CommentSection } from '@/components/features/comments/CommentSection';
import { formatDate, formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';

const STATUS_LABEL = { upcoming: '예정', open: '진행중', closed: '종료' } as const;

export default async function VoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { id } = await params;
  const vote = await getVote(id);
  if (!vote) notFound();

  const profile = await getCurrentProfile();
  const hasVoted = !!vote.my_ballot;
  const showResults = hasVoted || vote.status === 'closed';
  const tally = showResults ? await tallyVote(id) : {};

  return (
    <div className="container py-6 sm:py-10">
      <Link
        href="/votes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge>{vote.type}</Badge>
        <Badge variant={vote.status === 'open' ? 'success' : 'muted'}>
          {STATUS_LABEL[vote.status]}
        </Badge>
        <Badge variant="outline">구속력: {vote.binding_level}</Badge>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-brand-primary sm:text-3xl">
        {vote.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(vote.starts_at)} ~ {formatDate(vote.ends_at)} · 누적 참여{' '}
        {formatNumber(vote.total_ballots)}명
      </p>
      {vote.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
          {vote.description}
        </p>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>참여하기</CardTitle>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/login?next=/votes/${vote.id}`}
                className="font-medium text-brand-primary underline"
              >
                로그인
              </Link>{' '}
              후 참여 가능합니다.
            </p>
          ) : !profile.verified ? (
            <p className="text-sm text-muted-foreground">
              <Link
                href="/mypage/verify"
                className="font-medium text-brand-primary underline"
              >
                거주확인
              </Link>{' '}
              후 참여 가능합니다.
            </p>
          ) : (
            <BallotForm
              voteId={vote.id}
              type={vote.type}
              options={vote.options_parsed}
              config={vote.config}
              hasVoted={hasVoted}
            />
          )}
        </CardContent>
      </Card>

      {showResults && Object.keys(tally).length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>현재 집계</CardTitle>
          </CardHeader>
          <CardContent>
            <Results tally={tally} options={vote.options_parsed} type={vote.type} />
          </CardContent>
        </Card>
      )}

      <CommentSection
        targetType="vote"
        targetId={vote.id}
        loginNext={`/votes/${vote.id}`}
      />
    </div>
  );
}

function Results({
  tally,
  options,
  type,
}: {
  tally: Record<string, number>;
  options: Array<{ id: string; label: string }>;
  type: string;
}) {
  const total = Object.values(tally).reduce((a, b) => a + b, 0) || 1;

  const rows =
    type === 'approval'
      ? (['yes', 'no', 'abstain'] as const).map((k) => ({
          id: k,
          label: k === 'yes' ? '찬성' : k === 'no' ? '반대' : '기권',
        }))
      : options;

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const cnt = tally[r.id] ?? 0;
        const pct = Math.round((cnt / total) * 100);
        return (
          <li key={r.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-brand-primary">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {cnt}표 · {pct}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
