import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { markAllRead } from '@/lib/actions/notifications';
import { formatDate } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '알림' };

export default async function NotificationsPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/mypage/notifications');

  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">알림</h1>
        {unread > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              모두 읽음 처리
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            받은 알림이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((n) => {
            const isUnread = !n.read_at;
            const body = (
              <Card className={isUnread ? 'border-brand-accent/30 bg-brand-light/40' : ''}>
                <CardContent className="pt-5">
                  <p className="text-sm font-medium text-brand-primary">
                    {isUnread && (
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-primary align-middle" />
                    )}
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-sm text-foreground/80">{n.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(n.created_at)}
                  </p>
                </CardContent>
              </Card>
            );
            return (
              <li key={n.id}>
                {n.href ? <Link href={n.href}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
