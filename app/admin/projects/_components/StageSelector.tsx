'use client';

import { useActionState } from 'react';
import { changeProjectStage } from '@/lib/actions/projects';
import { Select } from '@/components/ui/select';
import type { ProjectStage } from '@/lib/db/types';

const STAGES: ProjectStage[] = ['discover', 'define', 'develop', 'deploy', 'diffuse'];
const initial: { ok?: boolean; error?: string } = {};

export function StageSelector({
  projectId,
  stage,
}: {
  projectId: string;
  stage: ProjectStage;
}) {
  const [state, formAction, pending] = useActionState(changeProjectStage, initial);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="project_id" value={projectId} />
      <Select name="stage" defaultValue={stage} className="h-9 w-28 text-sm">
        {STAGES.map((s) => (
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
