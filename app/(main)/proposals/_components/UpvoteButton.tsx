'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp } from 'lucide-react';
import { toggleUpvote } from '@/lib/actions/proposals';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

type Props = {
  proposalId: string;
  initialUpvoted: boolean;
  initialCount: number;
};

export function UpvoteButton({ proposalId, initialUpvoted, initialCount }: Props) {
  const router = useRouter();
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    // optimistic
    const next = !upvoted;
    setUpvoted(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await toggleUpvote(proposalId);
        // eslint-disable-next-line no-console
        console.log('[UpvoteButton] toggleUpvote result:', res);

        if (res.error) {
          // 롤백
          setUpvoted(!next);
          setCount((c) => c + (next ? -1 : 1));
          setError(res.error);
        } else {
          setUpvoted(res.upvoted);
          // 서버 데이터로 카운트 새로고침 (트리거 없어도 정확한 값 보장)
          router.refresh();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[UpvoteButton] caught:', e);
        setUpvoted(!next);
        setCount((c) => c + (next ? -1 : 1));
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={upvoted}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
          upvoted
            ? 'border-brand-primary bg-brand-primary text-white'
            : 'border-brand-primary/30 bg-white text-brand-primary hover:bg-brand-light',
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        추천 {formatNumber(count)}
      </button>
      {error && (
        <p
          role="alert"
          className="max-w-[260px] text-right text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
