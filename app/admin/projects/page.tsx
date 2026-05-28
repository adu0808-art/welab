import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber } from '@/lib/utils';
import { StageSelector } from './_components/StageSelector';
import type { Project } from '@/lib/db/types';

export const metadata = { title: 'Admin · 실증과제' };

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const items = (data ?? []) as Project[];

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">
          실증과제 관리
        </h1>
        <Link
          href="/admin/projects/new"
          className="rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-secondary"
        >
          + 새 과제
        </Link>
      </div>

      <Card className="mt-5">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">예산</th>
                <th className="px-4 py-3">기간</th>
                <th className="px-4 py-3">단계</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatNumber(p.budget)}원
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.starts_on ? formatDate(p.starts_on) : '-'} ~{' '}
                    {p.ends_on ? formatDate(p.ends_on) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StageSelector projectId={p.id} stage={p.stage} />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    등록된 과제가 없습니다.
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
