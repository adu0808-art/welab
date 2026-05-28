-- =====================================================================
-- 자동화 트리거
--  - 거주확인 완료 시: 마일리지 적립 + rewards 이력 + role 승격
--  - 의제 추천 변동 시: proposals.upvotes 카운트 동기화
--  - 의제 작성 시: 작성자 마일리지 적립
--  - 댓글 작성 시: target=proposal 일 때 proposals.comments_count 증가
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) profiles.verified false → true : 보상
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_profile_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int := 200; -- REWARD_POINTS.verify
begin
  if old.verified = false and new.verified = true then
    -- 마일리지 증가
    new.mileage := coalesce(new.mileage, 0) + v_points;
    -- 등급이 guest 이면 verified 로 승격
    if new.role = 'guest' then
      new.role := 'verified';
    end if;
    -- 이력 기록 (security definer 로 RLS 우회)
    insert into public.rewards (user_id, kind, points, note)
    values (new.id, 'verify', v_points, '거주확인 완료');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_on_verified on public.profiles;
create trigger profiles_on_verified
  before update of verified on public.profiles
  for each row execute function public.on_profile_verified();

-- ─────────────────────────────────────────────────────────────────────
-- 2) proposal_upvotes 변동 → proposals.upvotes 동기화
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.sync_proposal_upvotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.proposals set upvotes = upvotes + 1 where id = new.proposal_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.proposals set upvotes = greatest(upvotes - 1, 0) where id = old.proposal_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists proposal_upvotes_sync_ins on public.proposal_upvotes;
create trigger proposal_upvotes_sync_ins
  after insert on public.proposal_upvotes
  for each row execute function public.sync_proposal_upvotes();

drop trigger if exists proposal_upvotes_sync_del on public.proposal_upvotes;
create trigger proposal_upvotes_sync_del
  after delete on public.proposal_upvotes
  for each row execute function public.sync_proposal_upvotes();

-- ─────────────────────────────────────────────────────────────────────
-- 3) proposals 작성 → 작성자 보상
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_proposal_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int := 30; -- REWARD_POINTS.proposal
begin
  if new.status <> 'draft' then
    update public.profiles
      set mileage = mileage + v_points
      where id = new.author_id;
    insert into public.rewards (user_id, kind, points, note)
    values (new.author_id, 'proposal', v_points, '의제 발의');
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_on_created on public.proposals;
create trigger proposals_on_created
  after insert on public.proposals
  for each row execute function public.on_proposal_created();

-- ─────────────────────────────────────────────────────────────────────
-- 4) comments → proposals.comments_count
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.sync_proposal_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.target_type = 'proposal' then
    update public.proposals set comments_count = comments_count + 1 where id = new.target_id;
    return new;
  elsif tg_op = 'DELETE' and old.target_type = 'proposal' then
    update public.proposals set comments_count = greatest(comments_count - 1, 0) where id = old.target_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync_proposal_ins on public.comments;
create trigger comments_sync_proposal_ins
  after insert on public.comments
  for each row execute function public.sync_proposal_comments_count();

drop trigger if exists comments_sync_proposal_del on public.comments;
create trigger comments_sync_proposal_del
  after delete on public.comments
  for each row execute function public.sync_proposal_comments_count();
