import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import type { Survey, Question, Response, SurveyStatus } from '@/lib/db/types';

export type SurveyListItem = Pick<
  Survey,
  'id' | 'title' | 'description' | 'starts_at' | 'ends_at' | 'status' | 'reward_points'
>;

export async function listSurveys(status?: SurveyStatus): Promise<SurveyListItem[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  let q = supabase
    .from('surveys')
    .select('id,title,description,starts_at,ends_at,status,reward_points')
    .neq('status', 'draft')
    .order('starts_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as SurveyListItem[];
}

export type SurveyDetail = Survey & {
  questions: Question[];
  my_response: Response | null;
};

export async function getSurvey(id: string): Promise<SurveyDetail | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();

  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !survey) return null;

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', id)
    .order('position', { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myResponse: Response | null = null;
  if (user) {
    const { data: res } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    myResponse = (res as Response | null) ?? null;
  }

  return {
    ...(survey as Survey),
    questions: (questions ?? []) as Question[],
    my_response: myResponse,
  };
}
