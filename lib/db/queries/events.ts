import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';

export type EventStatus = 'draft' | 'open' | 'closed' | 'done';

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: EventStatus;
  cover_url: string | null;
};

export type EventListItem = EventRow & { registered: number };

export async function listEvents(status?: EventStatus): Promise<EventListItem[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase
    .from('events')
    .select('*')
    .neq('status', 'draft')
    .order('starts_at', { ascending: true });
  if (status) q = q.eq('status', status);
  const { data } = await q;
  const items = (data ?? []) as EventRow[];

  const ids = items.map((i) => i.id);
  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', ids);
    (regs ?? []).forEach((r) => {
      const id = r.event_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    });
  }
  return items.map((i) => ({ ...i, registered: counts[i.id] ?? 0 }));
}

export type EventDetail = EventRow & {
  registered: number;
  registered_by_me: boolean;
};

export async function getEvent(id: string): Promise<EventDetail | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;

  const { count } = await supabase
    .from('event_registrations')
    .select('event_id', { count: 'exact', head: true })
    .eq('event_id', id);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let registeredByMe = false;
  if (user) {
    const { data: reg } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    registeredByMe = !!reg;
  }

  return {
    ...(data as EventRow),
    registered: count ?? 0,
    registered_by_me: registeredByMe,
  };
}
