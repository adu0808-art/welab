import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Profile } from '@/lib/db/types';

/**
 * 현재 로그인된 사용자와 profiles row 를 함께 조회.
 * 비로그인/env 미설정 시 null 반환.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // 트리거가 미동작한 경우 등 → null 로 처리
    return null;
  }
  return data;
}
