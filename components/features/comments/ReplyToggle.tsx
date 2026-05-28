'use client';

import { useState } from 'react';
import { CommentForm } from './CommentForm';
import type { CommentTarget } from '@/lib/db/types';

type Props = {
  targetType: CommentTarget;
  targetId: string;
  parentId: string;
  canWrite: boolean;
};

export function ReplyToggle({ targetType, targetId, parentId, canWrite }: Props) {
  const [open, setOpen] = useState(false);
  if (!canWrite) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-brand-primary"
      >
        답글 달기
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-border bg-white p-3">
      <CommentForm
        targetType={targetType}
        targetId={targetId}
        parentId={parentId}
        compact
        onSuccess={() => setOpen(false)}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-xs text-muted-foreground hover:text-brand-primary"
      >
        취소
      </button>
    </div>
  );
}
