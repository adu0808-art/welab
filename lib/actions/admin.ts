'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  ProposalStatus,
  UserRole,
  VoteType,
  QuestionType,
} from '@/lib/db/types';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') throw new Error('FORBIDDEN');
  return supabase;
}

// ─────────────────────────────────────────────────────────────────────
// 사용자 권한 변경
// ─────────────────────────────────────────────────────────────────────
const RoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['guest', 'verified', 'active', 'leader', 'admin']),
});

export async function changeUserRole(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const supabase = await requireAdmin();
    const parsed = RoleSchema.safeParse({
      user_id: formData.get('user_id'),
      role: formData.get('role'),
    });
    if (!parsed.success) return { error: '입력값이 잘못되었습니다.' };

    const { error } = await supabase
      .from('profiles')
      .update({ role: parsed.data.role as UserRole })
      .eq('id', parsed.data.user_id);
    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 의제 상태 변경 (모더레이션)
// ─────────────────────────────────────────────────────────────────────
const ProposalStatusSchema = z.object({
  proposal_id: z.string().uuid(),
  status: z.enum([
    'draft',
    'submitted',
    'reviewing',
    'approved',
    'rejected',
    'in_progress',
    'completed',
  ]),
});

export async function changeProposalStatus(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const supabase = await requireAdmin();
    const parsed = ProposalStatusSchema.safeParse({
      proposal_id: formData.get('proposal_id'),
      status: formData.get('status'),
    });
    if (!parsed.success) return { error: '입력값이 잘못되었습니다.' };

    const { error } = await supabase
      .from('proposals')
      .update({ status: parsed.data.status as ProposalStatus })
      .eq('id', parsed.data.proposal_id);
    if (error) return { error: error.message };

    revalidatePath('/admin/proposals');
    revalidatePath(`/proposals/${parsed.data.proposal_id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 투표 발행 (간소화: 단일/다중/찬반 + options JSON)
// ─────────────────────────────────────────────────────────────────────
const VoteSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['single', 'multiple', 'approval', 'budget', 'ranking', 'weighted'] as const),
  options_raw: z.string().optional(), // 줄바꿈 구분
  budget_total: z.coerce.number().int().nonnegative().optional(),
  starts_at: z.string().min(10),
  ends_at: z.string().min(10),
});

export async function createVote(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const supabase = await requireAdmin();
    const parsed = VoteSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') ?? undefined,
      type: formData.get('type'),
      options_raw: formData.get('options_raw') ?? '',
      budget_total: formData.get('budget_total') ?? undefined,
      starts_at: formData.get('starts_at'),
      ends_at: formData.get('ends_at'),
    });
    if (!parsed.success) return { error: '입력값을 확인해주세요.' };

    const options =
      parsed.data.type === 'approval'
        ? []
        : (parsed.data.options_raw ?? '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((label, i) => ({ id: `o${i + 1}`, label }));

    if (parsed.data.type !== 'approval' && options.length < 2) {
      return { error: '선택지를 2개 이상 입력해주세요.' };
    }

    const config: Record<string, unknown> = {};
    if (parsed.data.type === 'budget') {
      config.total = parsed.data.budget_total ?? 1000000;
    }

    const { error } = await supabase.from('votes').insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type as VoteType,
      options,
      config,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      status: 'open',
    });
    if (error) return { error: error.message };

    revalidatePath('/admin/votes');
    revalidatePath('/votes');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 설문 발행 (제목 + 단일 페이지에서 questions 같이 등록)
// 폼 데이터: question_body_N, question_type_N, question_options_N (줄바꿈)
// ─────────────────────────────────────────────────────────────────────
const SurveyMetaSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().optional(),
  starts_at: z.string().min(10),
  ends_at: z.string().min(10),
  reward_points: z.coerce.number().int().min(0).max(1000).default(50),
  allow_anonymous: z.any().transform((v) => v === 'on' || v === true),
});

export async function createSurvey(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    const supabase = await requireAdmin();
    const parsed = SurveyMetaSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') ?? undefined,
      starts_at: formData.get('starts_at'),
      ends_at: formData.get('ends_at'),
      reward_points: formData.get('reward_points') ?? 50,
      allow_anonymous: formData.get('allow_anonymous'),
    });
    if (!parsed.success) return { error: '입력값을 확인해주세요.' };

    // questions 모으기 (최대 20개)
    type QInput = { body: string; type: QuestionType; options?: { id: string; label: string }[] };
    const qs: QInput[] = [];
    for (let i = 0; i < 20; i++) {
      const body = (formData.get(`question_body_${i}`) as string | null)?.trim();
      const type = formData.get(`question_type_${i}`) as QuestionType | null;
      if (!body || !type) continue;
      const optsRaw = (formData.get(`question_options_${i}`) as string | null) ?? '';
      const options =
        type === 'single' || type === 'multiple'
          ? optsRaw
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((label, idx) => ({ id: `o${idx + 1}`, label }))
          : undefined;
      qs.push({ body, type, options });
    }
    if (qs.length === 0) return { error: '문항을 1개 이상 추가해주세요.' };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        starts_at: new Date(parsed.data.starts_at).toISOString(),
        ends_at: new Date(parsed.data.ends_at).toISOString(),
        reward_points: parsed.data.reward_points,
        allow_anonymous: parsed.data.allow_anonymous,
        status: 'open',
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();
    if (error || !survey) return { error: error?.message ?? '저장 실패' };

    const { error: qErr } = await supabase.from('questions').insert(
      qs.map((q, i) => ({
        survey_id: survey.id,
        type: q.type,
        body: q.body,
        options: q.options ?? [],
        required: true,
        position: i,
      })),
    );
    if (qErr) return { error: qErr.message };

    revalidatePath('/admin/surveys');
    revalidatePath('/surveys');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
