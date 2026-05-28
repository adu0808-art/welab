import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, LogOut, Bell } from 'lucide-react';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { signOut } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { DISTRICT_LABEL } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '마이페이지' };

export default async function MyPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/mypage');

  const supabase = await createClient();
  const [{ data: badgeRows }, { count: unread }] = await Promise.all([
    supabase
      .from('user_badges')
      .select('badge_code, badges!badge_code(name,icon,description)')
      .eq('user_id', profile.id),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .is('read_at', null),
  ]);
  type B = { code: string; name: string; icon: string | null };
  const badges: B[] = (badgeRows ?? []).map((row) => {
    const r = row as { badge_code: string; badges: unknown };
    const b = Array.isArray(r.badges)
      ? ((r.badges[0] ?? null) as { name: string; icon: string | null } | null)
      : ((r.badges ?? null) as { name: string; icon: string | null } | null);
    return {
      code: r.badge_code,
      name: b?.name ?? r.badge_code,
      icon: b?.icon ?? null,
    };
  });

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
        내 활동
      </h1>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{profile.nickname}</CardTitle>
          <CardDescription>
            {profile.district
              ? `거주: ${DISTRICT_LABEL[profile.district]}`
              : '거주확인 미완료'}
            {' · '}
            {profile.verified ? '인증완료' : '미인증'}
            {' · '}등급 {profile.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">참여 마일리지</p>
          <p className="text-2xl font-bold text-brand-primary">
            {formatNumber(profile.mileage)} P
          </p>
        </CardContent>
      </Card>

      <Link href="/mypage/notifications" className="block">
        <Card className="mt-4 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="font-medium text-brand-primary">알림</p>
                <p className="text-sm text-muted-foreground">
                  {unread && unread > 0
                    ? `읽지 않은 알림 ${formatNumber(unread)}건`
                    : '새 알림이 없습니다'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-primary" />
          </CardContent>
        </Card>
      </Link>

      {badges.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>획득한 뱃지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <span
                  key={b.code}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand-primary"
                >
                  <span aria-hidden>{b.icon ?? '🏅'}</span>
                  {b.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!profile.verified && (
        <Link href="/mypage/verify" className="block">
          <Card className="mt-4 border-brand-accent/30 bg-brand-light/40 transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-brand-primary">거주확인 시작</p>
                <p className="text-sm text-muted-foreground">
                  설문·투표·의제 발의가 활성화됩니다 (+200P)
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            관심사·알림 설정은 곧 추가됩니다.
          </p>
        </CardContent>
      </Card>

      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white py-3 text-sm font-medium text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> 로그아웃
        </button>
      </form>
    </div>
  );
}
