'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createComment, type CreateCommentState } from '@/lib/actions/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const initial: CreateCommentState = {};

type Props = {
  proposalId: string;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function CommentForm({
  proposalId,
  parentId,
  placeholder,
  compact,
  onSuccess,
}: Props) {
  const [state, formAction, pending] = useActionState(createComment, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onSuccess?.();
    }
  }, [state.ok, onSuccess]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <input type="hidden" name="proposal_id" value={proposalId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}

      <Textarea
        name="body"
        required
        maxLength={1000}
        rows={compact ? 2 : 3}
        placeholder={
          placeholder ?? (parentId ? '대댓글 작성…' : '의견을 남겨주세요')
        }
      />
      {state.fieldErrors?.body && (
        <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
      )}

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="is_anonymous"
            className="h-3.5 w-3.5 accent-brand-primary"
          />
          익명으로 작성
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? '등록 중…' : parentId ? '답글 등록' : '댓글 등록'}
        </Button>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
