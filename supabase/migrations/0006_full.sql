-- =====================================================================
-- 확장 마이그레이션 — 실증과제 보강, 행사, 알림, 뱃지, 공지/FAQ, 자동 보상
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1) events (오프라인 행사)
-- ─────────────────────────────────────────────────────────────────────
create type event_status as enum ('draft', 'open', 'closed', 'done');

create table public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 30,
  status event_status not null default 'open',
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_status_idx on public.events(status);
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

create table public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.events enable row level security;
create policy "events 공개 조회" on public.events for select using (status <> 'draft' or is_admin(auth.uid()));
create policy "events 관리자 변경" on public.events for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

alter table public.event_registrations enable row level security;
create policy "ev_reg 본인/관리자 조회" on public.event_registrations for select
  using (user_id = auth.uid() or is_admin(auth.uid()));
create policy "ev_reg 거주확인자 신청" on public.event_registrations for insert
  with check (user_id = auth.uid() and is_verified(auth.uid()));
create policy "ev_reg 본인 취소" on public.event_registrations for delete using (user_id = auth.uid());
create policy "ev_reg 관리자 변경" on public.event_registrations for update using (is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- 2) notifications (인박스)
-- ─────────────────────────────────────────────────────────────────────
create type notification_kind as enum (
  'system', 'survey', 'vote', 'proposal', 'project', 'event', 'reward', 'comment'
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind notification_kind not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notif 본인 조회" on public.notifications for select using (user_id = auth.uid());
create policy "notif 본인 update" on public.notifications for update using (user_id = auth.uid());
-- INSERT 는 service_role / 트리거만

-- ─────────────────────────────────────────────────────────────────────
-- 3) badges (정의 + 사용자 보유)
-- ─────────────────────────────────────────────────────────────────────
create table public.badges (
  code text primary key,
  name text not null,
  description text,
  icon text,                  -- emoji or path
  rule jsonb not null default '{}'::jsonb
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_code text not null references public.badges(code) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

alter table public.badges enable row level security;
create policy "badges 공개" on public.badges for select using (true);
create policy "badges 관리자" on public.badges for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

alter table public.user_badges enable row level security;
create policy "user_badges 본인/공개 조회" on public.user_badges for select using (true);

-- 기본 뱃지 정의
insert into public.badges (code, name, description, icon) values
  ('first_step', '첫걸음', '가입 + 거주확인 완료', '🌱'),
  ('proposer', '의제 발의자', '첫 의제 발의', '💡'),
  ('voter', '투표 참여자', '첫 투표 참여', '🗳️'),
  ('survey_taker', '설문 응답자', '첫 설문 응답', '📝'),
  ('commenter', '소통가', '첫 댓글 작성', '💬'),
  ('host_attended', '행사 참여자', '첫 오프라인 행사 신청', '🎟️')
on conflict (code) do nothing;

-- 뱃지 부여 헬퍼
create or replace function public.award_badge(p_user uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_badges (user_id, badge_code) values (p_user, p_code)
  on conflict do nothing;
end;
$$;

-- 트리거: 거주확인 완료 시 first_step
create or replace function public.on_profile_verified_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.verified = false and new.verified = true then
    perform public.award_badge(new.id, 'first_step');
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_badge_first_step on public.profiles;
create trigger profiles_badge_first_step
  after update of verified on public.profiles
  for each row execute function public.on_profile_verified_badge();

-- 트리거: 첫 의제 작성 시 proposer
create or replace function public.on_proposal_first_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_badge(new.author_id, 'proposer');
  return new;
end;
$$;
drop trigger if exists proposals_badge_proposer on public.proposals;
create trigger proposals_badge_proposer
  after insert on public.proposals
  for each row execute function public.on_proposal_first_badge();

-- 트리거: 첫 투표 시 voter + 마일리지 +30P
create or replace function public.on_vote_first_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_points int := 30;
begin
  perform public.award_badge(new.user_id, 'voter');
  update public.profiles set mileage = mileage + v_points where id = new.user_id;
  insert into public.rewards (user_id, kind, points, note) values (new.user_id, 'vote', v_points, '투표 참여');
  return new;
end;
$$;
drop trigger if exists ballots_badge_voter on public.vote_ballots;
create trigger ballots_badge_voter
  after insert on public.vote_ballots
  for each row execute function public.on_vote_first_badge();

-- 트리거: 첫 설문 응답 시 survey_taker + 마일리지 = surveys.reward_points
create or replace function public.on_response_first_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_points int;
begin
  perform public.award_badge(new.user_id, 'survey_taker');
  select reward_points into v_points from public.surveys where id = new.survey_id;
  v_points := coalesce(v_points, 50);
  update public.profiles set mileage = mileage + v_points where id = new.user_id;
  insert into public.rewards (user_id, kind, points, note) values (new.user_id, 'survey', v_points, '설문 응답');
  return new;
end;
$$;
drop trigger if exists responses_badge_taker on public.responses;
create trigger responses_badge_taker
  after insert on public.responses
  for each row execute function public.on_response_first_badge();

-- 트리거: 첫 댓글 시 commenter + 5P
create or replace function public.on_comment_first_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_points int := 5;
begin
  perform public.award_badge(new.author_id, 'commenter');
  update public.profiles set mileage = mileage + v_points where id = new.author_id;
  insert into public.rewards (user_id, kind, points, note) values (new.author_id, 'comment', v_points, '댓글 작성');
  return new;
end;
$$;
drop trigger if exists comments_badge_commenter on public.comments;
create trigger comments_badge_commenter
  after insert on public.comments
  for each row execute function public.on_comment_first_badge();

-- 트리거: 첫 행사 신청 시 host_attended
create or replace function public.on_event_reg_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_badge(new.user_id, 'host_attended');
  return new;
end;
$$;
drop trigger if exists ev_reg_badge on public.event_registrations;
create trigger ev_reg_badge
  after insert on public.event_registrations
  for each row execute function public.on_event_reg_badge();

-- ─────────────────────────────────────────────────────────────────────
-- 4) notices (공지·뉴스·FAQ)
-- ─────────────────────────────────────────────────────────────────────
create type notice_kind as enum ('notice', 'news', 'faq');

create table public.notices (
  id uuid primary key default uuid_generate_v4(),
  kind notice_kind not null default 'notice',
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notices_kind_idx on public.notices(kind, created_at desc);
create trigger notices_touch before update on public.notices
  for each row execute function public.touch_updated_at();

alter table public.notices enable row level security;
create policy "notices 공개" on public.notices for select using (published or is_admin(auth.uid()));
create policy "notices 관리자" on public.notices for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────
-- 5) 실증과제 (projects) 보강
-- ─────────────────────────────────────────────────────────────────────
-- project_members 가 본인 leave/admin 변경만 가능 → 이미 OK
-- projects 작성 시 owner_id = 작성자 + 작성자도 멤버로 등록되게
-- (액션에서 처리)
