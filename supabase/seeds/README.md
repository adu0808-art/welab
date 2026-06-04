# Supabase Seeds

위례 리빙랩 데모용 시드 SQL 모음. 빈 DB 에 채우면 거의 모든 페이지에 데이터가 보입니다.

## 실행 순서

prod / dev Supabase 둘 다 동일하게 적용 가능합니다.

| # | 파일 | 내용 |
|---|---|---|
| 0 | (먼저) admin 계정 생성 + 승격 | 회원가입 후 `update profiles set role='admin' ...` |
| 1 | [proposals_real_issues.sql](proposals_real_issues.sql) | 의제 12건 |
| 2 | [02_votes.sql](02_votes.sql) | 투표 6건 (6종 유형 모두) |
| 3 | [03_surveys.sql](03_surveys.sql) | 설문 5건 (문항 18개) |
| 4 | [04_events.sql](04_events.sql) | 오프라인 행사 5건 |
| 5 | [05_notices.sql](05_notices.sql) | 공지 5 / 뉴스 3 / FAQ 5 |

각 파일을 Supabase SQL Editor 의 **New query** 에 통째로 붙여넣고 **Run**.

## 결과로 채워지는 화면

| 페이지 | 데이터 |
|---|---|
| `/proposals` | 12개 의제 카드 (카테고리·지자체 배지) |
| `/votes` | 6개 투표 카드 (진행중) |
| `/surveys` | 5개 설문 카드 |
| `/events` | 5개 행사 카드 (정원·일시·장소) |
| `/notices` | 13개 공지 (고정·일반 구분) |
| `/admin` | 카운터 6종 모두 0 이상 |
| 마이페이지 | admin 본인은 마일리지 360P+ / 뱃지 6종 자동 |

## 트리거 부수 효과

- 의제 12건 insert → admin 마일리지 +360P (의제당 30P × 12) + `proposer` 뱃지
- 행사·공지 자체는 마일리지 영향 없음 (생성자 가산 트리거 없음)
- 사용자가 직접 의제 추천/투표/설문 응답하면 그 시점에 +30/+50/+5P 추가 적립

## 다시 실행

대부분 idempotent 하지 않습니다 (같은 제목으로 중복 insert).
DB 초기화 후 재실행 권장 (`truncate ... cascade` 또는 RLS 우회 delete).
