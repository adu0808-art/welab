'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { VoteType } from '@/lib/db/types';

const Choice = {
  single: z.object({ option: z.string().min(1) }),
  multiple: z.object({ options: z.array(z.string().min(1)).min(1) }),
  approval: z.object({ vote: z.enum(['yes', 'no', 'abstain']) }),
  budget: z.object({
    allocations: z.record(z.string(), z.number().int().nonnegative()),
  }),
  ranking: z.object({ order: z.array(z.string()).min(1) }),
  weighted: z.object({
    weights: z.record(z.string(), z.number().min(0).max(1)),
  }),
};

export type CastBallotState = { ok?: boolean; error?: string };

export async function castBallot(
  _prev: CastBallotState,
  formData: FormData,
): Promise<CastBallotState> {
  const voteId = formData.get('vote_id') as string;
  const type = formData.get('vote_type') as VoteType;
  if (!voteId || !type) return { error: '필수 정보가 누락되었습니다.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('verified')
    .eq('id', user.id)
    .single();
  if (!profile?.verified)
    return { error: '거주확인을 먼저 완료해주세요. (/mypage/verify)' };

  const { data: voteRow } = await supabase
    .from('votes')
    .select('status,starts_at,ends_at,config,options')
    .eq('id', voteId)
    .single();
  if (!voteRow) return { error: '투표를 찾을 수 없습니다.' };
  const now = new Date();
  if (
    voteRow.status !== 'open' ||
    new Date(voteRow.starts_at) > now ||
    new Date(voteRow.ends_at) < now
  ) {
    return { error: '현재 투표 가능 기간이 아닙니다.' };
  }

  let choice: unknown;
  if (type === 'single') {
    const parsed = Choice.single.safeParse({ option: formData.get('option') });
    if (!parsed.success) return { error: '선택지를 골라주세요.' };
    choice = parsed.data;
  } else if (type === 'multiple') {
    const options = formData.getAll('options').map(String);
    const parsed = Choice.multiple.safeParse({ options });
    if (!parsed.success) return { error: '하나 이상 선택해주세요.' };
    choice = parsed.data;
  } else if (type === 'approval') {
    const parsed = Choice.approval.safeParse({ vote: formData.get('vote') });
    if (!parsed.success) return { error: '찬성/반대/기권 중 선택해주세요.' };
    choice = parsed.data;
  } else if (type === 'budget') {
    // formData: alloc_<optionId> = number
    const config = (voteRow.config ?? {}) as { total?: number };
    const total = Number(config.total ?? 1000000);
    const allocations: Record<string, number> = {};
    let sum = 0;
    formData.forEach((v, k) => {
      if (k.startsWith('alloc_')) {
        const id = k.slice('alloc_'.length);
        const n = Math.max(0, Math.floor(Number(v) || 0));
        allocations[id] = n;
        sum += n;
      }
    });
    if (sum === 0) return { error: '예산을 1원 이상 배분해주세요.' };
    if (sum > total) return { error: `총 예산(${total.toLocaleString()}원)을 초과했습니다.` };
    const parsed = Choice.budget.safeParse({ allocations });
    if (!parsed.success) return { error: '예산 입력값이 유효하지 않습니다.' };
    choice = parsed.data;
  } else if (type === 'ranking') {
    const orderRaw = formData.get('order') as string | null;
    const order = (orderRaw ?? '').split(',').filter(Boolean);
    const parsed = Choice.ranking.safeParse({ order });
    if (!parsed.success) return { error: '순위를 정해주세요.' };
    choice = parsed.data;
  } else if (type === 'weighted') {
    const weights: Record<string, number> = {};
    let sum = 0;
    formData.forEach((v, k) => {
      if (k.startsWith('weight_')) {
        const id = k.slice('weight_'.length);
        const n = Math.min(1, Math.max(0, Number(v) || 0));
        weights[id] = n;
        sum += n;
      }
    });
    if (sum === 0) return { error: '가중치를 1개 이상 입력해주세요.' };
    // 정규화 (합 1.0)
    Object.keys(weights).forEach((k) => (weights[k] = +(weights[k] / sum).toFixed(4)));
    const parsed = Choice.weighted.safeParse({ weights });
    if (!parsed.success) return { error: '가중치 입력값이 유효하지 않습니다.' };
    choice = parsed.data;
  } else {
    return { error: '지원하지 않는 투표 유형입니다.' };
  }

  const { error } = await supabase
    .from('vote_ballots')
    .insert({ vote_id: voteId, user_id: user.id, choice });
  if (error) {
    if (error.code === '23505') return { error: '이미 투표하셨습니다.' };
    return { error: error.message };
  }

  revalidatePath(`/votes/${voteId}`);
  revalidatePath('/votes');
  return { ok: true };
}
