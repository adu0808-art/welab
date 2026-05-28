import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DISTRICT_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { RoleSelector } from './_components/RoleSelector';
import type { Profile } from '@/lib/db/types';

export const metadata = { title: 'Admin · 사용자' };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const users = (data ?? []) as Profile[];

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">사용자</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        최근 가입 순 200명. 권한 변경 시 즉시 RLS 정책이 적용됩니다.
      </p>

      <Card className="mt-5">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">닉네임</th>
                <th className="px-4 py-3">거주</th>
                <th className="px-4 py-3">인증</th>
                <th className="px-4 py-3">마일리지</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">권한</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-brand-primary">
                    {u.nickname}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.district ? DISTRICT_LABEL[u.district] : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {u.verified ? (
                      <Badge variant="success">인증</Badge>
                    ) : (
                      <Badge variant="muted">미인증</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u.mileage}P</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <RoleSelector userId={u.id} role={u.role} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    아직 가입자가 없습니다.
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
