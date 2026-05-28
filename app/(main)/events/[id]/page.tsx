import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Calendar, Users } from 'lucide-react';
import { getEvent } from '@/lib/db/queries/events';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterButton } from '../_components/RegisterButton';
import { formatDate, formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { id } = await params;
  const ev = await getEvent(id);
  if (!ev) notFound();

  const profile = await getCurrentProfile();
  const canRegister = !!profile?.verified;
  const isFull = ev.registered >= ev.capacity;

  return (
    <div className="container max-w-2xl py-6 sm:py-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <Badge variant={ev.status === 'open' ? 'success' : 'muted'}>{ev.status}</Badge>
        {isFull && <Badge variant="warning">마감</Badge>}
      </div>

      <h1 className="mt-3 text-2xl font-bold text-brand-primary sm:text-3xl">
        {ev.title}
      </h1>

      <Card className="mt-5">
        <CardContent className="space-y-3 pt-5 text-sm text-foreground/80">
          <p className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-primary" />
            {formatDate(ev.starts_at)} ~ {formatDate(ev.ends_at)}
          </p>
          {ev.location && (
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-primary" />
              {ev.location}
            </p>
          )}
          <p className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-primary" />
            참여 {formatNumber(ev.registered)} / {formatNumber(ev.capacity)}명
          </p>
        </CardContent>
      </Card>

      {ev.description && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>안내</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground/80">
              {ev.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        {!profile ? (
          <Link
            href={`/login?next=/events/${ev.id}`}
            className="text-sm font-medium text-brand-primary underline"
          >
            로그인 후 신청 →
          </Link>
        ) : (
          <RegisterButton
            eventId={ev.id}
            initialRegistered={ev.registered_by_me}
            canRegister={canRegister}
            isFull={isFull}
          />
        )}
      </div>
    </div>
  );
}
