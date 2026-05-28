import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getSurvey } from '@/lib/db/queries/surveys';
import { getCurrentProfile } from '@/lib/db/queries/profiles';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SurveyForm } from '../_components/SurveyForm';
import { formatDate } from '@/lib/utils';

export const preferredRegion = 'hnd1';

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();

  const profile = await getCurrentProfile();
  const alreadyResponded = !!survey.my_response;

  return (
    <div className="container max-w-2xl py-6 sm:py-10">
      <Link
        href="/surveys"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" /> 목록으로
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <Badge variant={survey.status === 'open' ? 'success' : 'muted'}>
          {survey.status === 'open' ? '진행중' : '종료'}
        </Badge>
        <Badge variant="outline">완료 시 +{survey.reward_points}P</Badge>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-brand-primary sm:text-3xl">
        {survey.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(survey.starts_at)} ~ {formatDate(survey.ends_at)} · 문항{' '}
        {survey.questions.length}개
      </p>
      {survey.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
          {survey.description}
        </p>
      )}

      <div className="mt-6">
        {!profile ? (
          <Card>
            <CardHeader>
              <CardTitle>로그인 필요</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/login?next=/surveys/${survey.id}`}
                className="font-medium text-brand-primary underline"
              >
                로그인 →
              </Link>
            </CardContent>
          </Card>
        ) : !profile.verified ? (
          <Card>
            <CardHeader>
              <CardTitle>거주확인 필요</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/mypage/verify"
                className="font-medium text-brand-primary underline"
              >
                거주확인 시작 →
              </Link>
            </CardContent>
          </Card>
        ) : alreadyResponded ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-base font-medium text-brand-primary">
                이미 응답하셨습니다. 감사합니다!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                결과는 종료 후 30일 이내 공개됩니다.
              </p>
            </CardContent>
          </Card>
        ) : survey.status !== 'open' ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              현재 응답 기간이 아닙니다.
            </CardContent>
          </Card>
        ) : (
          <SurveyForm
            surveyId={survey.id}
            questions={survey.questions}
            allowAnonymous={survey.allow_anonymous}
          />
        )}
      </div>
    </div>
  );
}
