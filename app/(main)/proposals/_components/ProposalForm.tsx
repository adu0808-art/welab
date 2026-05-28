'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createProposal } from '@/lib/actions/proposals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_LABEL } from '@/lib/constants';
import type { ProposalCategory } from '@/lib/db/types';

type State = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export function ProposalForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // native submit 차단
    const formData = new FormData(e.currentTarget);
    setState({});

    startTransition(async () => {
      try {
        const res = await createProposal({}, formData);
        // 진단용 (브라우저 콘솔에서 확인 가능)
        // eslint-disable-next-line no-console
        console.log('[ProposalForm] action result:', res);

        if (res.ok && res.id) {
          router.push(`/proposals/${res.id}`);
          router.refresh();
          return;
        }
        setState({
          error: res.error ?? '알 수 없는 오류 (응답에 ok/error 모두 없음)',
          fieldErrors: res.fieldErrors,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ProposalForm] caught:', err);
        setState({
          error:
            err instanceof Error
              ? `예외: ${err.message}`
              : `예외: ${String(err)}`,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={100}
          placeholder="예: 거여동 교차로에 보행 신호 시간 연장이 필요해요"
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <Select id="category" name="category" required defaultValue="">
          <option value="" disabled>
            선택해주세요
          </option>
          {(Object.keys(CATEGORY_LABEL) as ProposalCategory[]).map((k) => (
            <option key={k} value={k}>
              {CATEGORY_LABEL[k]}
            </option>
          ))}
        </Select>
        {state.fieldErrors?.category && (
          <p className="text-sm text-destructive">{state.fieldErrors.category[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">본문</Label>
        <Textarea
          id="body"
          name="body"
          required
          minLength={20}
          rows={8}
          placeholder="문제 상황과 제안 내용을 구체적으로 적어주세요. (최소 20자)"
        />
        {state.fieldErrors?.body && (
          <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          name="is_anonymous"
          className="h-4 w-4 accent-brand-primary"
        />
        익명으로 발의 (작성자명이 &lsquo;익명&rsquo;으로 표시됩니다)
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? '제출 중…' : '의제 발의하기'}
      </Button>
    </form>
  );
}
