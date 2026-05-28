import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Admin · 투표' };

export default async function AdminVotesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('votes')
    .select('id,title,type,status,starts_at,ends_at')
    .order('starts_at', { ascending: false })
    .limit(100);
  const items = data ?? [];

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">투표 발행</h1>
        <Link
          href="/admin/votes/new"
          className="rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-secondary"
        >
          + 새 투표
        </Link>
      </div>

      <Card className="mt-5">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">기간</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/votes/${v.id}`}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {v.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{v.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={v.status === 'open' ? 'success' : 'muted'}>
                      {v.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(v.starts_at)} ~ {formatDate(v.ends_at)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    발행된 투표가 없습니다.
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
