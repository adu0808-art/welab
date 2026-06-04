-- =====================================================================
-- 위례 리빙랩 시드 투표 6건 — 6종 유형 전부 데모
--   - 사용: prod/dev Supabase SQL Editor 에 통째로 붙여넣고 Run
--   - 시작일: 오늘(now()), 종료일: 7~21일 후
--   - 상태: 'open' (즉시 참여 가능)
--   - admin 의제 시드(01) 가 먼저 적용되어 있다는 가정
-- =====================================================================

do $$
declare
  v_now timestamptz := now();
  v_pid_traffic uuid;  -- 위례신사선 의제 연계
  v_pid_env    uuid;   -- 환경 의제 연계
  v_pid_safety uuid;   -- 안전 의제 연계
begin
  -- 의제 시드의 일부 항목 연결 (있으면)
  select id into v_pid_traffic from public.proposals where title like '위례신사선%' limit 1;
  select id into v_pid_env    from public.proposals where title like '위례중앙공원%측정소%' limit 1;
  select id into v_pid_safety from public.proposals where title like '어린이 보호구역%' limit 1;

  -- 1) 단일 투표
  insert into public.votes (title, description, type, proposal_id, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례신사선 조기 추진을 위한 우선 방안은?',
    '지연된 위례신사선 사업의 추진 속도를 높이기 위해 위례 리빙랩이 우선 추진해야 할 방안을 한 가지 선택해주세요.',
    'single',
    v_pid_traffic,
    jsonb_build_array(
      jsonb_build_object('id', 'o1', 'label', '국토부·서울시 직접 협상 요청'),
      jsonb_build_object('id', 'o2', 'label', '국회 청원·입법 발의'),
      jsonb_build_object('id', 'o3', 'label', '주민 1만명 서명운동'),
      jsonb_build_object('id', 'o4', 'label', '광역교통 분담금 환수 청구')
    ),
    '{}'::jsonb,
    v_now, v_now + interval '7 days',
    'open', true, 'advisory'
  );

  -- 2) 다중 투표 (N표제, 3개까지)
  insert into public.votes (title, description, type, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례 환경 우선 과제 3가지를 골라주세요',
    '리빙랩이 환경 분야에서 먼저 추진할 과제 3가지를 선택해주세요. (1인 3표)',
    'multiple',
    jsonb_build_array(
      jsonb_build_object('id', 'e1', 'label', '미세먼지 측정소 추가'),
      jsonb_build_object('id', 'e2', 'label', '음식물쓰레기 자동화'),
      jsonb_build_object('id', 'e3', 'label', '공사 소음·분진 관리'),
      jsonb_build_object('id', 'e4', 'label', '재활용품 회수 인프라'),
      jsonb_build_object('id', 'e5', 'label', '도시숲·공원 확충'),
      jsonb_build_object('id', 'e6', 'label', '광역 환경 데이터 공개')
    ),
    jsonb_build_object('max_choices', 3),
    v_now, v_now + interval '10 days',
    'open', true, 'advisory'
  );

  -- 3) 찬반 투표
  insert into public.votes (title, description, type, proposal_id, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례중앙공원 내 소규모 매점·카페 허용 찬반',
    '위례중앙공원 일부 구역에 50㎡ 이하의 매점·카페 운영을 허용하는 방안에 대한 주민 의견을 묻습니다.',
    'approval',
    v_pid_env,
    '[]'::jsonb,
    '{}'::jsonb,
    v_now, v_now + interval '14 days',
    'open', true, 'advisory'
  );

  -- 4) 예산 참여 투표 (총 5억원)
  insert into public.votes (title, description, type, proposal_id, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례 안전예산 5억원, 어디에 쓸까요?',
    '2026년 위례 권역 주민안전 예산 5억원의 항목별 배분을 직접 결정해주세요. 항목별 금액의 합이 5억원을 넘으면 제출되지 않습니다.',
    'budget',
    v_pid_safety,
    jsonb_build_array(
      jsonb_build_object('id', 'b1', 'label', '어린이보호구역 단속카메라 확충'),
      jsonb_build_object('id', 'b2', 'label', '산책로·자전거도로 가로등'),
      jsonb_build_object('id', 'b3', 'label', '단지간 보행로 CCTV'),
      jsonb_build_object('id', 'b4', 'label', '안전귀가 비콘·앱 운영'),
      jsonb_build_object('id', 'b5', 'label', '야간 순찰 인력 증원')
    ),
    jsonb_build_object('total', 500000000),
    v_now, v_now + interval '14 days',
    'open', false, 'binding'
  );

  -- 5) 순위 투표 (Borda count)
  insert into public.votes (title, description, type, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례 교통개선 우선순위를 정해주세요',
    '↑↓ 버튼으로 4개 항목의 우선순위를 정렬해주세요. 1위 4점, 2위 3점, 3위 2점, 4위 1점 (Borda count)으로 집계됩니다.',
    'ranking',
    jsonb_build_array(
      jsonb_build_object('id', 'r1', 'label', '위례신사선 조기 착공'),
      jsonb_build_object('id', 'r2', 'label', '위례선 트램 정류장 추가'),
      jsonb_build_object('id', 'r3', 'label', '간선버스 노선 통합'),
      jsonb_build_object('id', 'r4', 'label', '거여·마천 BRT 시범')
    ),
    '{}'::jsonb,
    v_now, v_now + interval '14 days',
    'open', false, 'advisory'
  );

  -- 6) 가중치 투표
  insert into public.votes (title, description, type, options, config, starts_at, ends_at, status, show_realtime, binding_level)
  values (
    '위례 신규 커뮤니티 시설 중요도 가중치',
    '신규 도입을 검토 중인 5개 시설의 중요도를 슬라이더(0~1)로 입력해주세요. 제출 시 합이 1이 되도록 정규화됩니다.',
    'weighted',
    jsonb_build_array(
      jsonb_build_object('id', 'w1', 'label', '구립 디지털도서관'),
      jsonb_build_object('id', 'w2', 'label', '주민복합 체육관'),
      jsonb_build_object('id', 'w3', 'label', '청년 코워킹 스페이스'),
      jsonb_build_object('id', 'w4', 'label', '시니어 헬스케어 센터'),
      jsonb_build_object('id', 'w5', 'label', '어린이·청소년 메이커랩')
    ),
    '{}'::jsonb,
    v_now, v_now + interval '21 days',
    'open', true, 'reference'
  );

  raise notice '투표 시드 6건 등록 완료';
end $$;

-- 결과 확인
select title, type, status, starts_at::date, ends_at::date
from public.votes
order by created_at desc
limit 6;
