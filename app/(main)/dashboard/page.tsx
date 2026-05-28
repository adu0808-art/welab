import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';
import { SetupNotice } from '@/components/shared/SetupNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NaverMapStub } from '@/components/shared/NaverMapStub';
import { formatNumber } from '@/lib/utils';

export const preferredRegion = 'hnd1';
export const metadata = { title: '도시 현황' };

/**
 * 도시현황 대시보드 (MVP).
 *  - 참여 통계: DB 카운트
 *  - 환경 지표: sensor_data 가 비어있을 때 mock 사용
 *  - Naver Maps 연동·시계열 차트는 다음 단계
 */

type SensorCard = {
  key: string;
  label: string;
  value: number;
  unit: string;
  status: '좋음' | '보통' | '나쁨';
};

const MOCK_SENSORS: SensorCard[] = [
  { key: 'pm25', label: '미세먼지 PM2.5', value: 18, unit: '㎍/㎥', status: '좋음' },
  { key: 'temp', label: '기온', value: 22, unit: '℃', status: '보통' },
  { key: 'noise', label: '소음', value: 54, unit: 'dB', status: '보통' },
  { key: 'ped', label: '시간당 보행자', value: 1240, unit: '명/h', status: '좋음' },
  { key: 'park', label: '공영주차장 가용률', value: 38, unit: '%', status: '나쁨' },
  { key: 'aq', label: '대기질 지수', value: 62, unit: 'AQI', status: '보통' },
];

export default async function DashboardPage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const supabase = await createClient();

  const [users, proposals, votes, surveys] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('proposals').select('id', { count: 'exact', head: true }),
    supabase.from('votes').select('id', { count: 'exact', head: true }),
    supabase.from('surveys').select('id', { count: 'exact', head: true }),
  ]);

  const participation = [
    { label: '누적 가입자', value: users.count ?? 0, kpi: 30_000 },
    { label: '발의된 의제', value: proposals.count ?? 0, kpi: 100 },
    { label: '진행 투표', value: votes.count ?? 0 },
    { label: '진행 설문', value: surveys.count ?? 0 },
  ];

  // sensor_data 가 있으면 사용, 없으면 mock
  const { data: sensorRows } = await supabase
    .from('sensor_data')
    .select('sensor_id,measure,ts')
    .order('ts', { ascending: false })
    .limit(10);
  const useReal = !!sensorRows && sensorRows.length > 0;

  return (
    <div className="container py-6 sm:py-10">
      <h1 className="text-xl font-bold text-brand-primary sm:text-2xl">도시 현황</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        위례 환경·교통·참여 지표를 한눈에 확인하세요. (Naver Maps 연동·시계열 차트는 다음 단계에서 추가됩니다)
      </p>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-brand-primary">참여 지표</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {participation.map((p) => {
            const pct = p.kpi ? Math.min(100, Math.round((p.value / p.kpi) * 100)) : null;
            return (
              <Card key={p.label}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    {p.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-brand-primary">
                    {formatNumber(p.value)}
                  </p>
                  {pct !== null && (
                    <>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-brand-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        KPI {formatNumber(p.kpi!)} · 달성률 {pct}%
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-semibold text-brand-primary">
            환경·교통 지표
          </h2>
          <span className="text-xs text-muted-foreground">
            {useReal ? '실시간 센서 데이터' : '* mock 데이터'}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SENSORS.map((s) => (
            <Card key={s.key}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {s.label}
                </CardTitle>
                <CardDescription
                  className={
                    s.status === '좋음'
                      ? 'text-emerald-700'
                      : s.status === '나쁨'
                        ? 'text-destructive'
                        : 'text-amber-700'
                  }
                >
                  상태: {s.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-brand-primary">
                  {formatNumber(s.value)}
                  <span className="ml-1 text-base text-muted-foreground">
                    {s.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>지도 기반 도시 데이터</CardTitle>
            <CardDescription>
              Naver Maps SDK 연동 + GeoJSON 레이어가 다음 단계에서 추가됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NaverMapStub height={320} caption="환경·교통 지표 레이어가 표시됩니다" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
