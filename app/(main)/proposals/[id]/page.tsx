import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { getProposal } from '@/lib/db/queries/proposals';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UpvoteButton } from '../_components/UpvoteButton';
import { CommentSection } from '@/components/features/comments/CommentSection';
import { CATEGORY_LABEL, DISTRICT_LABEL } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;

  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const profile = await getCurrentProfile();
  const canUpvote = !!profile?.verified;

  const displayName = proposal.is_anonymous
    ? '익명'
    : (proposal.author?.nickname ?? '주민');

  return (
    <div className="container py-6 sm:py-10">
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </Link>

      <article className="mt-4 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{CATEGORY_LABEL[proposal.category]}</Badge>
          {proposal.district && (
            <Badge variant="outline">
              {DISTRICT_LABEL[proposal.district]}
            </Badge>
          )}
          <Badge variant="muted">상태: {proposal.status}</Badge>
        </div>

        <h1 className="text-2xl font-bold leading-tight text-brand-primary sm:text-3xl">
          {proposal.title}
        </h1>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {displayName} · {formatDate(proposal.created_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />{' '}
            {formatNumber(proposal.comments_count)}
          </span>
        </div>

        <Card>
          <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap pt-5 text-foreground">
            {proposal.body}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-md border border-border bg-brand-bg p-4">
          <div>
            <p className="text-sm font-medium text-brand-primary">
              이 의제에 공감하시나요?
            </p>
            <p className="text-xs text-muted-foreground">
              100표 이상이면 정식 의제로 등록됩니다.
            </p>
          </div>
          {canUpvote ? (
            <UpvoteButton
              proposalId={proposal.id}
              initialUpvoted={proposal.upvoted_by_me}
              initialCount={proposal.upvotes}
            />
          ) : (
            <Link
              href={profile ? '/mypage/verify' : '/login?next=/proposals/' + proposal.id}
              className="text-sm font-medium text-brand-primary underline"
            >
              {profile ? '거주확인 후 추천' : '로그인 후 추천'} →
            </Link>
          )}
        </div>

        <CommentSection
          targetType="proposal"
          targetId={proposal.id}
          loginNext={`/proposals/${proposal.id}`}
        />
      </article>
    </div>
  );
}
