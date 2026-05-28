'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function ProjectCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const res = await createProject({}, fd);
        // eslint-disable-next-line no-console
        console.log('[ProjectCreateForm] result:', res);
        if (res.ok) {
          router.push('/admin/projects');
          router.refresh();
          return;
        }
        setError(res.error ?? '알 수 없는 오류');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ProjectCreateForm] caught:', err);
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
        <Label htmlFor="summary">개요</Label>
        <Textarea id="summary" name="summary" rows={3} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budget">예산 (원)</Label>
          <Input id="budget" name="budget" type="number" min={0} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">현재 단계</Label>
          <Select id="stage" name="stage" defaultValue="discover">
            <option value="discover">발굴</option>
            <option value="define">정의</option>
            <option value="develop">실험</option>
            <option value="deploy">실증</option>
            <option value="diffuse">확산</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="starts_on">시작일</Label>
          <Input id="starts_on" name="starts_on" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_on">종료일</Label>
          <Input id="ends_on" name="ends_on" type="date" />
        </div>
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
        {pending ? '저장 중…' : '과제 등록'}
      </Button>
    </form>
  );
}
