import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalForm } from '../_components/ProposalForm';

export const preferredRegion = 'hnd1';
export const metadata = { title: '의제 발의' };

export default async function NewProposalPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/proposals/new');

  if (!profile.verified) {
    return (
      <div className="container py-6 sm:py-10">
        <Card className="mx-auto max-w-md border-brand-accent/30 bg-brand-light/40">
          <CardHeader>
            <CardTitle>거주확인이 필요합니다</CardTitle>
            <CardDescription>
              의제 발의는 거주확인을 마친 주민만 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/mypage/verify"
              className="text-sm font-medium text-brand-primary underline"
            >
              거주확인 시작하기 →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>의제 발의</CardTitle>
          <CardDescription>
            도시문제·아이디어를 자유롭게 제안하세요. 발의 시 30P 가 적립됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalForm />
        </CardContent>
      </Card>
    </div>
  );
}
