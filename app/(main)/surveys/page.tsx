import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listSurveys } from '@/lib/db/queries/surveys';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { SurveyStatus } from '@/lib/db/types';

export const preferredRegion = 'hnd1';
export const metadata = { title: '설문' };

const LABEL: Record<SurveyStatus, string> = {
  draft: '초안',
  open: '진행중',
  closed: '종료',
};

export default async function SurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const sp = await searchParams;
  const status = (['open', 'closed'] as SurveyStatus[]).includes(
    sp.status as SurveyStatus,
  )
    ? (sp.status as SurveyStatus)
    : undefined;

  const [items, profile] = await Promise.all([
    listSurveys(status),
    getCurrentProfile(),
  ]);
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">설문</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            주민 의견을 데이터로 모읍니다. 평균 5분 이내로 응답할 수 있도록 설계됩니다.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/surveys/new"
            className={buttonVariants({ variant: 'default' })}
          >
            <Plus className="h-4 w-4" />
            설문 발행
          </Link>
        )}
      </div>

      <nav className="mt-5 flex gap-2 text-sm">
        {[undefined, 'open', 'closed'].map((s) => {
          const active = (status ?? undefined) === s;
          const href = s ? `/surveys?status=${s}` : '/surveys';
          return (
            <Link
              key={s ?? 'all'}
              href={href}
              className={
                active
                  ? 'rounded-full bg-brand-primary px-3 py-1 text-white'
                  : 'rounded-full border border-border bg-white px-3 py-1 text-brand-primary hover:bg-brand-light'
              }
            >
              {s ? LABEL[s as SurveyStatus] : '전체'}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            진행중인 설문이 없습니다. 관리자가 발행 후 표시됩니다.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <Link key={s.id} href={`/surveys/${s.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === 'open' ? 'success' : 'muted'}>
                      {LABEL[s.status]}
                    </Badge>
                    <Badge variant="outline">+{s.reward_points}P</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-brand-primary">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDate(s.starts_at)} ~ {formatDate(s.ends_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
