'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CommentTarget } from '@/lib/db/types';

const CreateSchema = z.object({
  target_type: z.enum(['proposal', 'survey', 'vote', 'project']),
  target_id: z.string().uuid(),
  body: z.string().trim().min(1, '내용을 입력해주세요').max(1000),
  parent_id: z.string().uuid().optional().nullable(),
  is_anonymous: z.any().transform((v) => v === 'on' || v === true),
});

export type CreateCommentState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function pathFor(target: CommentTarget, id: string) {
  switch (target) {
    case 'proposal':
      return `/proposals/${id}`;
    case 'survey':
      return `/surveys/${id}`;
    case 'vote':
      return `/votes/${id}`;
    case 'project':
      return `/projects/${id}`;
  }
}

export async function createComment(
  _prev: CreateCommentState,
  formData: FormData,
): Promise<CreateCommentState> {
  const parsed = CreateSchema.safeParse({
    target_type: formData.get('target_type'),
    target_id: formData.get('target_id') ?? formData.get('proposal_id'),
    body: formData.get('body'),
    parent_id: formData.get('parent_id') || undefined,
    is_anonymous: formData.get('is_anonymous'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

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

  const { error } = await supabase.from('comments').insert({
    target_type: parsed.data.target_type as CommentTarget,
    target_id: parsed.data.target_id,
    author_id: user.id,
    body: parsed.data.body,
    parent_id: parsed.data.parent_id ?? null,
    is_anonymous: parsed.data.is_anonymous,
  });

  if (error) return { error: error.message };

  revalidatePath(pathFor(parsed.data.target_type as CommentTarget, parsed.data.target_id));
  return { ok: true };
}

export async function deleteComment(
  targetType: CommentTarget,
  targetId: string,
  commentId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) return { error: error.message };
  revalidatePath(pathFor(targetType, targetId));
  return { ok: true };
}

export type ToggleLikeResult = { liked: boolean; error?: string };

export async function toggleCommentLike(
  targetType: CommentTarget,
  targetId: string,
  commentId: string,
): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liked: false, error: '로그인이 필요합니다.' };

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);
    if (error) return { liked: true, error: error.message };
    revalidatePath(pathFor(targetType, targetId));
    return { liked: false };
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: user.id });
  if (error) return { liked: false, error: error.message };
  revalidatePath(pathFor(targetType, targetId));
  return { liked: true };
}
