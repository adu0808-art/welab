'use client';

import { useActionState, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { submitResponse, type SubmitResponseState } from '@/lib/actions/surveys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Question } from '@/lib/db/types';

const initial: SubmitResponseState = {};

type Props = {
  surveyId: string;
  questions: Question[];
  allowAnonymous: boolean;
};

type ChoiceOption = { id: string; label: string };

function SliderInput({ name, required }: { name: string; required?: boolean }) {
  const [v, setV] = useState(50);
  return (
    <div className="space-y-2">
      <input
        type="range"
        name={name}
        min={0}
        max={100}
        value={v}
        required={required}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-brand-primary"
      />
      <p className="text-right text-sm tabular-nums text-muted-foreground">{v}</p>
    </div>
  );
}

function RankingInput({
  name,
  options,
}: {
  name: string;
  options: { id: string; label: string }[];
}) {
  const [order, setOrder] = useState(options.map((o) => o.id));
  function move(idx: number, delta: number) {
    setOrder((prev) => {
      const next = [...prev];
      const j = idx + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={order.join(',')} />
      {order.map((id, idx) => {
        const o = options.find((x) => x.id === id);
        if (!o) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-3 rounded-md border border-border bg-white p-3"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm">{o.label}</span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1 hover:bg-brand-light disabled:opacity-30"
                aria-label="위로"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === order.length - 1}
                className="rounded p-1 hover:bg-brand-light disabled:opacity-30"
                aria-label="아래로"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parseOptions(raw: unknown): ChoiceOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o, idx) => {
      if (typeof o === 'string') return { id: String(idx), label: o };
      if (o && typeof o === 'object' && 'label' in o)
        return {
          id: ((o as { id?: string }).id ?? String(idx)),
          label: String((o as { label: unknown }).label),
        };
      return null;
    })
    .filter((o): o is ChoiceOption => o !== null);
}

export function SurveyForm({ surveyId, questions, allowAnonymous }: Props) {
  const [state, formAction, pending] = useActionState(submitResponse, initial);

  if (state.ok) {
    return (
      <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
        응답이 제출되었습니다. 참여 마일리지가 적립됩니다.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="survey_id" value={surveyId} />

      {questions.map((q, idx) => {
        const key = `q_${q.id}`;
        const err = state.fieldErrors?.[q.id];
        const opts = parseOptions(q.options);
        return (
          <fieldset
            key={q.id}
            className="space-y-3 rounded-md border border-border bg-white p-4"
          >
            <legend className="text-sm font-semibold text-brand-primary">
              {idx + 1}. {q.body}
              {q.required && <span className="ml-1 text-destructive">*</span>}
            </legend>

            {q.type === 'single' && (
              <div className="space-y-2">
                {opts.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={key}
                      value={o.id}
                      required={q.required}
                      className="h-4 w-4 accent-brand-primary"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div className="space-y-2">
                {opts.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={key}
                      value={o.id}
                      className="h-4 w-4 accent-brand-primary"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'scale' && (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-white peer-checked:border-brand-primary"
                  >
                    <input
                      type="radio"
                      name={key}
                      value={String(n)}
                      required={q.required}
                      className="peer sr-only"
                    />
                    <span className="text-sm peer-checked:font-semibold">{n}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'short_text' && (
              <div className="space-y-1.5">
                <Label htmlFor={key} className="sr-only">
                  답변
                </Label>
                <Input
                  id={key}
                  name={key}
                  required={q.required}
                  maxLength={200}
                />
              </div>
            )}

            {q.type === 'long_text' && (
              <Textarea name={key} rows={4} required={q.required} maxLength={2000} />
            )}

            {q.type === 'slider' && <SliderInput name={key} required={q.required} />}

            {q.type === 'ranking' && <RankingInput name={key} options={opts} />}

            {q.type === 'image' && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {opts.map((o) => (
                  <label
                    key={o.id}
                    className="relative flex cursor-pointer flex-col items-center gap-2 rounded-md border border-border bg-white p-3 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-light"
                  >
                    <input
                      type="radio"
                      name={key}
                      value={o.id}
                      required={q.required}
                      className="sr-only"
                    />
                    <div className="aspect-square w-full rounded-md bg-brand-bg" />
                    <span className="text-xs text-foreground">{o.label}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'location' && (
              <div className="space-y-2">
                <Input
                  name={key}
                  required={q.required}
                  placeholder="예: 위례동 사거리 보행 신호 부근"
                />
                <p className="text-xs text-muted-foreground">
                  Naver Maps 기반 지점 선택은 다음 단계에서 추가됩니다.
                </p>
              </div>
            )}

            {err && <p className="text-sm text-destructive">{err}</p>}
          </fieldset>
        );
      })}

      {allowAnonymous && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            name="is_anonymous"
            className="h-4 w-4 accent-brand-primary"
          />
          익명으로 응답 (응답자와의 연결이 제거됩니다)
        </label>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? '제출 중…' : '제출하기'}
      </Button>
    </form>
  );
}
