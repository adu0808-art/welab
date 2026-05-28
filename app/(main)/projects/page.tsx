import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listProjects } from '@/lib/db/queries/projects';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/utils';
import type { ProjectStage } from '@/lib/db/types';

export const preferredRegion = 'hnd1';
export const metadata = { title: '실증과제' };

const STAGE: Record<ProjectStage, string> = {
  discover: '발굴',
  define: '정의',
  develop: '실험',
  deploy: '실증',
  diffuse: '확산',
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const sp = await searchParams;
  const stage = (Object.keys(STAGE) as ProjectStage[]).includes(
    sp.stage as ProjectStage,
  )
    ? (sp.stage as ProjectStage)
    : undefined;
  const [items, profile] = await Promise.all([listProjects(stage), getCurrentProfile()]);
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">실증과제</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            주민 발굴 의제 → 실증과제 → 확산. 5단계로 운영됩니다.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/projects/new"
            className={buttonVariants({ variant: 'default' })}
          >
            <Plus className="h-4 w-4" />
            과제 등록
          </Link>
        )}
      </div>

      <nav className="mt-5 flex flex-wrap gap-2 text-sm">
        <Link
          href="/projects"
          className={
            !stage
              ? 'rounded-full bg-brand-primary px-3 py-1 text-white'
              : 'rounded-full border border-border bg-white px-3 py-1 text-brand-primary'
          }
        >
          전체
        </Link>
        {(Object.keys(STAGE) as ProjectStage[]).map((s) => (
          <Link
            key={s}
            href={`/projects?stage=${s}`}
            className={
              stage === s
                ? 'rounded-full bg-brand-primary px-3 py-1 text-white'
                : 'rounded-full border border-border bg-white px-3 py-1 text-brand-primary'
            }
          >
            {STAGE[s]}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            진행 중인 과제가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-5">
                  <Badge>{STAGE[p.stage]}</Badge>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold text-brand-primary">
                    {p.title}
                  </h3>
                  {p.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.summary}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>참여 {formatNumber(p.member_count)}명</span>
                    <span>예산 {formatNumber(p.budget)}원</span>
                  </div>
                  {(p.starts_on || p.ends_on) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.starts_on ? formatDate(p.starts_on) : '미정'} ~{' '}
                      {p.ends_on ? formatDate(p.ends_on) : '미정'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
