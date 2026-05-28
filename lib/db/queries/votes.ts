import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Vote, VoteBallot, VoteStatus } from '@/lib/db/types';

export type VoteOption = { id: string; label: string; amount?: number };

export type VoteListItem = Pick<
  Vote,
  'id' | 'title' | 'description' | 'type' | 'starts_at' | 'ends_at' | 'status' | 'binding_level'
>;

export async function listVotes(status?: VoteStatus): Promise<VoteListItem[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase
    .from('votes')
    .select('id,title,description,type,starts_at,ends_at,status,binding_level')
    .order('starts_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as VoteListItem[];
}

export type VoteDetail = Vote & {
  options_parsed: VoteOption[];
  my_ballot: VoteBallot | null;
  total_ballots: number;
};

export async function getVote(id: string): Promise<VoteDetail | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;

  const optionsParsed: VoteOption[] = Array.isArray(data.options)
    ? (data.options as VoteOption[])
    : [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myBallot: VoteBallot | null = null;
  if (user) {
    const { data: ballot } = await supabase
      .from('vote_ballots')
      .select('*')
      .eq('vote_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    myBallot = (ballot as VoteBallot | null) ?? null;
  }

  const { count } = await supabase
    .from('vote_ballots')
    .select('id', { count: 'exact', head: true })
    .eq('vote_id', id);

  return {
    ...(data as Vote),
    options_parsed: optionsParsed,
    my_ballot: myBallot,
    total_ballots: count ?? 0,
  };
}

/**
 * 모든 투표 유형의 옵션별 집계.
 * - single/multiple/approval: 표 수
 * - budget: 옵션별 배분 금액 합
 * - ranking: Borda count (n-1, n-2, ...)
 * - weighted: 가중치 합
 */
export async function tallyVote(id: string): Promise<Record<string, number>> {
  if (!supabaseConfigured) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from('vote_ballots')
    .select('choice')
    .eq('vote_id', id);

  const tally: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const c = row.choice as {
      option?: string;
      options?: string[];
      vote?: string;
      allocations?: Record<string, number>;
      order?: string[];
      weights?: Record<string, number>;
    };
    if (c.option) tally[c.option] = (tally[c.option] ?? 0) + 1;
    else if (Array.isArray(c.options))
      c.options.forEach((o) => (tally[o] = (tally[o] ?? 0) + 1));
    else if (c.vote) tally[c.vote] = (tally[c.vote] ?? 0) + 1;
    else if (c.allocations)
      Object.entries(c.allocations).forEach(
        ([k, v]) => (tally[k] = (tally[k] ?? 0) + Number(v || 0)),
      );
    else if (Array.isArray(c.order)) {
      const n = c.order.length;
      c.order.forEach((id, idx) => {
        tally[id] = (tally[id] ?? 0) + (n - idx);
      });
    } else if (c.weights)
      Object.entries(c.weights).forEach(
        ([k, v]) => (tally[k] = +((tally[k] ?? 0) + Number(v || 0)).toFixed(4)),
      );
  });
  return tally;
}
