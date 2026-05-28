'use client';

import { useTransition } from 'react';
import { deleteComment } from '@/lib/actions/comments';

export function DeleteCommentButton({
  proposalId,
  commentId,
}: {
  proposalId: string;
  commentId: string;
}) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm('댓글을 삭제할까요?')) return;
    startTransition(async () => {
      await deleteComment(proposalId, commentId);
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      {pending ? '삭제 중…' : '삭제'}
    </button>
  );
}
