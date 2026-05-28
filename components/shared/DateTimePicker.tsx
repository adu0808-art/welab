'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  required?: boolean;
  /** 첫 진입 시 현재 시각 + offsetHours 의 정시를 기본값으로 */
  initialOffsetHours?: number;
  /** "YYYY-MM-DDTHH:mm" 형태의 기존 값 (편집용) */
  initialValue?: string;
  /** 종일 모드: 시/분 강제 설정 + 입력 비활성화 */
  allDay?: boolean;
  /** allDay 가 true 일 때 강제될 시/분 (기본 "00", "00") */
  allDayHour?: string;
  allDayMinute?: string;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function roundDownTo10(m: number): string {
  return pad(Math.floor(m / 10) * 10);
}

/**
 * 날짜 + 시 + 10분 단위 분 입력.
 * - 분 픽커가 진짜 10분 단위로 강제됨
 * - hidden input[name=...] 에 "YYYY-MM-DDTHH:mm" 으로 합쳐서 제출
 * - allDay 모드 지원 (시/분 자동 + 비활성화)
 */
export function DateTimePicker({
  name,
  required,
  initialOffsetHours = 1,
  initialValue,
  allDay,
  allDayHour = '00',
  allDayMinute = '00',
  className,
}: Props) {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');

  useEffect(() => {
    if (initialValue) {
      const [d, t] = initialValue.split('T');
      if (d) setDate(d);
      if (t) {
        const [h, m] = t.split(':');
        if (h) setHour(pad(Number(h)));
        if (m) setMinute(roundDownTo10(Number(m)));
      }
      return;
    }
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + initialOffsetHours);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setHour(pad(d.getHours()));
    setMinute('00');
  }, [initialOffsetHours, initialValue]);

  const effectiveHour = allDay ? allDayHour : hour;
  const effectiveMinute = allDay ? allDayMinute : minute;
  const combined =
    date && effectiveHour && effectiveMinute
      ? `${date}T${effectiveHour}:${effectiveMinute}`
      : '';

  const inputCls =
    'flex h-11 appearance-none rounded-md border border-border bg-white px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required={required}
        className={cn(inputCls, 'min-w-[150px] flex-1')}
      />
      <select
        value={effectiveHour}
        onChange={(e) => setHour(e.target.value)}
        required={required && !allDay}
        disabled={allDay}
        className={cn(inputCls, 'w-20')}
        aria-label="시"
      >
        <option value="" disabled>
          시
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">시</span>
      <select
        value={effectiveMinute}
        onChange={(e) => setMinute(e.target.value)}
        required={required && !allDay}
        disabled={allDay}
        className={cn(inputCls, 'w-20')}
        aria-label="분"
      >
        <option value="" disabled>
          분
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="text-sm text-muted-foreground">분</span>
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
