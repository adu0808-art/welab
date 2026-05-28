'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleCommentLike } from '@/lib/actions/comments';
import { cn, formatNumber } from '@/lib/utils';

type Props = {
  proposalId: string;
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
  disabled?: boolean;
};

export function LikeCommentButton({
  proposalId,
  commentId,
  initialLiked,
  initialCount,
  disabled,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (disabled) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleCommentLike(proposalId, commentId);
      if (res.error) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      } else {
        setLiked(res.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-pressed={liked}
      className={cn(
        'inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50',
        liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
      )}
    >
      <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
      {formatNumber(count)}
    </button>
  );
}
