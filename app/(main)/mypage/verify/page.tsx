import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerifyForm } from './VerifyForm';

export const preferredRegion = 'hnd1';
export const metadata = { title: '거주확인' };

export default async function VerifyPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/mypage/verify');
  if (profile.verified) redirect('/mypage');

  return (
    <div className="container py-6 sm:py-10">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>거주확인 (개발용 Mock)</CardTitle>
          <CardDescription>
            거주확인을 완료하면 설문 응답·투표 참여·의제 발의가 가능합니다.
            완료 보상 200P 가 자동 지급됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyForm />
        </CardContent>
      </Card>
    </div>
  );
}
