'use client';

import { useState, useTransition } from 'react';
import { toggleEventRegistration } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';

export function RegisterButton({
  eventId,
  initialRegistered,
  canRegister,
  isFull,
}: {
  eventId: string;
  initialRegistered: boolean;
  canRegister: boolean;
  isFull: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await toggleEventRegistration(eventId);
      if (res.error) setErr(res.error);
      else setRegistered(res.registered);
    });
  }

  if (!canRegister)
    return <p className="text-sm text-muted-foreground">거주확인 후 신청 가능합니다.</p>;
  if (isFull && !registered)
    return <p className="text-sm text-destructive">정원이 마감되었습니다.</p>;

  return (
    <div className="space-y-1">
      <Button
        type="button"
        onClick={onClick}
        disabled={pending}
        variant={registered ? 'outline' : 'default'}
      >
        {pending ? '처리 중…' : registered ? '신청 취소' : '신청하기'}
      </Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
