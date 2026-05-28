import Link from 'next/link';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_LABEL, DISTRICT_LABEL } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/utils';
import type { ProposalListItem } from '@/lib/db/queries/proposals';

export function ProposalCard({ item }: { item: ProposalListItem }) {
  const displayName = item.is_anonymous
    ? '익명'
    : (item.author?.nickname ?? '주민');

  return (
    <Link href={`/proposals/${item.id}`} className="group block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{CATEGORY_LABEL[item.category]}</Badge>
            {item.district && (
              <Badge variant="outline">{DISTRICT_LABEL[item.district]}</Badge>
            )}
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-brand-primary group-hover:underline">
            {item.title}
          </h3>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {displayName} · {formatDate(item.created_at)}
            </span>
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" /> {formatNumber(item.upvotes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />{' '}
                {formatNumber(item.comments_count)}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
