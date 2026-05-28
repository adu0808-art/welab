'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createVote } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/shared/DateTimePicker';

export function VoteCreateForm() {
  const router = useRouter();
  const [type, setType] = useState<
    'single' | 'multiple' | 'approval' | 'budget' | 'ranking' | 'weighted'
  >('single');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const res = await createVote({}, fd);
        // eslint-disable-next-line no-console
        console.log('[VoteCreateForm] result:', res);
        if (res.ok) {
          router.push('/admin/votes');
          router.refresh();
          return;
        }
        setError(res.error ?? '알 수 없는 오류 (응답에 ok/error 모두 없음)');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[VoteCreateForm] caught:', err);
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
        <Label htmlFor="description">설명</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">유형</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="single">단일 (1택)</option>
          <option value="multiple">다중 (복수 선택)</option>
          <option value="approval">찬반 (찬성/반대/기권)</option>
          <option value="budget">예산 배분</option>
          <option value="ranking">순위 (Borda count)</option>
          <option value="weighted">가중치</option>
        </Select>
      </div>

      {type !== 'approval' && (
        <div className="space-y-2">
          <Label htmlFor="options_raw">선택지 (한 줄에 하나)</Label>
          <Textarea
            id="options_raw"
            name="options_raw"
            rows={5}
            required
            placeholder={'예시1\n예시2\n예시3'}
          />
        </div>
      )}

      {type === 'budget' && (
        <div className="space-y-2">
          <Label htmlFor="budget_total">총 예산 (원)</Label>
          <Input
            id="budget_total"
            name="budget_total"
            type="number"
            min={0}
            step={100000}
            defaultValue={1000000000}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>시작</Label>
        <DateTimePicker name="starts_at" required initialOffsetHours={1} />
      </div>
      <div className="space-y-2">
        <Label>종료</Label>
        <DateTimePicker name="ends_at" required initialOffsetHours={25} />
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
        {pending ? '발행 중…' : '투표 발행'}
      </Button>
    </form>
  );
}
