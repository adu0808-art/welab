'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/actions/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/shared/DateTimePicker';

export function EventCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [allDay, setAllDay] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const res = await createEvent({}, fd);
        // eslint-disable-next-line no-console
        console.log('[EventCreateForm] result:', res);
        if (res.ok) {
          router.push('/admin/events');
          router.refresh();
          return;
        }
        setError(res.error ?? '알 수 없는 오류');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[EventCreateForm] caught:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">장소</Label>
        <Input id="location" name="location" placeholder="예: 위례동 주민센터 다목적실" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4 accent-brand-primary"
        />
        종일 행사 (시간 입력 없이 하루 종일 진행)
      </label>

      <div className="space-y-2">
        <Label>시작</Label>
        <DateTimePicker
          name="starts_at"
          required
          initialOffsetHours={24 * 7}
          allDay={allDay}
          allDayHour="00"
          allDayMinute="00"
        />
      </div>
      <div className="space-y-2">
        <Label>종료</Label>
        <DateTimePicker
          name="ends_at"
          required
          initialOffsetHours={24 * 7 + 2}
          allDay={allDay}
          allDayHour="23"
          allDayMinute="50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">정원</Label>
        <Input id="capacity" name="capacity" type="number" min={1} defaultValue={30} />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? '저장 중…' : '행사 등록'}
      </Button>
    </form>
  );
}
