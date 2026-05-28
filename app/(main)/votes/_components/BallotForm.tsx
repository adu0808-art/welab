'use client';

import { useActionState, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { castBallot, type CastBallotState } from '@/lib/actions/votes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/utils';
import type { VoteType } from '@/lib/db/types';
import type { VoteOption } from '@/lib/db/queries/votes';

const initial: CastBallotState = {};

type Props = {
  voteId: string;
  type: VoteType;
  options: VoteOption[];
  config?: Record<string, unknown>;
  hasVoted: boolean;
};

export function BallotForm({ voteId, type, options, config, hasVoted }: Props) {
  const [state, formAction, pending] = useActionState(castBallot, initial);

  if (hasVoted) {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        이미 참여하셨습니다. 결과는 종료 후 공개됩니다.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="vote_id" value={voteId} />
      <input type="hidden" name="vote_type" value={type} />

      {type === 'single' && <SinglePicker options={options} />}
      {type === 'multiple' && <MultiplePicker options={options} />}
      {type === 'approval' && <ApprovalPicker />}
      {type === 'budget' && (
        <BudgetPicker options={options} total={Number(config?.total ?? 1000000)} />
      )}
      {type === 'ranking' && <RankingPicker options={options} />}
      {type === 'weighted' && <WeightedPicker options={options} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? '제출 중…' : '투표하기'}
      </Button>
    </form>
  );
}

function SinglePicker({ options }: { options: VoteOption[] }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-white p-3 hover:bg-brand-light/40"
        >
          <input
            type="radio"
            name="option"
            value={o.id}
            required
            className="h-4 w-4 accent-brand-primary"
          />
          <span className="text-sm">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function MultiplePicker({ options }: { options: VoteOption[] }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-white p-3 hover:bg-brand-light/40"
        >
          <input
            type="checkbox"
            name="options"
            value={o.id}
            className="h-4 w-4 accent-brand-primary"
          />
          <span className="text-sm">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function ApprovalPicker() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['yes', 'no', 'abstain'] as const).map((v) => (
        <label
          key={v}
          className="relative flex cursor-pointer flex-col items-center gap-1 rounded-md border border-border bg-white p-3 hover:bg-brand-light/40 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-light"
        >
          <input
            type="radio"
            name="vote"
            value={v}
            required
            className="sr-only"
          />
          <span className="text-sm font-medium">
            {v === 'yes' ? '찬성' : v === 'no' ? '반대' : '기권'}
          </span>
        </label>
      ))}
    </div>
  );
}

function BudgetPicker({
  options,
  total,
}: {
  options: VoteOption[];
  total: number;
}) {
  const [allocs, setAllocs] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.id, 0])),
  );
  const sum = Object.values(allocs).reduce((a, b) => a + b, 0);
  const remain = total - sum;

  function setVal(id: string, raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setAllocs((a) => ({ ...a, [id]: n }));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md bg-brand-light/60 p-3 text-sm">
        총 예산:{' '}
        <span className="font-semibold text-brand-primary">
          {formatNumber(total)}원
        </span>{' '}
        · 남은 금액:{' '}
        <span
          className={
            remain < 0 ? 'font-semibold text-destructive' : 'font-semibold text-brand-primary'
          }
        >
          {formatNumber(remain)}원
        </span>
      </div>
      <div className="space-y-2">
        {options.map((o) => (
          <div
            key={o.id}
            className="flex items-center gap-3 rounded-md border border-border bg-white p-3"
          >
            <span className="flex-1 text-sm">{o.label}</span>
            <Input
              type="number"
              min={0}
              step={10000}
              name={`alloc_${o.id}`}
              value={allocs[o.id] ?? 0}
              onChange={(e) => setVal(o.id, e.target.value)}
              className="h-9 w-32 text-right tabular-nums"
            />
            <span className="text-xs text-muted-foreground">원</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPicker({ options }: { options: VoteOption[] }) {
  const [order, setOrder] = useState<string[]>(options.map((o) => o.id));

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
      <p className="text-xs text-muted-foreground">
        ↑↓ 버튼으로 순서를 정해주세요. 위가 1순위입니다.
      </p>
      <input type="hidden" name="order" value={order.join(',')} />
      {order.map((id, idx) => {
        const o = options.find((x) => x.id === id);
        if (!o) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-3 rounded-md border border-border bg-white p-3"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm">{o.label}</span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                className="rounded p-1 hover:bg-brand-light disabled:opacity-30"
                disabled={idx === 0}
                aria-label="위로"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                className="rounded p-1 hover:bg-brand-light disabled:opacity-30"
                disabled={idx === order.length - 1}
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

function WeightedPicker({ options }: { options: VoteOption[] }) {
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.id, 0.5])),
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        각 항목에 대해 0~1 사이의 가중치를 입력하세요. 제출 시 합이 1이 되도록 정규화됩니다.
      </p>
      {options.map((o) => (
        <div key={o.id} className="rounded-md border border-border bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span>{o.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round((weights[o.id] ?? 0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            name={`weight_${o.id}`}
            min={0}
            max={1}
            step={0.01}
            value={weights[o.id] ?? 0}
            onChange={(e) =>
              setWeights((w) => ({ ...w, [o.id]: Number(e.target.value) }))
            }
            className="mt-2 w-full accent-brand-primary"
          />
        </div>
      ))}
    </div>
  );
}
