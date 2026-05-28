import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Comment, CommentTarget } from '@/lib/db/types';

export type CommentNode = Comment & {
  author: { nickname: string } | null;
  liked_by_me: boolean;
  replies: CommentNode[];
};

export async function listComments(
  targetType: CommentTarget,
  targetId: string,
): Promise<CommentNode[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(
      'id,target_type,target_id,author_id,body,parent_id,likes,is_anonymous,created_at,updated_at, author:profiles!author_id(nickname)',
    )
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const likedSet = new Set<string>();
  if (user && data.length > 0) {
    const ids = data.map((c) => c.id as string);
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', ids)
      .eq('user_id', user.id);
    likes?.forEach((l) => likedSet.add(l.comment_id as string));
  }

  const all: CommentNode[] = data.map((c) => {
    const author = Array.isArray((c as { author: unknown }).author)
      ? ((c as { author: { nickname: string }[] }).author[0] ?? null)
      : ((c as { author: { nickname: string } | null }).author ?? null);
    return {
      id: c.id as string,
      target_type: c.target_type as CommentTarget,
      target_id: c.target_id as string,
      author_id: c.author_id as string,
      body: c.body as string,
      parent_id: (c.parent_id as string | null) ?? null,
      likes: c.likes as number,
      is_anonymous: c.is_anonymous as boolean,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      author,
      liked_by_me: likedSet.has(c.id as string),
      replies: [],
    };
  });

  const byId = new Map<string, CommentNode>();
  all.forEach((n) => byId.set(n.id, n));
  const roots: CommentNode[] = [];
  all.forEach((n) => {
    if (n.parent_id && byId.has(n.parent_id)) {
      byId.get(n.parent_id)!.replies.push(n);
    } else {
      roots.push(n);
    }
  });
  return roots;
}

// 하위 호환
export const listCommentsForProposal = (id: string) => listComments('proposal', id);
