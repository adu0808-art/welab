'use client';

import { useState, useTransition } from 'react';
import { toggleProjectMembership } from '@/lib/actions/projects';
import { Button } from '@/components/ui/button';

type Props = {
  projectId: string;
  initialJoined: boolean;
  canJoin: boolean;
};

export function JoinButton({ projectId, initialJoined, canJoin }: Props) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await toggleProjectMembership(projectId);
      if (res.error) setErr(res.error);
      else setJoined(res.joined);
    });
  }

  if (!canJoin) {
    return (
      <p className="text-sm text-muted-foreground">
        거주확인 후 참여 가능합니다.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={onClick}
        disabled={pending}
        variant={joined ? 'outline' : 'default'}
      >
        {pending ? '처리 중…' : joined ? '참여 취소' : '과제 참여하기'}
      </Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
