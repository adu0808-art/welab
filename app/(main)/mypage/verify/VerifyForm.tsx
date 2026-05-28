'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockVerify, type VerifyState } from '@/lib/actions/verify';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DISTRICT_LABEL } from '@/lib/constants';

const initial: VerifyState = {};

export function VerifyForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(mockVerify, initial);

  useEffect(() => {
    if (state.ok) {
      router.push('/home?verified=1');
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="district">거주 지자체</Label>
        <Select id="district" name="district" required defaultValue="">
          <option value="" disabled>
            선택해주세요
          </option>
          {(Object.keys(DISTRICT_LABEL) as Array<keyof typeof DISTRICT_LABEL>).map(
            (k) => (
              <option key={k} value={k}>
                {DISTRICT_LABEL[k]}
              </option>
            ),
          )}
        </Select>
        {state.fieldErrors?.district && (
          <p className="text-sm text-destructive">{state.fieldErrors.district[0]}</p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-brand-light/40 p-3 text-sm">
        <input
          type="checkbox"
          name="agree"
          required
          className="mt-1 h-4 w-4 accent-brand-primary"
        />
        <span className="text-foreground/80">
          본인은 위례신도시 거주민이며, 본 확인은 개발용 mock 임을 이해합니다.
          (실제 운영에서는 DID 또는 주소지 인증서류 검증이 진행됩니다)
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? '확인 중...' : '거주확인 완료'}
      </Button>
    </form>
  );
}
