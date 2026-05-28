import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '공지 · FAQ' };

const KIND_LABEL = { notice: '공지', news: '뉴스', faq: 'FAQ' } as const;

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: 'notice' | 'news' | 'faq' }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const sp = await searchParams;
  const kind = (['notice', 'news', 'faq'] as const).includes(
    sp.kind as 'notice' | 'news' | 'faq',
  )
    ? sp.kind
    : undefined;

  const supabase = await createClient();
  let q = supabase
    .from('notices')
    .select('*')
    .eq('published', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data } = await q;
  const items = data ?? [];
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">소식 · FAQ</h1>
        {isAdmin && (
          <Link
            href="/admin/notices"
            className={buttonVariants({ variant: 'default' })}
          >
            <Plus className="h-4 w-4" />
            새 글 작성
          </Link>
        )}
      </div>

      <nav className="mt-4 flex gap-2 text-sm">
        {[undefined, 'notice', 'news', 'faq'].map((k) => (
          <Link
            key={k ?? 'all'}
            href={k ? `/notices?kind=${k}` : '/notices'}
            className={
              (kind ?? undefined) === k
                ? 'rounded-full bg-brand-primary px-3 py-1 text-white'
                : 'rounded-full border border-border bg-white px-3 py-1 text-brand-primary'
            }
          >
            {k ? KIND_LABEL[k as 'notice' | 'news' | 'faq'] : '전체'}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            게시된 글이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2">
                    <Badge>{KIND_LABEL[n.kind as 'notice' | 'news' | 'faq']}</Badge>
                    {n.pinned && <Badge variant="warning">고정</Badge>}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-brand-primary">
                    {n.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                    {n.body}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
