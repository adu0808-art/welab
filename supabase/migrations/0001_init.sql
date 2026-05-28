-- =====================================================================
-- WeLAB 초기 스키마 (설계서 8장)
-- 적용: supabase db push  (또는 SQL Editor 붙여넣기)
-- =====================================================================

-- 확장
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ─────────────────────────────────────────────────────────────────────
-- 1) ENUM
-- ─────────────────────────────────────────────────────────────────────
create type user_role as enum ('guest', 'verified', 'active', 'leader', 'admin');
create type district as enum ('songpa', 'seongnam', 'hanam');           -- 송파/성남/하남
create type proposal_status as enum ('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'in_progress', 'completed');
create type proposal_category as enum ('traffic', 'environment', 'safety', 'community', 'parenting', 'etc');
create type survey_status as enum ('draft', 'open', 'closed');
create type question_type as enum ('single', 'multiple', 'scale', 'ranking', 'short_text', 'long_text', 'image', 'location', 'slider');
create type vote_type as enum ('single', 'multiple', 'budget', 'ranking', 'approval', 'weighted');
create type vote_status as enum ('upcoming', 'open', 'closed');
create type project_stage as enum ('discover', 'define', 'develop', 'deploy', 'diffuse');
create type comment_target as enum ('proposal', 'survey', 'vote', 'project');
create type reward_kind as enum ('signup', 'verify', 'proposal', 'survey', 'vote', 'comment', 'event', 'badge');

-- ─────────────────────────────────────────────────────────────────────
-- 2) profiles (auth.users 1:1 확장)
-- ─────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  email_hash text,                          -- 검색용 해시 (원본은 auth.users)
  district district,                        -- 거주 지자체
  verified boolean not null default false,  -- 거주확인 완료 여부
  role user_role not null default 'guest',
  interests text[] not null default '{}',   -- 관심 카테고리
  mileage int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_district_idx on public.profiles(district);
create index profiles_role_idx on public.profiles(role);

-- 가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', '주민' || substr(new.id::text, 1, 6)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 자동 갱신 헬퍼
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 3) proposals (의제)
-- ─────────────────────────────────────────────────────────────────────
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category proposal_category not null default 'etc',
  title text not null check (char_length(title) between 5 and 100),
  body text not null check (char_length(body) >= 20),
  attachments jsonb not null default '[]'::jsonb,   -- [{path,name,size,mime}]
  location geography(Point, 4326),                   -- 50m 라운딩 후 저장
  district district,
  status proposal_status not null default 'submitted',
  is_anonymous boolean not null default false,
  upvotes int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index proposals_status_idx on public.proposals(status);
create index proposals_category_idx on public.proposals(category);
create index proposals_created_idx on public.proposals(created_at desc);
create index proposals_location_idx on public.proposals using gist (location);

create trigger proposals_touch before update on public.proposals
  for each row execute function public.touch_updated_at();

-- 추천(upvote)
create table public.proposal_upvotes (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 4) surveys / questions / responses
-- ─────────────────────────────────────────────────────────────────────
create table public.surveys (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  target_filter jsonb not null default '{}'::jsonb,  -- {district, age, interests}
  status survey_status not null default 'draft',
  allow_anonymous boolean not null default true,
  reward_points int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index surveys_status_idx on public.surveys(status);

create trigger surveys_touch before update on public.surveys
  for each row execute function public.touch_updated_at();

create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  type question_type not null,
  body text not null,
  options jsonb not null default '[]'::jsonb,        -- 보기 정의 (유형별 스키마)
  required boolean not null default true,
  position int not null default 0,
  logic_jump jsonb                                    -- 조건부 분기
);

create index questions_survey_pos_idx on public.questions(survey_id, position);

create table public.responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,        -- {question_id: value}
  is_anonymous boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create index responses_survey_idx on public.responses(survey_id);

-- ─────────────────────────────────────────────────────────────────────
-- 5) votes / ballots
-- ─────────────────────────────────────────────────────────────────────
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type vote_type not null,
  proposal_id uuid references public.proposals(id) on delete set null,
  options jsonb not null default '[]'::jsonb,         -- 후보군
  config jsonb not null default '{}'::jsonb,          -- 유형별 설정 (예산 총액 등)
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status vote_status not null default 'upcoming',
  show_realtime boolean not null default false,
  binding_level text not null default 'reference',    -- reference|advisory|binding
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index votes_status_idx on public.votes(status);

create trigger votes_touch before update on public.votes
  for each row execute function public.touch_updated_at();

create table public.vote_ballots (
  id uuid primary key default uuid_generate_v4(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice jsonb not null,                              -- 유형별 선택값
  weight numeric not null default 1.0,
  hash_chain text,                                    -- 무결성 검증용 해시
  cast_at timestamptz not null default now(),
  unique (vote_id, user_id)
);

create index vote_ballots_vote_idx on public.vote_ballots(vote_id);

-- ─────────────────────────────────────────────────────────────────────
-- 6) projects (실증과제)
-- ─────────────────────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  source_proposal_id uuid references public.proposals(id) on delete set null,
  title text not null,
  summary text,
  owner_id uuid references public.profiles(id),
  budget bigint not null default 0,
  starts_on date,
  ends_on date,
  stage project_stage not null default 'discover',
  outcomes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 7) comments (의제·과제·설문·투표 공용)
-- ─────────────────────────────────────────────────────────────────────
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  target_type comment_target not null,
  target_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  likes int not null default 0,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_target_idx on public.comments(target_type, target_id, created_at desc);

create trigger comments_touch before update on public.comments
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 8) rewards (마일리지·뱃지 이력)
-- ─────────────────────────────────────────────────────────────────────
create table public.rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind reward_kind not null,
  points int not null default 0,
  badge_code text,
  note text,
  created_at timestamptz not null default now()
);

create index rewards_user_idx on public.rewards(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 9) sensor_data (시계열 IoT — 실제 운영은 TimescaleDB 또는 별도 저장소 권장)
-- ─────────────────────────────────────────────────────────────────────
create table public.sensor_data (
  id bigserial primary key,
  sensor_id text not null,
  ts timestamptz not null default now(),
  location geography(Point, 4326),
  measure jsonb not null
);

create index sensor_data_sensor_ts_idx on public.sensor_data(sensor_id, ts desc);
