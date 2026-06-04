-- =====================================================================
-- 위례 리빙랩 시드 설문 5건
--   - 다양한 문항 유형(single/multiple/scale/short_text/long_text/slider/ranking) 포함
--   - 상태: 'open' (진행중)
-- =====================================================================

do $$
declare
  v_admin uuid;
  v_now timestamptz := now();
  v_sid1 uuid;  -- 만족도
  v_sid2 uuid;  -- 교통
  v_sid3 uuid;  -- 환경
  v_sid4 uuid;  -- 안전
  v_sid5 uuid;  -- 디지털
begin
  select id into v_admin from public.profiles where role='admin' order by created_at limit 1;
  if v_admin is null then
    raise exception 'admin 계정이 필요합니다.';
  end if;

  -- 1) 정기 주민 만족도 설문
  insert into public.surveys (title, description, created_by, starts_at, ends_at, status, allow_anonymous, reward_points)
  values (
    '2026년 2분기 위례 거주 만족도 조사',
    '위례신도시 거주 만족도를 5분 이내로 응답해주세요. 결과는 정책 반영 추적 화면에서 공개됩니다.',
    v_admin, v_now, v_now + interval '21 days',
    'open', true, 100
  ) returning id into v_sid1;

  insert into public.questions (survey_id, type, body, options, required, position) values
    (v_sid1, 'single', '위례 거주 기간은 얼마나 되십니까?',
     jsonb_build_array(
       jsonb_build_object('id', 'q1a', 'label', '1년 미만'),
       jsonb_build_object('id', 'q1b', 'label', '1~3년'),
       jsonb_build_object('id', 'q1c', 'label', '3~5년'),
       jsonb_build_object('id', 'q1d', 'label', '5년 이상')
     ), true, 0),
    (v_sid1, 'scale', '현재 거주에 대한 종합 만족도 (1: 매우 불만 ~ 5: 매우 만족)', '[]'::jsonb, true, 1),
    (v_sid1, 'multiple', '특히 만족스러운 항목을 모두 선택해주세요',
     jsonb_build_array(
       jsonb_build_object('id', 'q3a', 'label', '교통 접근성'),
       jsonb_build_object('id', 'q3b', 'label', '공원·녹지'),
       jsonb_build_object('id', 'q3c', 'label', '학교·교육'),
       jsonb_build_object('id', 'q3d', 'label', '치안·안전'),
       jsonb_build_object('id', 'q3e', 'label', '편의시설'),
       jsonb_build_object('id', 'q3f', 'label', '이웃·커뮤니티')
     ), false, 2),
    (v_sid1, 'long_text', '위례 리빙랩이 가장 먼저 해결해야 할 한 가지는 무엇인가요?', '[]'::jsonb, true, 3);

  -- 2) 교통 이용 패턴 설문
  insert into public.surveys (title, description, created_by, starts_at, ends_at, status, allow_anonymous, reward_points)
  values (
    '위례 교통 이용 패턴 조사',
    '교통 정책 개선의 기초자료로 활용됩니다. 3분 이내 응답 가능.',
    v_admin, v_now, v_now + interval '14 days',
    'open', true, 50
  ) returning id into v_sid2;

  insert into public.questions (survey_id, type, body, options, required, position) values
    (v_sid2, 'single', '주된 출퇴근(통학) 수단은?',
     jsonb_build_array(
       jsonb_build_object('id', 't1', 'label', '버스'),
       jsonb_build_object('id', 't2', 'label', '지하철 (8호선·5호선 등)'),
       jsonb_build_object('id', 't3', 'label', '트램 위례선'),
       jsonb_build_object('id', 't4', 'label', '자가용'),
       jsonb_build_object('id', 't5', 'label', '도보·자전거')
     ), true, 0),
    (v_sid2, 'multiple', '대중교통 이용 시 가장 큰 불편은? (복수응답)',
     jsonb_build_array(
       jsonb_build_object('id', 'i1', 'label', '배차 간격이 길다'),
       jsonb_build_object('id', 'i2', 'label', '환승이 불편하다'),
       jsonb_build_object('id', 'i3', 'label', '운행 시간이 짧다'),
       jsonb_build_object('id', 'i4', 'label', '혼잡도가 높다'),
       jsonb_build_object('id', 'i5', 'label', '정류장 정보·환경 부족')
     ), true, 1),
    (v_sid2, 'scale', '위례신사선 개통 일정(2031~2032)에 대한 체감 답답함 (1:전혀 아님 ~ 5:매우 답답)', '[]'::jsonb, true, 2),
    (v_sid2, 'short_text', '신규 마을버스 노선이 생긴다면 추가되어야 할 구간을 한 줄로 적어주세요', '[]'::jsonb, false, 3);

  -- 3) 환경 인식 설문
  insert into public.surveys (title, description, created_by, starts_at, ends_at, status, allow_anonymous, reward_points)
  values (
    '위례 환경·생활폐기물 인식 조사',
    '미세먼지·쓰레기·소음 등 생활환경 인식을 묻는 설문입니다.',
    v_admin, v_now, v_now + interval '14 days',
    'open', true, 50
  ) returning id into v_sid3;

  insert into public.questions (survey_id, type, body, options, required, position) values
    (v_sid3, 'slider', '최근 1개월 체감 공기질을 0(매우 나쁨) ~ 100(매우 좋음) 으로 입력해주세요', '[]'::jsonb, true, 0),
    (v_sid3, 'single', '단지 내 음식물쓰레기 처리에 대한 만족도는?',
     jsonb_build_array(
       jsonb_build_object('id', 'w1', 'label', '매우 불만'),
       jsonb_build_object('id', 'w2', 'label', '불만'),
       jsonb_build_object('id', 'w3', 'label', '보통'),
       jsonb_build_object('id', 'w4', 'label', '만족'),
       jsonb_build_object('id', 'w5', 'label', '매우 만족')
     ), true, 1),
    (v_sid3, 'ranking', '환경 개선 우선순위 4가지를 순서대로 정렬해주세요',
     jsonb_build_array(
       jsonb_build_object('id', 'er1', 'label', '대기질 측정·공개 강화'),
       jsonb_build_object('id', 'er2', 'label', '재활용·자원순환 인프라'),
       jsonb_build_object('id', 'er3', 'label', '도시숲·공원 확충'),
       jsonb_build_object('id', 'er4', 'label', '소음·진동 관리')
     ), true, 2);

  -- 4) 안전 체감 설문
  insert into public.surveys (title, description, created_by, starts_at, ends_at, status, allow_anonymous, reward_points)
  values (
    '위례 안전 체감 조사 (야간 보행·어린이)',
    '어린이 등하굣길과 야간 보행 안전에 대한 체감도를 묻는 설문입니다.',
    v_admin, v_now, v_now + interval '14 days',
    'open', true, 50
  ) returning id into v_sid4;

  insert into public.questions (survey_id, type, body, options, required, position) values
    (v_sid4, 'scale', '야간(저녁 8시 이후) 동네 보행 안전 체감도 (1:매우 불안 ~ 5:매우 안전)', '[]'::jsonb, true, 0),
    (v_sid4, 'scale', '어린이 등하굣길 안전 체감도 (1:매우 불안 ~ 5:매우 안전)', '[]'::jsonb, true, 1),
    (v_sid4, 'multiple', '특별히 위험하다고 느끼는 장소·시간대를 모두 선택해주세요',
     jsonb_build_array(
       jsonb_build_object('id', 'd1', 'label', '학교 인근 도로'),
       jsonb_build_object('id', 'd2', 'label', '단지 간 보행로'),
       jsonb_build_object('id', 'd3', 'label', '창곡천·산책로'),
       jsonb_build_object('id', 'd4', 'label', '지하주차장'),
       jsonb_build_object('id', 'd5', 'label', '심야 정류장'),
       jsonb_build_object('id', 'd6', 'label', '공사 현장 인근')
     ), false, 2),
    (v_sid4, 'long_text', '특히 안전 강화가 필요한 구체적 장소·이유를 적어주세요 (선택)', '[]'::jsonb, false, 3);

  -- 5) 디지털 채널 선호도
  insert into public.surveys (title, description, created_by, starts_at, ends_at, status, allow_anonymous, reward_points)
  values (
    '위례 리빙랩 알림·소통 채널 선호도',
    '리빙랩 알림을 어떤 채널로 받고 싶은지 알려주세요. 결과는 알림 시스템 설계에 반영됩니다.',
    v_admin, v_now, v_now + interval '7 days',
    'open', true, 30
  ) returning id into v_sid5;

  insert into public.questions (survey_id, type, body, options, required, position) values
    (v_sid5, 'multiple', '받고 싶은 알림 채널을 모두 선택해주세요',
     jsonb_build_array(
       jsonb_build_object('id', 'c1', 'label', '카카오톡'),
       jsonb_build_object('id', 'c2', 'label', '문자(SMS)'),
       jsonb_build_object('id', 'c3', 'label', '이메일'),
       jsonb_build_object('id', 'c4', 'label', '앱 푸시'),
       jsonb_build_object('id', 'c5', 'label', '아파트 단지 게시판'),
       jsonb_build_object('id', 'c6', 'label', '키오스크')
     ), true, 0),
    (v_sid5, 'single', '알림 빈도 선호',
     jsonb_build_array(
       jsonb_build_object('id', 'f1', 'label', '중요한 것만 (월 1~2회)'),
       jsonb_build_object('id', 'f2', 'label', '주요 이슈 (주 1회)'),
       jsonb_build_object('id', 'f3', 'label', '실시간 (있을 때마다)')
     ), true, 1),
    (v_sid5, 'short_text', '리빙랩에 바라는 점을 한 줄로 적어주세요', '[]'::jsonb, false, 2);

  raise notice '설문 시드 5건 등록 완료 (총 문항 약 18개)';
end $$;

select s.title, s.status, s.starts_at::date, s.ends_at::date,
       (select count(*) from public.questions where survey_id=s.id) as questions
from public.surveys s
order by s.created_at desc
limit 5;
