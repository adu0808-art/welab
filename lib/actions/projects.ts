'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStage } from '@/lib/db/types';

export async function toggleProjectMembership(
  projectId: string,
): Promise<{ joined: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { joined: false, error: '로그인이 필요합니다.' };

  const { data: existing } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);
    if (error) return { joined: true, error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return { joined: false };
  }

  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: user.id, role: 'member' });
  if (error) return { joined: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { joined: true };
}

// ─────────────────────────────────────────────────────────────
// 관리자 발행/단계 변경
// ─────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (data?.role !== 'admin') throw new Error('FORBIDDEN');
  return supabase;
}

const CreateProjectSchema = z.object({
  title: z.string().trim().min(2).max(100),
  summary: z.string().optional(),
  budget: z.coerce.number().int().nonnegative().default(0),
  stage: z.enum(['discover', 'define', 'develop', 'deploy', 'diffuse']).default('discover'),
  starts_on: z.string().optional(),
  ends_on: z.string().optional(),
});

export async function createProject(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const parsed = CreateProjectSchema.safeParse({
      title: formData.get('title'),
      summary: formData.get('summary') ?? undefined,
      budget: formData.get('budget') ?? 0,
      stage: formData.get('stage') ?? 'discover',
      starts_on: formData.get('starts_on') || undefined,
      ends_on: formData.get('ends_on') || undefined,
    });
    if (!parsed.success) return { error: '입력값을 확인해주세요.' };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('projects').insert({
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      budget: parsed.data.budget,
      stage: parsed.data.stage as ProjectStage,
      starts_on: parsed.data.starts_on ?? null,
      ends_on: parsed.data.ends_on ?? null,
      owner_id: user?.id ?? null,
    });
    if (error) return { error: error.message };

    revalidatePath('/admin/projects');
    revalidatePath('/projects');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function changeProjectStage(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const id = formData.get('project_id') as string;
    const stage = formData.get('stage') as ProjectStage;
    if (
      !id ||
      !['discover', 'define', 'develop', 'deploy', 'diffuse'].includes(stage)
    )
      return { error: '입력값이 잘못되었습니다.' };
    const { error } = await supabase
      .from('projects')
      .update({ stage })
      .eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
