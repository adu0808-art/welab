'use client';

import { useActionState } from 'react';
import { changeProposalStatus } from '@/lib/actions/admin';
import { Select } from '@/components/ui/select';
import type { ProposalStatus } from '@/lib/db/types';

const STATUSES: ProposalStatus[] = [
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'rejected',
  'in_progress',
  'completed',
];

const initial: { error?: string; ok?: boolean } = {};

export function StatusSelector({
  proposalId,
  status,
}: {
  proposalId: string;
  status: ProposalStatus;
}) {
  const [state, formAction, pending] = useActionState(
    changeProposalStatus,
    initial,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="proposal_id" value={proposalId} />
      <Select name="status" defaultValue={status} className="h-9 w-32 text-sm">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border bg-white px-2 py-1 text-xs hover:bg-brand-light disabled:opacity-50"
      >
        {pending ? '...' : '변경'}
      </button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-600">완료</span>}
    </form>
  );
}
