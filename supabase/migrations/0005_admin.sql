-- =====================================================================
-- 관리자 권한 보강
--  - profiles: admin 도 다른 사용자 update 가능 (role 승격용)
--  - 관리자 수동 승격용 가이드 SQL (주석)
-- =====================================================================

-- profiles RLS: 본인 update 정책 외에 admin update 정책 추가
drop policy if exists "profiles 관리자 갱신" on public.profiles;
create policy "profiles 관리자 갱신"
  on public.profiles for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- 사용자 전체 조회 (관리자) — 기존 본인 select 정책에 admin 분기 이미 있음
-- 혹시 누락된 경우를 위해 보강:
drop policy if exists "profiles 관리자 전체 조회" on public.profiles;
create policy "profiles 관리자 전체 조회"
  on public.profiles for select
  using (is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- 최초 관리자 수동 지정 SQL (직접 실행)
-- 예) 본인 계정을 admin 으로 만들고 싶을 때:
--   update public.profiles set role = 'admin' where id = '<your-user-id>';
-- ─────────────────────────────────────────────────────────────────────
