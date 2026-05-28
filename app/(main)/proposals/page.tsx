import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listProposals } from '@/lib/db/queries/proposals';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProposalCard } from './_components/ProposalCard';
import { CategoryFilter, SortToggle } from './_components/CategoryFilter';
import type { ProposalCategory } from '@/lib/db/types';

export const preferredRegion = 'hnd1';
export const metadata = { title: '의제' };

type SearchParams = Promise<{
  category?: string;
  sort?: string;
  page?: string;
}>;

const CATEGORIES = new Set([
  'traffic',
  'environment',
  'safety',
  'community',
  'parenting',
  'etc',
]);

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!supabaseConfigured) return <SetupNotice />;

  const sp = await searchParams;
  const category =
    sp.category && CATEGORIES.has(sp.category)
      ? (sp.category as ProposalCategory)
      : undefined;
  const sort = sp.sort === 'popular' ? 'popular' : 'recent';
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const { items, total, pageSize } = await listProposals({
    category,
    sort,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
            의제 게시판
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            위례의 도시문제·아이디어를 발의하고 함께 우선순위를 정합니다.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className={buttonVariants({ variant: 'default' })}
        >
          <Plus className="h-4 w-4" />
          의제 발의
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        <CategoryFilter current={category} sort={sort} />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {total}개의 의제
          </p>
          <SortToggle current={sort} category={category} />
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 발의된 의제가 없습니다. 첫 의제를 등록해주세요.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ProposalCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          current={page}
          total={totalPages}
          category={category}
          sort={sort}
        />
      )}
    </div>
  );
}

function Pagination({
  current,
  total,
  category,
  sort,
}: {
  current: number;
  total: number;
  category?: ProposalCategory;
  sort?: 'recent' | 'popular';
}) {
  function href(page: number) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (sort && sort !== 'recent') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `/proposals${qs ? `?${qs}` : ''}`;
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1 text-sm">
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={
            p === current
              ? 'rounded bg-brand-primary px-3 py-1 text-white'
              : 'rounded px-3 py-1 text-brand-primary hover:bg-brand-light'
          }
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
