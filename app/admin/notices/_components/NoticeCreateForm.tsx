'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createNotice } from '@/lib/actions/notices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function NoticeCreateForm() {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      try {
        const res = await createNotice({}, fd);
        // eslint-disable-next-line no-console
        console.log('[NoticeCreateForm] result:', res);
        if (res.ok) {
          ref.current?.reset();
          setOkMsg('게시되었습니다.');
          router.refresh();
          return;
        }
        setError(res.error ?? '알 수 없는 오류');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[NoticeCreateForm] caught:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="kind">유형</Label>
          <Select id="kind" name="kind" defaultValue="notice">
            <option value="notice">공지</option>
            <option value="news">뉴스</option>
            <option value="faq">FAQ</option>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required maxLength={200} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">본문</Label>
        <Textarea id="body" name="body" rows={6} required />
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="pinned" className="h-4 w-4 accent-brand-primary" />
          상단 고정
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked
            className="h-4 w-4 accent-brand-primary"
          />
          즉시 게시
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {okMsg && (
        <p
          role="status"
          className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {okMsg}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? '저장 중…' : '게시'}
      </Button>
    </form>
  );
}
