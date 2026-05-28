import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { listCommentsForProposal, type CommentNode } from '@/lib/db/queries/comments';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { CommentForm } from './CommentForm';
import { LikeCommentButton } from './LikeCommentButton';
import { DeleteCommentButton } from './DeleteCommentButton';
import { ReplyToggle } from './ReplyToggle';
import { formatDate, formatNumber } from '@/lib/utils';

type Props = {
  proposalId: string;
};

export async function CommentSection({ proposalId }: Props) {
  const [tree, profile] = await Promise.all([
    listCommentsForProposal(proposalId),
    getCurrentProfile(),
  ]);

  const canWrite = !!profile?.verified;
  const total = countAll(tree);

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-brand-primary" />
        <h2 className="text-lg font-semibold text-brand-primary">
          댓글 {formatNumber(total)}
        </h2>
      </div>

      {/* 작성 폼 */}
      {canWrite ? (
        <CommentForm proposalId={proposalId} />
      ) : (
        <div className="rounded-md border border-dashed border-border bg-brand-bg p-4 text-sm text-muted-foreground">
          {profile ? (
            <>
              댓글 작성은 거주확인 후 가능합니다.{' '}
              <Link href="/mypage/verify" className="font-medium text-brand-primary underline">
                거주확인 시작 →
              </Link>
            </>
          ) : (
            <>
              댓글 작성은 로그인 후 가능합니다.{' '}
              <Link
                href={`/login?next=/proposals/${proposalId}`}
                className="font-medium text-brand-primary underline"
              >
                로그인 →
              </Link>
            </>
          )}
        </div>
      )}

      {/* 목록 */}
      {tree.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          첫 댓글을 남겨주세요.
        </p>
      ) : (
        <ul className="space-y-4">
          {tree.map((c) => (
            <li key={c.id}>
              <CommentItem
                node={c}
                proposalId={proposalId}
                currentUserId={profile?.id}
                canWrite={canWrite}
                isAdmin={profile?.role === 'admin'}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  node,
  proposalId,
  currentUserId,
  canWrite,
  isAdmin,
  depth = 0,
}: {
  node: CommentNode;
  proposalId: string;
  currentUserId?: string;
  canWrite: boolean;
  isAdmin: boolean;
  depth?: number;
}) {
  const displayName = node.is_anonymous
    ? '익명'
    : (node.author?.nickname ?? '주민');
  const isMine = !!currentUserId && currentUserId === node.author_id;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}>
      <article className="rounded-md border border-border bg-white p-3">
        <header className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-primary">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(node.created_at)}
          </span>
        </header>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
          {node.body}
        </p>
        <footer className="mt-2 flex items-center gap-3">
          <LikeCommentButton
            proposalId={proposalId}
            commentId={node.id}
            initialLiked={node.liked_by_me}
            initialCount={node.likes}
            disabled={!canWrite}
          />
          {depth === 0 && (
            <ReplyToggle
              proposalId={proposalId}
              parentId={node.id}
              canWrite={canWrite}
            />
          )}
          {(isMine || isAdmin) && (
            <DeleteCommentButton proposalId={proposalId} commentId={node.id} />
          )}
        </footer>
      </article>

      {node.replies.length > 0 && (
        <ul className="mt-2 space-y-2">
          {node.replies.map((r) => (
            <li key={r.id}>
              <CommentItem
                node={r}
                proposalId={proposalId}
                currentUserId={currentUserId}
                canWrite={canWrite}
                isAdmin={isAdmin}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function countAll(nodes: CommentNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countAll(n.replies), 0);
}
