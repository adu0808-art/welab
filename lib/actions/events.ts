'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleEventRegistration(
  eventId: string,
): Promise<{ registered: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { registered: false, error: '로그인이 필요합니다.' };

  const { data: existing } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    if (error) return { registered: true, error: error.message };
    revalidatePath(`/events/${eventId}`);
    return { registered: false };
  }

  // capacity 체크
  const { data: ev } = await supabase
    .from('events')
    .select('capacity,status')
    .eq('id', eventId)
    .single();
  if (!ev) return { registered: false, error: '행사를 찾을 수 없습니다.' };
  if (ev.status !== 'open') return { registered: false, error: '신청 가능한 행사가 아닙니다.' };
  const { count } = await supabase
    .from('event_registrations')
    .select('event_id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if ((count ?? 0) >= (ev.capacity as number))
    return { registered: false, error: '정원이 마감되었습니다.' };

  const { error } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, user_id: user.id });
  if (error) return { registered: false, error: error.message };
  revalidatePath(`/events/${eventId}`);
  return { registered: true };
}

// 관리자
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

const EventSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().min(10),
  ends_at: z.string().min(10),
  capacity: z.coerce.number().int().min(1).max(10000).default(30),
});

export async function createEvent(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin();
    const parsed = EventSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') ?? undefined,
      location: formData.get('location') ?? undefined,
      starts_at: formData.get('starts_at'),
      ends_at: formData.get('ends_at'),
      capacity: formData.get('capacity') ?? 30,
    });
    if (!parsed.success) return { error: '입력값을 확인해주세요.' };
    const { error } = await supabase.from('events').insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      capacity: parsed.data.capacity,
      status: 'open',
    });
    if (error) return { error: error.message };
    revalidatePath('/admin/events');
    revalidatePath('/events');
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
