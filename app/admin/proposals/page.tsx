import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { StatusSelector } from './_components/StatusSelector';
import type { Proposal } from '@/lib/db/types';

export const metadata = { title: 'Admin · 의제' };

export default async function AdminProposalsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('proposals')
    .select('id,title,category,status,upvotes,comments_count,created_at,is_anonymous,district,author_id')
    .order('created_at', { ascending: false })
    .limit(200);
  const items = (data ?? []) as Proposal[];

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">의제 모더레이션</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        상태 변경 시 사용자에게 즉시 반영됩니다.
      </p>

      <Card className="mt-5">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">추천</th>
                <th className="px-4 py-3">댓글</th>
                <th className="px-4 py-3">발의일</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/proposals/${p.id}`}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{CATEGORY_LABEL[p.category]}</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.upvotes}</td>
                  <td className="px-4 py-3 tabular-nums">{p.comments_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelector proposalId={p.id} status={p.status} />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    발의된 의제가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
