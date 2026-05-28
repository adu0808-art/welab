import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Project, ProjectStage } from '@/lib/db/types';

export type ProjectListItem = Pick<
  Project,
  'id' | 'title' | 'summary' | 'stage' | 'budget' | 'starts_on' | 'ends_on'
> & { member_count: number };

export async function listProjects(stage?: ProjectStage): Promise<ProjectListItem[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();

  let q = supabase
    .from('projects')
    .select('id,title,summary,stage,budget,starts_on,ends_on')
    .order('created_at', { ascending: false });
  if (stage) q = q.eq('stage', stage);
  const { data } = await q;
  const items = (data ?? []) as Omit<ProjectListItem, 'member_count'>[];

  // 멤버 카운트 (간단히 별도 쿼리)
  const ids = items.map((i) => i.id);
  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: mems } = await supabase
      .from('project_members')
      .select('project_id')
      .in('project_id', ids);
    (mems ?? []).forEach((m) => {
      const id = m.project_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    });
  }
  return items.map((i) => ({ ...i, member_count: counts[i.id] ?? 0 }));
}

export type ProjectDetail = Project & {
  members: { user_id: string; nickname: string; role: string; joined_at: string }[];
  joined_by_me: boolean;
};

export async function getProject(id: string): Promise<ProjectDetail | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;

  const { data: mems } = await supabase
    .from('project_members')
    .select('user_id, role, joined_at, profiles!user_id(nickname)')
    .eq('project_id', id);
  const members = (mems ?? []).map((m) => {
    const p = Array.isArray((m as { profiles: unknown }).profiles)
      ? ((m as { profiles: { nickname: string }[] }).profiles[0] ?? { nickname: '주민' })
      : ((m as { profiles: { nickname: string } | null }).profiles ?? { nickname: '주민' });
    return {
      user_id: m.user_id as string,
      role: (m.role as string) ?? 'member',
      joined_at: m.joined_at as string,
      nickname: p.nickname,
    };
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const joinedByMe = !!user && members.some((m) => m.user_id === user.id);

  return {
    ...(data as Project),
    members,
    joined_by_me: joinedByMe,
  };
}
