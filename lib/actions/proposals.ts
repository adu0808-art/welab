'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const CategoryEnum = z.enum([
  'traffic',
  'environment',
  'safety',
  'community',
  'parenting',
  'etc',
]);

// 체크박스는 unchecked 시 null/undefined 가 들어오므로 z.any() 로 받고 transform
const checkboxField = z.any().transform((v) => v === 'on' || v === true);

const CreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, '제목은 5자 이상 입력해주세요')
    .max(100, '제목은 100자 이하여야 합니다'),
  body: z
    .string()
    .trim()
    .min(20, '본문은 20자 이상 입력해주세요'),
  category: CategoryEnum,
  is_anonymous: checkboxField,
});

export type CreateProposalState = {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProposal(
  _prev: CreateProposalState,
  formData: FormData,
): Promise<CreateProposalState> {
  const parsed = CreateSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    category: formData.get('category'),
    is_anonymous: formData.get('is_anonymous'),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const summary = [
      ...flat.formErrors,
      ...Object.entries(flat.fieldErrors)
        .filter(([, v]) => v && v.length > 0)
        .map(([k, v]) => `${k}: ${v?.[0]}`),
    ];
    console.error('[createProposal] zod fail:', summary, parsed.error.issues);
    return {
      error: `입력 검증 실패: ${summary.join(' / ') || '알 수 없는 필드'}`,
      fieldErrors: flat.fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('verified, district')
    .eq('id', user.id)
    .single();
  if (profileErr) {
    console.error('[createProposal] profile fetch error:', profileErr);
    return { error: `프로필 조회 실패: ${profileErr.message}` };
  }
  if (!profile?.verified)
    return { error: '거주확인을 먼저 완료해주세요. (/mypage/verify)' };

  const { data: inserted, error } = await supabase
    .from('proposals')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      is_anonymous: parsed.data.is_anonymous,
      district: profile.district ?? null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[createProposal] insert error:', error);
    // 트리거 함수 누락 등 상세 메시지 노출
    return {
      error: error?.message ?? '저장 실패 (insert 결과 없음)',
    };
  }

  revalidatePath('/proposals');
  // redirect 는 client 에서 처리 (useActionState 와의 throw 충돌 회피)
  return { ok: true, id: inserted.id as string };
}

export type ToggleUpvoteResult = { upvoted: boolean; error?: string };

export async function toggleUpvote(proposalId: string): Promise<ToggleUpvoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { upvoted: false, error: '로그인이 필요합니다.' };

  // 거주확인 가드 (RLS 에서도 검사하지만 더 명확한 메시지)
  const { data: profile } = await supabase
    .from('profiles')
    .select('verified')
    .eq('id', user.id)
    .single();
  if (!profile?.verified)
    return { upvoted: false, error: '거주확인을 먼저 완료해주세요. (/mypage/verify)' };

  // 현재 상태 조회
  const { data: existing } = await supabase
    .from('proposal_upvotes')
    .select('proposal_id')
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('proposal_upvotes')
      .delete()
      .eq('proposal_id', proposalId)
      .eq('user_id', user.id);
    if (error) {
      console.error('[toggleUpvote] delete error:', error);
      return { upvoted: true, error: `취소 실패: ${error.message}` };
    }
    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath('/proposals');
    return { upvoted: false };
  }

  const { error } = await supabase
    .from('proposal_upvotes')
    .insert({ proposal_id: proposalId, user_id: user.id });
  if (error) {
    console.error('[toggleUpvote] insert error:', error);
    return { upvoted: false, error: `추천 실패: ${error.message}` };
  }
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath('/proposals');
  return { upvoted: true };
}
