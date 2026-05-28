import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { DISTRICT_LABEL } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '홈' };

export default async function HomePage() {
  if (!supabaseConfigured) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/home');

  const profile = await getCurrentProfile();

  return (
    <div className="container py-6 sm:py-10">
      <section className="mb-6">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
          {profile?.nickname ?? '주민'} 님, 안녕하세요
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.district ? DISTRICT_LABEL[profile.district] : '거주확인 전'}
          {' · '}참여 마일리지 {formatNumber(profile?.mileage ?? 0)}P
        </p>
      </section>

      {/* 거주확인 안내 */}
      {!profile?.verified && (
        <Card className="mb-6 border-brand-accent/30 bg-brand-light/60">
          <CardHeader>
            <CardTitle>거주확인을 완료해주세요</CardTitle>
            <CardDescription>
              위례 거주확인이 완료되어야 설문 응답·투표 참여가 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/mypage/verify"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
            >
              거주확인 시작 <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand-primary">
          오늘의 활동
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>진행 중인 설문</CardTitle>
              <CardDescription>곧 출시됩니다.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>진행 중인 투표</CardTitle>
              <CardDescription>곧 출시됩니다.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>우리동네 이슈</CardTitle>
              <CardDescription>주변 의제·신고가 표시됩니다.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>실증과제</CardTitle>
              <CardDescription>현재 진행되는 과제 목록입니다.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
