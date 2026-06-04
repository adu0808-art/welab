-- =====================================================================
-- 위례신도시 주민 실제 이슈 기반 시드 의제 12건
--   - 사용 환경: prod (또는 dev) Supabase SQL Editor 에 통째로 붙여넣고 Run
--   - 전제 조건: profiles 테이블에 role='admin' 사용자 최소 1명 존재
--   - 출처 요약: 위례신사선/위례선/광역교통/환경/안전/육아/커뮤니티 관련
--     2026 시점 공개 보도·블로그·지자체 게시판 검색 결과 종합
-- =====================================================================

do $$
declare
  v_admin_id uuid;
  v_inserted int := 0;
begin
  -- 첫 번째 admin 의 id 가져오기
  select id into v_admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if v_admin_id is null then
    raise exception '먼저 admin 계정을 만들고 role 을 admin 으로 승격해주세요. (update public.profiles set role=''admin'' where nickname=''...'')';
  end if;

  raise notice 'admin user_id: %', v_admin_id;

  -- 의제 12건 삽입
  with rows as (
    insert into public.proposals (author_id, category, title, body, status, district, is_anonymous) values
    -- 교통
    (v_admin_id, 'traffic', '위례신사선 조기 착공 촉구',
     '위례신사선이 18년 만에 재정사업으로 전환된 것은 환영하지만, 개통 시기가 2031~2032년으로 3~4년 더 지연되었습니다. 위례 주민은 이미 2013년 광역교통개선대책 분담금을 납부했으므로, 기본계획·설계 단계의 일정을 단축할 수 있는 특별대책 마련을 요청합니다.',
     'submitted', 'songpa', false),

    (v_admin_id, 'traffic', '위례선 트램 정류장 야간 안전 강화 요청',
     '2026년 개통한 위례선 트램의 일부 정류장이 야간에 조명·CCTV가 부족하여 귀가가 늦은 주민·여성·청소년의 안전 우려가 큽니다. 정류장별 LED 조명 추가 및 안전벨 설치, 운영시간대 보안인력 순찰을 제안합니다.',
     'submitted', 'songpa', false),

    (v_admin_id, 'traffic', '위례~성남·하남 간선버스 노선 통합 개편',
     '3개 지자체에 걸쳐 있다 보니 같은 정류장에 비슷한 노선이 중복되고, 정작 동선이 안 닿는 경로는 우회가 큽니다. 3개 지자체와 버스조합 합동 협의회를 만들어 위례 권역 노선 전체를 재설계하길 제안합니다.',
     'submitted', 'seongnam', false),

    (v_admin_id, 'traffic', '거여·마천 방향 출퇴근 시간 BRT 시범 운영',
     '8호선 환승·송파 도심 출퇴근 수요가 집중되는 거여·마천 방향에 출퇴근 시간(7~9시, 18~20시) 한정 BRT(중앙버스전용차로)를 시범 운영해 정시성 확보를 요청드립니다.',
     'submitted', 'songpa', false),

    -- 환경
    (v_admin_id, 'environment', '위례중앙공원·창곡천 권역 미세먼지 측정소 추가',
     '현재 위례 권역에는 공식 미세먼지 측정소가 부족해 환경부 일반대기 데이터를 그대로 인용하고 있습니다. 위례중앙공원·창곡천 산책로·중·고교 인근 등 생활밀착형 측정 지점 3곳에 PM2.5/PM10 측정기를 추가 설치해주세요.',
     'submitted', 'songpa', false),

    (v_admin_id, 'environment', '단지별 음식물쓰레기 처리 자동화 시스템',
     '아파트 단지 내 RFID 종량기가 노후화되어 악취·고장 민원이 누적되고 있습니다. 단지별 음식물쓰레기 자동 처리(분쇄·건조) 시스템 시범 도입과 인근 단지 공동 활용 모델을 제안합니다.',
     'submitted', 'hanam', false),

    (v_admin_id, 'environment', '위례 비즈밸리 공사 소음·분진 관리 강화',
     '위례 비즈밸리(바이오·ICT·제조업) 공사 구간에서 발생하는 야간·새벽 시간 소음과 분진이 인근 단지의 수면권을 침해하고 있습니다. 시공사별 소음 모니터링 데이터 실시간 공개와 위반 시 즉시 작업 중지 절차 마련을 요청합니다.',
     'submitted', 'seongnam', false),

    -- 안전
    (v_admin_id, 'safety', '어린이 보호구역 단속 카메라 추가 및 야간 단속',
     '위례초·위례별초·위례한빛초 인근 어린이 보호구역의 단속 카메라가 일부 구간에만 설치되어 있고, 야간·휴일 단속이 부재합니다. 미설치 구간 카메라 추가 + 24시간 무인 단속을 요청합니다.',
     'submitted', 'songpa', false),

    (v_admin_id, 'safety', '위례 산책로·자전거도로 야간 가로등 음영지대 해소',
     '창곡천·장지천 산책로 일부 구간이 가로등 사이 간격이 넓어 야간 음영지대가 발생합니다. 음영지대에 솔라 LED 가로등을 추가하고, 안전귀가 비콘(긴급호출 버튼)을 50m 간격으로 설치해주세요.',
     'submitted', 'hanam', false),

    -- 커뮤니티
    (v_admin_id, 'community', '3개 지자체 공동 위례 통합 민원 분소 설치',
     '위례 주민이 송파·성남·하남으로 행정구역이 갈리면서 같은 민원도 어느 지자체 소관인지 헷갈리고, 중복 신청하는 불편이 큽니다. 위례 중심부에 3개 지자체 공동 분소를 두고 원스톱 처리 창구를 만들어주세요.',
     'submitted', 'songpa', false),

    (v_admin_id, 'community', '단지별 커뮤니티 시설 공유 예약 시스템',
     '단지마다 헬스장·도서관·세미나실의 가동률이 천차만별이고, 비어 있는 시설이 많습니다. 위례 권역 단지 간 시설 공유 예약 시스템을 만들어 거주자라면 인근 단지 시설도 시간당 결제로 사용할 수 있게 해주세요.',
     'submitted', 'seongnam', false),

    -- 육아
    (v_admin_id, 'parenting', '위례 권역 국공립 어린이집 정원 확대 + 대기 통합',
     '국공립 어린이집 대기열이 지자체별로 분리되어 있어, 같은 단지여도 행정구역에 따라 대기 순번이 크게 달라집니다. 위례 권역 통합 대기열을 만들고 신규 국공립 어린이집 3개소 신설을 제안합니다.',
     'submitted', 'hanam', false)
    returning 1
  )
  select count(*) into v_inserted from rows;

  raise notice '의제 % 건 등록 완료 (작성자: %)', v_inserted, v_admin_id;
end $$;

-- 등록 결과 확인용
select id, category, title, district, created_at
from public.proposals
where author_id in (select id from public.profiles where role = 'admin')
order by created_at desc
limit 12;
