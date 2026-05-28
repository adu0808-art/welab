'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const Schema = z.object({
  district: z.enum(['songpa', 'seongnam', 'hanam'], {
    errorMap: () => ({ message: '거주 지자체를 선택해주세요' }),
  }),
  agree: z.any().transform((v) => v === 'on' || v === true),
});

export type VerifyState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * 개발용 거주확인 mock.
 * 실제 운영에서는 DID 인증 또는 OCR 결과를 검증해야 함.
 */
export async function mockVerify(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const parsed = Schema.safeParse({
    district: formData.get('district'),
    agree: formData.get('agree'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!parsed.data.agree) {
    return { error: '위례 거주민임을 확인해야 합니다.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  // 트리거(on_profile_verified) 가 마일리지·rewards 자동 처리
  const { error } = await supabase
    .from('profiles')
    .update({ verified: true, district: parsed.data.district })
    .eq('id', user.id);

  if (error) {
    console.error('[mockVerify] update error:', error);
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
