import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Proposal, ProposalCategory } from '@/lib/db/types';

export type ProposalListItem = Pick<
  Proposal,
  'id' | 'title' | 'category' | 'status' | 'upvotes' | 'comments_count' | 'created_at' | 'is_anonymous' | 'district' | 'author_id'
> & { author: { nickname: string } | null };

export type ProposalListParams = {
  category?: ProposalCategory;
  sort?: 'recent' | 'popular';
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

export async function listProposals(
  params: ProposalListParams = {},
): Promise<{ items: ProposalListItem[]; total: number; page: number; pageSize: number }> {
  const { category, sort = 'recent', page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  if (!supabaseConfigured) return { items: [], total: 0, page, pageSize };

  const supabase = await createClient();
  let query = supabase
    .from('proposals')
    .select(
      'id,title,category,status,upvotes,comments_count,created_at,is_anonymous,district,author_id, author:profiles!author_id(nickname)',
      { count: 'exact' },
    )
    .neq('status', 'draft');

  if (category) query = query.eq('category', category);

  query =
    sort === 'popular'
      ? query.order('upvotes', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const rows = (data ?? []).map((row) => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] ?? null : row.author,
  })) as ProposalListItem[];

  // 라이브 카운트 — 트리거가 없어도 정확히 표시되도록 N+1 없이 한 번에 조회
  const ids = rows.map((r) => r.id);
  const upMap: Record<string, number> = {};
  const cmMap: Record<string, number> = {};
  if (ids.length > 0) {
    const [upRes, cmRes] = await Promise.all([
      supabase.from('proposal_upvotes').select('proposal_id').in('proposal_id', ids),
      supabase
        .from('comments')
        .select('target_id')
        .eq('target_type', 'proposal')
        .in('target_id', ids),
    ]);
    (upRes.data ?? []).forEach((r) => {
      const k = r.proposal_id as string;
      upMap[k] = (upMap[k] ?? 0) + 1;
    });
    (cmRes.data ?? []).forEach((r) => {
      const k = r.target_id as string;
      cmMap[k] = (cmMap[k] ?? 0) + 1;
    });
  }

  const items = rows.map((r) => ({
    ...r,
    upvotes: upMap[r.id] ?? r.upvotes,
    comments_count: cmMap[r.id] ?? r.comments_count,
  }));

  return { items, total: count ?? 0, page, pageSize };
}

export type ProposalDetail = Proposal & {
  author: { nickname: string } | null;
  upvoted_by_me: boolean;
};

export async function getProposal(id: string): Promise<ProposalDetail | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposals')
    .select(
      '*, author:profiles!author_id(nickname)',
    )
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let upvoted = false;
  if (user) {
    const { data: vote } = await supabase
      .from('proposal_upvotes')
      .select('proposal_id')
      .eq('proposal_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    upvoted = !!vote;
  }

  // 트리거 미적용 환경에서도 정확한 카운트가 보이도록 직접 count
  const { count: liveUpvotes } = await supabase
    .from('proposal_upvotes')
    .select('proposal_id', { count: 'exact', head: true })
    .eq('proposal_id', id);

  const base = data as unknown as Proposal;
  return {
    ...base,
    upvotes: liveUpvotes ?? base.upvotes,
    author: Array.isArray((data as { author: unknown }).author)
      ? ((data as { author: { nickname: string }[] }).author[0] ?? null)
      : ((data as { author: { nickname: string } | null }).author ?? null),
    upvoted_by_me: upvoted,
  };
}
