'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

const NoticeSchema = z.object({
  kind: z.enum(['notice', 'news', 'faq']).default('notice'),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2),
  pinned: z.any().transform((v) => v === 'on' || v === true),
  published: z.any().transform((v) => v === 'on' || v === true),
});

export async function createNotice(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const parsed = NoticeSchema.safeParse({
      kind: formData.get('kind') ?? 'notice',
      title: formData.get('title'),
      body: formData.get('body'),
      pinned: formData.get('pinned'),
      published: formData.get('published') ?? 'on',
    });
    if (!parsed.success) return { error: '입력값을 확인해주세요.' };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('notices').insert({
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
      published: parsed.data.published,
      created_by: user?.id ?? null,
    });
    if (error) return { error: error.message };
    revalidatePath('/admin/notices');
    revalidatePath('/notices');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteNotice(id: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/notices');
    revalidatePath('/notices');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
