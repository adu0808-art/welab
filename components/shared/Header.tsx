import Link from 'next/link';
import { Bell, User, Settings } from 'lucide-react';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { buttonVariants } from '@/components/ui/button';

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary text-sm font-bold text-white">
            W
          </span>
          <span className="text-base font-semibold text-brand-primary">
            WeLAB
          </span>
        </Link>

        <nav className="hidden gap-5 text-sm font-medium text-brand-primary md:flex">
          <Link href="/proposals" className="hover:opacity-70">
            의제
          </Link>
          <Link href="/surveys" className="hover:opacity-70">
            설문
          </Link>
          <Link href="/votes" className="hover:opacity-70">
            투표
          </Link>
          <Link href="/projects" className="hover:opacity-70">
            실증과제
          </Link>
          <Link href="/events" className="hover:opacity-70">
            행사
          </Link>
          <Link href="/dashboard" className="hover:opacity-70">
            도시현황
          </Link>
          <Link href="/notices" className="hover:opacity-70">
            소식
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 rounded-md border border-brand-primary/30 px-2.5 py-1 text-xs font-medium text-brand-primary hover:bg-brand-light"
                  title="관리자 콘솔"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link
                href="/mypage/notifications"
                aria-label="알림"
                className="rounded-full p-2 text-brand-primary hover:bg-brand-light"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5 text-sm text-brand-primary"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{profile.nickname}</span>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ size: 'sm', variant: 'default' })}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
