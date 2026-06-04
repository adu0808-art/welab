-- =====================================================================
-- 위례 리빙랩 시드 행사 5건
--   - 모두 'open' 상태, 신청 가능
--   - 시작일은 14~60일 후로 분산
-- =====================================================================

insert into public.events (title, description, location, starts_at, ends_at, capacity, status)
values
  ('위례 리빙랩 오픈 워크숍',
   '리빙랩 첫 공식 워크숍. 운영 방향과 1년차 우선 과제를 함께 정합니다. 다과·간단한 다과 제공.',
   '위례동 주민센터 대강당',
   now() + interval '14 days 17 hours',
   now() + interval '14 days 20 hours',
   80, 'open'),

  ('주민 도시문제 발굴 타운홀 미팅',
   '위례에서 가장 빨리 풀어야 할 도시문제를 토론으로 발굴합니다. 단지별 대표·관심 주민 누구나 참여 가능.',
   '성남 위례커뮤니티센터 다목적실',
   now() + interval '21 days 19 hours',
   now() + interval '21 days 21 hours 30 minutes',
   60, 'open'),

  ('위례 환경·교통 데이터 해커톤',
   '공공·센서 데이터를 활용한 24시간 아이디어 해커톤. 4인 팀 단위 신청, 상위 3팀 운영위 검토 후 실증과제 후보.',
   '하남 위례비즈밸리 메이커스페이스',
   now() + interval '35 days 10 hours',
   now() + interval '36 days 10 hours',
   40, 'open'),

  ('어린이 보호구역 안전 캠페인 워크숍',
   '학교·학부모·자치회가 함께 보호구역 위험요소를 점검하고 단속 카메라 위치·가로등 음영지대를 매핑합니다.',
   '서울 송파 위례초등학교 시청각실',
   now() + interval '28 days 14 hours',
   now() + interval '28 days 16 hours 30 minutes',
   50, 'open'),

  ('청년·MZ 스마트시티 아이디어톤',
   '20~35세 청년 대상 스마트시티 아이디어 발표회. 우수 아이디어는 다음 분기 정기 의제로 자동 등록.',
   '위례동 청년활동공간',
   now() + interval '45 days 13 hours',
   now() + interval '45 days 18 hours',
   30, 'open');

select title, location, starts_at, capacity, status
from public.events
order by starts_at
limit 5;
