'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquareText, Vote, FolderKanban, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/proposals', label: '의제', icon: MessageSquareText },
  { href: '/votes', label: '투표', icon: Vote },
  { href: '/projects', label: '과제', icon: FolderKanban },
  { href: '/mypage', label: '마이', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="하단 메인 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-xs',
                  active
                    ? 'text-brand-primary'
                    : 'text-muted-foreground hover:text-brand-primary',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
