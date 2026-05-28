import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Admin · 설문' };

export default async function AdminSurveysPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('surveys')
    .select('id,title,status,starts_at,ends_at,reward_points')
    .order('starts_at', { ascending: false })
    .limit(100);
  const items = data ?? [];

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">설문 발행</h1>
        <Link
          href="/admin/surveys/new"
          className="rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-secondary"
        >
          + 새 설문
        </Link>
      </div>

      <Card className="mt-5">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">보상</th>
                <th className="px-4 py-3">기간</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === 'open' ? 'success' : 'muted'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">+{s.reward_points}P</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(s.starts_at)} ~ {formatDate(s.ends_at)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    발행된 설문이 없습니다.
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
