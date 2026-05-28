'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSurvey } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import type { QuestionType } from '@/lib/db/types';

const TYPES: { value: QuestionType; label: string; hasOptions: boolean }[] = [
  { value: 'single', label: '단일 선택', hasOptions: true },
  { value: 'multiple', label: '다중 선택', hasOptions: true },
  { value: 'scale', label: '척도(1~5)', hasOptions: false },
  { value: 'ranking', label: '순위 매기기', hasOptions: true },
  { value: 'short_text', label: '단답', hasOptions: false },
  { value: 'long_text', label: '서술', hasOptions: false },
  { value: 'image', label: '이미지 선택', hasOptions: true },
  { value: 'location', label: '위치 선택', hasOptions: false },
  { value: 'slider', label: '슬라이더(0~100)', hasOptions: false },
];

type QRow = { id: number; type: QuestionType };

export function SurveyCreateForm() {
  const router = useRouter();
  const [rows, setRows] = useState<QRow[]>([{ id: 0, type: 'single' }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addRow() {
    if (rows.length >= 20) return;
    setRows((rs) => [...rs, { id: rs.length, type: 'single' }]);
  }
  function removeRow(idx: number) {
    setRows((rs) => rs.filter((r) => r.id !== idx).map((r, i) => ({ ...r, id: i })));
  }
  function setType(idx: number, type: QuestionType) {
    setRows((rs) => rs.map((r) => (r.id === idx ? { ...r, type } : r)));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const res = await createSurvey({}, fd);
        // eslint-disable-next-line no-console
        console.log('[SurveyCreateForm] result:', res);
        if (res.ok) {
          router.push('/admin/surveys');
          router.refresh();
          return;
        }
        setError(res.error ?? '알 수 없는 오류');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SurveyCreateForm] caught:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <div className="space-y-2">
        <Label>시작</Label>
        <DateTimePicker name="starts_at" required initialOffsetHours={1} />
      </div>
      <div className="space-y-2">
        <Label>종료</Label>
        <DateTimePicker name="ends_at" required initialOffsetHours={24 * 7} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reward_points">완료 보상 (P)</Label>
          <Input
            id="reward_points"
            name="reward_points"
            type="number"
            min={0}
            max={1000}
            defaultValue={50}
          />
        </div>
        <label className="mt-7 flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            name="allow_anonymous"
            defaultChecked
            className="h-4 w-4 accent-brand-primary"
          />
          익명 응답 허용
        </label>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-brand-bg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-primary">문항</h3>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md bg-white px-2 py-1 text-xs text-brand-primary"
          >
            + 문항 추가
          </button>
        </div>

        {rows.map((row) => {
          const def = TYPES.find((t) => t.value === row.type)!;
          return (
            <div key={row.id} className="space-y-2 rounded-md border border-border bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{row.id + 1}</span>
                <Select
                  name={`question_type_${row.id}`}
                  value={row.type}
                  onChange={(e) => setType(row.id, e.target.value as QuestionType)}
                  className="h-9 w-36 text-sm"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    삭제
                  </button>
                )}
              </div>
              <Input
                name={`question_body_${row.id}`}
                required
                maxLength={200}
                placeholder="문항 내용"
              />
              {def.hasOptions && (
                <Textarea
                  name={`question_options_${row.id}`}
                  rows={4}
                  required
                  placeholder={'선택지 (한 줄에 하나)\n예시 1\n예시 2'}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? '발행 중…' : '설문 발행'}
      </Button>
    </form>
  );
}
