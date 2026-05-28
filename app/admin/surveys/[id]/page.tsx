import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Question, Response, Survey } from '@/lib/db/types';

export const metadata = { title: 'Admin · 설문 결과' };

type ChoiceOption = { id: string; label: string };

function parseOptions(raw: unknown): ChoiceOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o, i) => {
      if (typeof o === 'string') return { id: String(i), label: o };
      if (o && typeof o === 'object' && 'label' in o)
        return {
          id: String((o as { id?: string }).id ?? i),
          label: String((o as { label: unknown }).label),
        };
      return null;
    })
    .filter((o): o is ChoiceOption => o !== null);
}

export default async function AdminSurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: surveyRow } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single();
  if (!surveyRow) notFound();
  const survey = surveyRow as Survey;

  const { data: qs } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', id)
    .order('position');
  const questions = (qs ?? []) as Question[];

  const { data: rs, count } = await supabase
    .from('responses')
    .select('*', { count: 'exact' })
    .eq('survey_id', id);
  const responses = (rs ?? []) as Response[];

  return (
    <div className="container py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/surveys"
          className="text-sm text-muted-foreground hover:text-brand-primary"
        >
          ← 설문 목록
        </Link>
        <Link
          href={`/surveys/${id}`}
          className="rounded-md border border-brand-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-light"
        >
          응답 페이지 보기 →
        </Link>
      </div>

      <h1 className="mt-2 text-xl font-bold text-brand-primary sm:text-2xl">
        {survey.title}
      </h1>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant={survey.status === 'open' ? 'success' : 'muted'}>
          {survey.status}
        </Badge>
        <span>
          {formatDate(survey.starts_at)} ~ {formatDate(survey.ends_at)}
        </span>
        <span>· 응답 {formatNumber(count ?? 0)}건</span>
      </div>

      <div className="mt-6 space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {idx + 1}. {q.body}
              </CardTitle>
              <CardDescription>유형: {q.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionResults question={q} responses={responses} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuestionResults({
  question,
  responses,
}: {
  question: Question;
  responses: Response[];
}) {
  const opts = parseOptions(question.options);
  const total = responses.length || 1;

  if (
    question.type === 'single' ||
    question.type === 'scale' ||
    question.type === 'image'
  ) {
    const tally: Record<string, number> = {};
    responses.forEach((r) => {
      const v = (r.answers as Record<string, unknown>)[question.id];
      if (v && typeof v === 'string') tally[v] = (tally[v] ?? 0) + 1;
    });
    const rows =
      question.type === 'scale'
        ? ['1', '2', '3', '4', '5'].map((n) => ({ id: n, label: `${n}점` }))
        : opts;
    return <Bars tally={tally} rows={rows} total={total} />;
  }

  if (question.type === 'multiple') {
    const tally: Record<string, number> = {};
    responses.forEach((r) => {
      const v = (r.answers as Record<string, unknown>)[question.id];
      if (Array.isArray(v))
        (v as string[]).forEach((id) => (tally[id] = (tally[id] ?? 0) + 1));
    });
    return <Bars tally={tally} rows={opts} total={total} />;
  }

  if (question.type === 'ranking') {
    // borda count
    const tally: Record<string, number> = {};
    responses.forEach((r) => {
      const v = (r.answers as Record<string, unknown>)[question.id];
      const order = typeof v === 'string' ? v.split(',') : Array.isArray(v) ? (v as string[]) : [];
      const n = order.length;
      order.forEach((id, idx) => (tally[id] = (tally[id] ?? 0) + (n - idx)));
    });
    return <Bars tally={tally} rows={opts} total={Math.max(1, Object.values(tally).reduce((a, b) => a + b, 0))} />;
  }

  if (question.type === 'slider') {
    const nums = responses
      .map((r) => Number((r.answers as Record<string, unknown>)[question.id]))
      .filter((n) => !Number.isNaN(n));
    if (nums.length === 0)
      return <p className="text-sm text-muted-foreground">응답이 없습니다.</p>;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return (
      <div className="text-sm">
        <p>
          평균:{' '}
          <span className="font-semibold text-brand-primary">{avg.toFixed(1)}</span> · 최소{' '}
          {min} · 최대 {max}
        </p>
      </div>
    );
  }

  // short_text / long_text / location → 최근 응답 10건 미리보기
  const samples = responses
    .map((r) => (r.answers as Record<string, unknown>)[question.id])
    .filter((v) => typeof v === 'string' && v)
    .slice(0, 10);
  if (samples.length === 0)
    return <p className="text-sm text-muted-foreground">응답이 없습니다.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {samples.map((s, i) => (
        <li
          key={i}
          className="rounded-md border border-border bg-white px-3 py-2 text-foreground"
        >
          {String(s)}
        </li>
      ))}
    </ul>
  );
}

function Bars({
  tally,
  rows,
  total,
}: {
  tally: Record<string, number>;
  rows: ChoiceOption[];
  total: number;
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const cnt = tally[r.id] ?? 0;
        const pct = Math.round((cnt / total) * 100);
        return (
          <li key={r.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-brand-primary">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {cnt} · {pct}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
