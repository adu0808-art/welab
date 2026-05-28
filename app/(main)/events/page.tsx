import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listEvents } from '@/lib/db/queries/events';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '오프라인 행사' };

export default async function EventsPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const [items, profile] = await Promise.all([listEvents(), getCurrentProfile()]);
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
            오프라인 행사
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            워크숍 · 해커톤 · 타운홀. 거주확인 후 신청 가능합니다.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/events/new"
            className={buttonVariants({ variant: 'default' })}
          >
            <Plus className="h-4 w-4" />
            행사 등록
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            예정된 행사가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((e) => {
            const full = e.registered >= e.capacity;
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2">
                      <Badge variant={e.status === 'open' ? 'success' : 'muted'}>
                        {e.status}
                      </Badge>
                      {full && <Badge variant="warning">마감</Badge>}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-brand-primary">
                      {e.title}
                    </h3>
                    {e.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(e.starts_at)} · {e.location ?? '장소 미정'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      참여 {formatNumber(e.registered)} / {formatNumber(e.capacity)}명
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
