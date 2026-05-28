import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';

export const preferredRegion = 'hnd1';

const NAV = [
  { href: '/admin', label: '개요' },
  { href: '/admin/users', label: '사용자' },
  { href: '/admin/proposals', label: '의제' },
  { href: '/admin/surveys', label: '설문' },
  { href: '/admin/votes', label: '투표' },
  { href: '/admin/projects', label: '과제' },
  { href: '/admin/events', label: '행사' },
  { href: '/admin/notices', label: '공지' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login?next=/admin');
  if (profile.role !== 'admin') {
    return (
      <div className="container py-10">
        <h1 className="text-xl font-bold text-brand-primary">접근 권한이 없습니다</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          관리자만 사용할 수 있는 페이지입니다.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-brand-primary underline"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-border bg-white">
        <div className="container flex h-14 items-center gap-6">
          <Link
            href="/admin"
            className="text-base font-semibold text-brand-primary"
          >
            WeLAB Admin
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-brand-primary hover:opacity-70"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-sm text-muted-foreground">
            {profile.nickname}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
