'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Question } from '@/lib/db/types';

export type SubmitResponseState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * 설문 응답 제출. answers 는 { [question_id]: value } 형태로 직렬화.
 */
export async function submitResponse(
  _prev: SubmitResponseState,
  formData: FormData,
): Promise<SubmitResponseState> {
  const surveyId = formData.get('survey_id') as string;
  const isAnonymous = formData.get('is_anonymous') === 'on';
  if (!surveyId) return { error: 'survey_id 누락' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  // 거주확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('verified')
    .eq('id', user.id)
    .single();
  if (!profile?.verified)
    return { error: '거주확인을 먼저 완료해주세요. (/mypage/verify)' };

  // 문항 로드 + 검증
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', surveyId);
  if (!questions) return { error: '설문 문항을 불러올 수 없습니다.' };

  const answers: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const q of questions as Question[]) {
    const key = `q_${q.id}`;
    if (q.type === 'single' || q.type === 'scale') {
      const v = formData.get(key);
      if (q.required && !v) {
        fieldErrors[q.id] = '필수 항목입니다.';
        continue;
      }
      answers[q.id] = v ?? null;
    } else if (q.type === 'multiple') {
      const vs = formData.getAll(key).map((v) => String(v));
      if (q.required && vs.length === 0) {
        fieldErrors[q.id] = '하나 이상 선택해주세요.';
        continue;
      }
      answers[q.id] = vs;
    } else if (q.type === 'short_text' || q.type === 'long_text') {
      const v = (formData.get(key) as string | null)?.trim() ?? '';
      if (q.required && !v) {
        fieldErrors[q.id] = '내용을 입력해주세요.';
        continue;
      }
      answers[q.id] = v;
    } else {
      // 기타 유형은 일단 string 그대로 저장
      const v = formData.get(key);
      if (q.required && !v) fieldErrors[q.id] = '필수 항목입니다.';
      answers[q.id] = v ?? null;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const { error } = await supabase.from('responses').insert({
    survey_id: surveyId,
    user_id: user.id,
    answers,
    is_anonymous: isAnonymous,
  });
  if (error) {
    if (error.code === '23505') return { error: '이미 응답하셨습니다.' };
    return { error: error.message };
  }

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath('/surveys');
  return { ok: true };
}
