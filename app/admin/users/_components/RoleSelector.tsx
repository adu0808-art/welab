'use client';

import { useActionState } from 'react';
import { changeUserRole } from '@/lib/actions/admin';
import { Select } from '@/components/ui/select';
import type { UserRole } from '@/lib/db/types';

const ROLES: UserRole[] = ['guest', 'verified', 'active', 'leader', 'admin'];
const initial: { error?: string; ok?: boolean } = {};

export function RoleSelector({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [state, formAction, pending] = useActionState(changeUserRole, initial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <Select name="role" defaultValue={role} className="h-9 w-28 text-sm">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
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
      {state.error && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
      {state.ok && <span className="text-xs text-emerald-600">완료</span>}
    </form>
  );
}
