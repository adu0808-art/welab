import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { NoticeCreateForm } from './_components/NoticeCreateForm';

export const metadata = { title: 'Admin · 공지' };

export default async function AdminNoticesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const items = data ?? [];

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
        공지 · 뉴스 · FAQ
      </h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>새 글 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <NoticeCreateForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 게시</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id} className="flex items-center gap-2 px-4 py-3 text-sm">
                  <Badge>{n.kind}</Badge>
                  {n.pinned && <Badge variant="warning">고정</Badge>}
                  <span className="flex-1 truncate font-medium text-brand-primary">
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(n.created_at)}
                  </span>
                </li>
              ))}
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  게시된 글이 없습니다.
                </li>
              )}
            </ul>
          </CardContent>
          <CardContent>
            <Link
              href="/notices"
              className="text-xs text-brand-primary hover:underline"
            >
              공개 페이지 →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
