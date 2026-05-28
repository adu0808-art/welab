import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CATEGORY_LABEL } from '@/lib/constants';
import type { ProposalCategory } from '@/lib/db/types';

type Props = {
  current?: ProposalCategory;
  sort?: 'recent' | 'popular';
};

const ALL_CATS: Array<{ key: ProposalCategory | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  ...(Object.keys(CATEGORY_LABEL) as ProposalCategory[]).map((k) => ({
    key: k,
    label: CATEGORY_LABEL[k],
  })),
];

function buildHref(cat: ProposalCategory | 'all', sort?: string) {
  const params = new URLSearchParams();
  if (cat !== 'all') params.set('category', cat);
  if (sort && sort !== 'recent') params.set('sort', sort);
  const qs = params.toString();
  return `/proposals${qs ? `?${qs}` : ''}`;
}

export function CategoryFilter({ current, sort }: Props) {
  return (
    <div className="-mx-1 flex overflow-x-auto px-1 pb-1">
      <div className="flex gap-2">
        {ALL_CATS.map(({ key, label }) => {
          const active = current ? key === current : key === 'all';
          return (
            <Link
              key={key}
              href={buildHref(key, sort)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-border bg-white text-brand-primary hover:bg-brand-light',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SortToggle({ current = 'recent', category }: { current?: 'recent' | 'popular'; category?: ProposalCategory }) {
  const opts: Array<{ key: 'recent' | 'popular'; label: string }> = [
    { key: 'recent', label: '최신순' },
    { key: 'popular', label: '추천순' },
  ];
  return (
    <div className="flex items-center gap-3 text-sm">
      {opts.map((o) => {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (o.key !== 'recent') params.set('sort', o.key);
        const qs = params.toString();
        const href = `/proposals${qs ? `?${qs}` : ''}`;
        const active = o.key === current;
        return (
          <Link
            key={o.key}
            href={href}
            className={cn(
              active ? 'font-semibold text-brand-primary' : 'text-muted-foreground hover:text-brand-primary',
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
